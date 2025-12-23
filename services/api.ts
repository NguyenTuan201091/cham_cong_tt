// services/api.ts
// Lớp API làm việc với Postgres thông qua endpoint /api/storage
// Toàn bộ dữ liệu app nằm trong một object AppStorage, backend chịu trách nhiệm lưu vào DB.

const API_BASE = "/api";

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

// ---- Helper chung ----
const fetchJSON = async (url: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  if (res.status === 204) return null;
  return res.json();
};

export const api = {
  // ===== Storage gốc =====
  async getStorage(): Promise<AppStorage> {
    const data = await fetchJSON("/storage");
    return {
      ...defaultStorage,
      ...(data || {}),
    };
  },

  async saveStorage(data: AppStorage): Promise<void> {
    await fetchJSON("/storage", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // ===== Workers (Công nhật) =====
  async getWorkers() {
    const s = await this.getStorage();
    return s.workers;
  },

  async createWorker(worker: any) {
    const s = await this.getStorage();
    s.workers = [...s.workers, worker];
    await this.saveStorage(s);
    return worker;
  },

  // Giữ lại alias cũ nếu code cũ dùng addWorker
  async addWorker(worker: any) {
    return this.createWorker(worker);
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

  // ===== Projects (Công trình) =====
  async getProjects() {
    const s = await this.getStorage();
    return s.projects;
  },

  async createProject(project: any) {
    const s = await this.getStorage();
    s.projects = [...s.projects, project];
    await this.saveStorage(s);
    return project;
  },

  async updateProject(project: any) {
    const s = await this.getStorage();
    s.projects = s.projects.map((p) => (p.id === project.id ? project : p));
    await this.saveStorage(s);
    return project;
  },

  async deleteProject(id: string) {
    const s = await this.getStorage();
    s.projects = s.projects.filter((p) => p.id !== id);
    await this.saveStorage(s);
  },

  async saveProjects(projects: any[]) {
    const s = await this.getStorage();
    s.projects = projects;
    await this.saveStorage(s);
  },

  // ===== Time records (Chấm công) =====
  async getRecords() {
    const s = await this.getStorage();
    return s.records;
  },

  // Tạo nhiều bản ghi cùng lúc (App.ts đang dùng)
  async createRecords(newRecords: any[]) {
    const s = await this.getStorage();
    s.records = [...s.records, ...newRecords];
    await this.saveStorage(s);
    return newRecords;
  }

  ,
  async updateRecord(id: string, shifts: number, rateUsed: number) {
    const s = await this.getStorage();
    let updated: any | undefined;

    s.records = s.records.map((r) => {
      if (r.id === id) {
        updated = { ...r, shifts, rateUsed };
        return updated;
      }
      return r;
    });

    if (!updated) {
      throw new Error("Record not found");
    }

    await this.saveStorage(s);
    return updated;
  },

  async deleteRecord(id: string) {
    const s = await this.getStorage();
    const before = s.records.length;
    s.records = s.records.filter((r) => r.id !== id);

    // Nếu không tìm thấy ID thì báo cụ thể (hỗ trợ debug)
    if (s.records.length === before) {
      throw new Error("Record not found");
    }

    await this.saveStorage(s);
  },

  async saveRecords(records: any[]) {
    const s = await this.getStorage();
    s.records = records;
    await this.saveStorage(s);
  },

  // ===== Transactions (Ứng / Thanh toán) =====
  async getTransactions() {
    const s = await this.getStorage();
    return s.transactions;
  },

  async createTransaction(tx: any) {
    const s = await this.getStorage();
    s.transactions = [...s.transactions, tx];
    await this.saveStorage(s);
    return tx;
  },

  async saveTransactions(transactions: any[]) {
    const s = await this.getStorage();
    s.transactions = transactions;
    await this.saveStorage(s);
  },

  // ===== Logs (Nhật ký hoạt động) =====
  async getLogs() {
    const s = await this.getStorage();
    return s.logs;
  },

  async createLog(log: any) {
    const s = await this.getStorage();
    s.logs = [log, ...s.logs];
    await this.saveStorage(s);
    return log;
  },

  // Alias tên cũ nếu trước đây dùng addLog
  async addLog(log: any) {
    return this.createLog(log);
  },

  // ===== Backup / Restore =====
  async restoreBackup(data: Partial<AppStorage>) {
    // Gộp với defaultStorage để tránh field bị thiếu
    const merged: AppStorage = {
      ...defaultStorage,
      ...(data as any),
    };
    await this.saveStorage(merged);
  },
};
