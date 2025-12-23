import { Worker, Project, TimeRecord, Transaction, ActivityLog } from "../types";
import { MOCK_WORKERS, MOCK_PROJECTS, MOCK_RECORDS, MOCK_TRANSACTIONS, MOCK_LOGS } from "../constants";

// Base URL for your API.
const API_BASE = '/api';

const headers = {
    'Content-Type': 'application/json',
};

// Generic fetch wrapper
const fetchJson = async (url: string, options?: RequestInit) => {
    try {
        const res = await fetch(`${API_BASE}${url}`, {
            headers,
            ...options,
        });
        
        if (!res.ok) {
            // Throw error to trigger fallback
            throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        
        if (res.status === 204) return null;
        
        // Check if response has content before parsing
        const text = await res.text();
        return text ? JSON.parse(text) : null;
    } catch (err) {
        throw err;
    }
};

// --- LocalStorage "Database" Helper ---
const STORAGE_KEYS = {
    WORKERS: 'tt_app_workers',
    PROJECTS: 'tt_app_projects',
    RECORDS: 'tt_app_records',
    TRANSACTIONS: 'tt_app_transactions',
    LOGS: 'tt_app_logs',
};

const LocalDB = {
    get: <T>(key: string, defaultData: T): T => {
        if (typeof window === 'undefined') return defaultData;
        try {
            const stored = localStorage.getItem(key);
            if (!stored) {
                localStorage.setItem(key, JSON.stringify(defaultData));
                return defaultData;
            }
            return JSON.parse(stored);
        } catch (e) {
            console.error(`Error reading ${key} from LocalStorage, resetting to default`, e);
            localStorage.setItem(key, JSON.stringify(defaultData));
            return defaultData;
        }
    },
    set: <T>(key: string, data: T): T => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (e) {
                console.error(`Error writing ${key} to LocalStorage`, e);
                alert("Bộ nhớ trình duyệt đã đầy hoặc bị chặn. Dữ liệu có thể không được lưu.");
            }
        }
        return data;
    },
    addItem: <T>(key: string, item: T, defaultList: T[]): T => {
        const list = LocalDB.get<T[]>(key, defaultList);
        const newList = [item, ...list];
        LocalDB.set(key, newList);
        return item;
    },
    updateItem: <T extends { id: string }>(key: string, item: T, defaultList: T[]): T => {
        const list = LocalDB.get<T[]>(key, defaultList);
        const newList = list.map(i => i.id === item.id ? item : i);
        LocalDB.set(key, newList);
        return item;
    },
    deleteItem: <T extends { id: string }>(key: string, id: string, defaultList: T[]): void => {
        const list = LocalDB.get<T[]>(key, defaultList);
        const newList = list.filter(i => i.id !== id);
        LocalDB.set(key, newList);
    }
};

// Helper function to handle API calls with LocalStorage fallback
const callApi = async <T>(
    apiCall: () => Promise<T>, 
    fallbackLogic: () => T
): Promise<T> => {
    try {
        return await apiCall();
    } catch (error) {
        // Only log warning in development or if it's not a standard 404
        // console.warn(`Switching to offline mode for operation due to:`, error);
        return fallbackLogic();
    }
};

export const api = {
    // --- Workers ---
    getWorkers: (): Promise<Worker[]> => 
        callApi(
            () => fetchJson('/workers'), 
            () => LocalDB.get(STORAGE_KEYS.WORKERS, MOCK_WORKERS)
        ),
        
    createWorker: (data: Worker): Promise<Worker> => 
        callApi(
            () => fetchJson('/workers', { method: 'POST', body: JSON.stringify(data) }), 
            () => LocalDB.addItem(STORAGE_KEYS.WORKERS, data, MOCK_WORKERS)
        ),
        
    updateWorker: (data: Worker): Promise<Worker> => 
        callApi(
            () => fetchJson(`/workers/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), 
            () => LocalDB.updateItem(STORAGE_KEYS.WORKERS, data, MOCK_WORKERS)
        ),
        
    deleteWorker: (id: string): Promise<void> => 
        callApi(
            () => fetchJson(`/workers/${id}`, { method: 'DELETE' }), 
            () => LocalDB.deleteItem(STORAGE_KEYS.WORKERS, id, MOCK_WORKERS)
        ),

    // --- Projects ---
    getProjects: (): Promise<Project[]> => 
        callApi(
            () => fetchJson('/projects'), 
            () => LocalDB.get(STORAGE_KEYS.PROJECTS, MOCK_PROJECTS)
        ),
        
    createProject: (data: Project): Promise<Project> => 
        callApi(
            () => fetchJson('/projects', { method: 'POST', body: JSON.stringify(data) }), 
            () => LocalDB.addItem(STORAGE_KEYS.PROJECTS, data, MOCK_PROJECTS)
        ),
        
    updateProject: (data: Project): Promise<Project> => 
        callApi(
            () => fetchJson(`/projects/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), 
            () => LocalDB.updateItem(STORAGE_KEYS.PROJECTS, data, MOCK_PROJECTS)
        ),
        
    deleteProject: (id: string): Promise<void> => 
        callApi(
            () => fetchJson(`/projects/${id}`, { method: 'DELETE' }), 
            () => LocalDB.deleteItem(STORAGE_KEYS.PROJECTS, id, MOCK_PROJECTS)
        ),

    // --- Records (Timesheet) ---
    getRecords: (): Promise<TimeRecord[]> => 
        callApi(
            () => fetchJson('/records'), 
            () => LocalDB.get(STORAGE_KEYS.RECORDS, MOCK_RECORDS)
        ),
        
    createRecords: (data: TimeRecord[]): Promise<TimeRecord[]> => 
        callApi(
            () => fetchJson('/records/batch', { method: 'POST', body: JSON.stringify(data) }), 
            () => {
                const current = LocalDB.get(STORAGE_KEYS.RECORDS, MOCK_RECORDS);
                const updated = [...current, ...data];
                LocalDB.set(STORAGE_KEYS.RECORDS, updated);
                return data;
            }
        ),
        
    updateRecord: (id: string, shifts: number, rate: number): Promise<TimeRecord> => 
        callApi(
            () => fetchJson(`/records/${id}`, { method: 'PATCH', body: JSON.stringify({ shifts, rateUsed: rate }) }), 
            () => {
                const list = LocalDB.get<TimeRecord[]>(STORAGE_KEYS.RECORDS, MOCK_RECORDS);
                const updatedList = list.map(r => r.id === id ? { ...r, shifts, rateUsed: rate } : r);
                LocalDB.set(STORAGE_KEYS.RECORDS, updatedList);
                return updatedList.find(r => r.id === id) as TimeRecord;
            }
        ),
        
    deleteRecord: (id: string): Promise<void> => 
        callApi(
            () => fetchJson(`/records/${id}`, { method: 'DELETE' }), 
            () => LocalDB.deleteItem(STORAGE_KEYS.RECORDS, id, MOCK_RECORDS)
        ),

    // --- Transactions ---
    getTransactions: (): Promise<Transaction[]> => 
        callApi(
            () => fetchJson('/transactions'), 
            () => LocalDB.get(STORAGE_KEYS.TRANSACTIONS, MOCK_TRANSACTIONS)
        ),
        
    createTransaction: (data: Transaction): Promise<Transaction> => 
        callApi(
            () => fetchJson('/transactions', { method: 'POST', body: JSON.stringify(data) }), 
            () => LocalDB.addItem(STORAGE_KEYS.TRANSACTIONS, data, MOCK_TRANSACTIONS)
        ),

    // --- Logs ---
    getLogs: (): Promise<ActivityLog[]> => 
        callApi(
            () => fetchJson('/logs'), 
            () => LocalDB.get(STORAGE_KEYS.LOGS, MOCK_LOGS)
        ),
        
    createLog: (data: ActivityLog): Promise<ActivityLog> => 
        callApi(
            () => fetchJson('/logs', { method: 'POST', body: JSON.stringify(data) }), 
            () => LocalDB.addItem(STORAGE_KEYS.LOGS, data, MOCK_LOGS)
        ),

    // --- System ---
    restoreBackup: (data: any): Promise<void> => 
        callApi(
            () => fetchJson('/system/restore', { method: 'POST', body: JSON.stringify(data) }), 
            () => {
                if(data.workers) LocalDB.set(STORAGE_KEYS.WORKERS, data.workers);
                if(data.projects) LocalDB.set(STORAGE_KEYS.PROJECTS, data.projects);
                if(data.records) LocalDB.set(STORAGE_KEYS.RECORDS, data.records);
                if(data.transactions) LocalDB.set(STORAGE_KEYS.TRANSACTIONS, data.transactions);
                if(data.logs) LocalDB.set(STORAGE_KEYS.LOGS, data.logs);
                return Promise.resolve();
            }
        ),
};