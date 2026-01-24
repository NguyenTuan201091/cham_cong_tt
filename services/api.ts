// services/api.ts
import { AppData, Workbook } from '../types';

const STORAGE_KEY = 'payroll_app_data_v2';

const defaultData: AppData = {
  workbooks: [],
  personnelList: []
};

export const api = {
  async getData(): Promise<AppData> {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return defaultData;
    try {
      return JSON.parse(json);
    } catch {
      return defaultData;
    }
  },

  async saveData(data: AppData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Helper to get specific workbook or create if missing
  async getWorkbook(month: number, year: number): Promise<Workbook> {
    const data = await this.getData();
    let book = data.workbooks.find(w => w.month === month && w.year === year);
    if (!book) {
      book = { month, year, sheets: [] };
      data.workbooks.push(book);
      await this.saveData(data);
    }
    return book;
  },

  async saveWorkbook(wb: Workbook) {
    const data = await this.getData();
    const idx = data.workbooks.findIndex(w => w.month === wb.month && w.year === wb.year);
    if (idx >= 0) {
      data.workbooks[idx] = wb;
    } else {
      data.workbooks.push(wb);
    }
    await this.saveData(data);
  }
};

