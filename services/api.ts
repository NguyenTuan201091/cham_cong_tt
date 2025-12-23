// services/api.ts
// API layer dùng PostgreSQL thông qua /api/storage
// KHÔNG localStorage – KHÔNG mock data

const API_BASE = '/api';

export type AppStorage = {
  workers: any[];
  projects: any[];
  records: any[];
  transactions: any[];
  logs: any[];
};

const defaultStorage: AppStorage = {
  workers: [],
  projects: [],
  records: [],
  transactions: [],
  logs: [],
};

// ---- Helpers ----
const fetchJSON = async (url: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
};

// ---- Storage API ----
export const api = {
  // 🔹 LẤY TOÀN BỘ DATA TỪ POSTGRES
  async getStorage(): Promise<AppStorage> {
    const data = await fetchJSON('/storage');
    return {
      ...defaultStorage,
      ...data,
    };
  },

  // 🔹 LƯU TOÀN BỘ DATA LÊN POSTGRES
  async saveStorage(data: AppStorage): Promise<void> {
    await fetchJSON('/storage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // -------------------------
  // 🔽 CÁC HÀM TIỆN ÍCH (CRUD)
  // -------------------------

  async getWorkers() {
    const s = await this.getStorage();
    return s.workers;
  },

  async addWorker(worker: any) {
    const s = await this.getStorage();
    s.workers = [worker, ...s.workers];
    await this.saveStorage(s);
    return worker;
  },

  async updateWorker(worker: any) {
    const s = await this.getStorage();
    s.workers = s.workers.map((w) => (w.id === worker.id ? worker : w));
    await this.saveStorage(s);
    return worker;
  },

  async deleteWorker(id: string) {
    const s = await this.getStorage();
    s.workers = s.workers.filter((w) => w.id !== id);
    await this.saveStorage(s);
  },

  async getProjects() {
    const s = await this.getStorage();
    return s.projects;
  },

  async saveProjects(projects: any[]) {
    const s = await this.getStorage();
    s.projects = projects;
    await this.saveStorage(s);
  },

  async getRecords() {
    const s = await this.getStorage();
    return s.records;
  },

  async saveRecords(records: any[]) {
    const s = await this.getStorage();
    s.records = records;
    await this.saveStorage(s);
  },

  async getTransactions() {
    const s = await this.getStorage();
    return s.transactions;
  },

  async saveTransactions(transactions: any[]) {
    const s = await this.getStorage();
    s.transactions = transactions;
    await this.saveStorage(s);
  },

  async getLogs() {
    const s = await this.getStorage();
    return s.logs;
  },

  async addLog(log: any) {
    const s = await this.getStorage();
    s.logs = [log, ...s.logs];
    await this.saveStorage(s);
    return log;
  },
};
