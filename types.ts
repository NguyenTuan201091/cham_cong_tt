export interface Personnel {
  id: string;
  name: string;
  accountNo: string;
  bankName: string;
  company: string; // "Công ty nào"
}

export interface PaymentBatch {
  id: string;
  name: string; // e.g., "Đợt 1", "Ứng lương"
  date: string; // ISO date string or DD/MM/YYYY
}

export interface TransactionRow {
  id: string;
  accountNo: string;
  bankName: string;
  beneficiary: string; // Tên thụ hưởng
  basicSalary: number;
  extraSalary: number;
  note: string; // Payment Detail
  payments: { [batchId: string]: number }; // Map batchId -> amount paid in that batch
}

export interface Sheet {
  id: string;
  name: string; // e.g., "TT", "MBM", "Xe ben"
  paymentBatches: PaymentBatch[];
  rows: TransactionRow[];
}

export interface Workbook {
  month: number;
  year: number;
  sheets: Sheet[];
}

// Simple App State Wrapper
export interface AppData {
  workbooks: Workbook[]; // Store multiple months
  personnelList: Personnel[];
}