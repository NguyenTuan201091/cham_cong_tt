import { Worker, Project, TimeRecord, Transaction, ActivityLog } from "../types";
import { MOCK_WORKERS, MOCK_PROJECTS, MOCK_RECORDS, MOCK_TRANSACTIONS, MOCK_LOGS } from "../constants";

// Base URL for your API. When deployed on Vercel, this is typically just '/api'
const API_BASE = '/api';

const headers = {
    'Content-Type': 'application/json',
};

// Generic fetch wrapper
const fetchJson = async (url: string, options?: RequestInit) => {
    // Try fetching from the real API
    const res = await fetch(`${API_BASE}${url}`, {
        headers,
        ...options,
    });
    
    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    
    if (res.status === 204) return null;
    return res.json();
};

// Helper function to handle API calls with automatic fallback to Mock Data
// This is useful during development or migration when the backend isn't fully ready yet.
const callApi = async <T>(
    apiCall: () => Promise<T>, 
    fallbackValue: T | (() => T),
    shouldLogWarning = true
): Promise<T> => {
    try {
        return await apiCall();
    } catch (error) {
        if (shouldLogWarning) {
            console.warn(`API unavailable (using Mock Data):`, error);
        }
        // If fallbackValue is a function (e.g. for generating an ID), call it
        return typeof fallbackValue === 'function' ? (fallbackValue as () => T)() : fallbackValue;
    }
};

export const api = {
    // --- Workers ---
    getWorkers: (): Promise<Worker[]> => 
        callApi(() => fetchJson('/workers'), MOCK_WORKERS),
        
    createWorker: (data: Worker): Promise<Worker> => 
        callApi(() => fetchJson('/workers', { method: 'POST', body: JSON.stringify(data) }), data),
        
    updateWorker: (data: Worker): Promise<Worker> => 
        callApi(() => fetchJson(`/workers/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), data),
        
    deleteWorker: (id: string): Promise<void> => 
        callApi(() => fetchJson(`/workers/${id}`, { method: 'DELETE' }), undefined),

    // --- Projects ---
    getProjects: (): Promise<Project[]> => 
        callApi(() => fetchJson('/projects'), MOCK_PROJECTS),
        
    createProject: (data: Project): Promise<Project> => 
        callApi(() => fetchJson('/projects', { method: 'POST', body: JSON.stringify(data) }), data),
        
    updateProject: (data: Project): Promise<Project> => 
        callApi(() => fetchJson(`/projects/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }), data),
        
    deleteProject: (id: string): Promise<void> => 
        callApi(() => fetchJson(`/projects/${id}`, { method: 'DELETE' }), undefined),

    // --- Records (Timesheet) ---
    getRecords: (): Promise<TimeRecord[]> => 
        callApi(() => fetchJson('/records'), MOCK_RECORDS),
        
    createRecords: (data: TimeRecord[]): Promise<TimeRecord[]> => 
        callApi(() => fetchJson('/records/batch', { method: 'POST', body: JSON.stringify(data) }), data),
        
    updateRecord: (id: string, shifts: number, rate: number): Promise<TimeRecord> => 
        callApi(
            () => fetchJson(`/records/${id}`, { method: 'PATCH', body: JSON.stringify({ shifts, rateUsed: rate }) }), 
            () => {
                const record = MOCK_RECORDS.find(r => r.id === id);
                return record ? { ...record, shifts, rateUsed: rate } : { id, shifts, rateUsed: rate } as any;
            }
        ),
        
    deleteRecord: (id: string): Promise<void> => 
        callApi(() => fetchJson(`/records/${id}`, { method: 'DELETE' }), undefined),

    // --- Transactions ---
    getTransactions: (): Promise<Transaction[]> => 
        callApi(() => fetchJson('/transactions'), MOCK_TRANSACTIONS),
        
    createTransaction: (data: Transaction): Promise<Transaction> => 
        callApi(() => fetchJson('/transactions', { method: 'POST', body: JSON.stringify(data) }), data),

    // --- Logs ---
    getLogs: (): Promise<ActivityLog[]> => 
        callApi(() => fetchJson('/logs'), MOCK_LOGS),
        
    createLog: (data: ActivityLog): Promise<ActivityLog> => 
        callApi(() => fetchJson('/logs', { method: 'POST', body: JSON.stringify(data) }), data, false), // Don't log warnings for background logging

    // --- System ---
    restoreBackup: (data: any): Promise<void> => 
        callApi(() => fetchJson('/system/restore', { method: 'POST', body: JSON.stringify(data) }), undefined),
};