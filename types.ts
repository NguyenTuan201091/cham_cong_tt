export interface Worker {
  id: string;
  name: string;
  role: string; // Thợ chính, phụ hồ, v.v.
  dailyRate: number; // Lương cơ bản theo ngày (1 công)
  currentProjectId?: string; // ID công trình đang phụ trách
  identityCardNumber?: string; // Số CCCD
  phone?: string;
  bankAccount?: string;
  bankName?: string;
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'completed';
  standardRate?: number; // Giá mặc định cho 1 công tại công trình này
  doubleRate?: number;   // Giá trọn gói cho 2 công (nếu khác biệt)
}

export interface TimeRecord {
  id: string;
  workerId: string;
  projectId: string;
  date: string; // ISO format YYYY-MM-DD
  shifts: number; // Số công (ví dụ: 1, 0.5, 1.5, 2)
  rateUsed: number; // Đơn giá áp dụng cho bản ghi này (để tính tiền linh hoạt)
  note?: string;
}

export type TransactionType = 'advance' | 'payment'; // Ứng lương | Thanh toán lương

export interface Transaction {
  id: string;
  workerId: string;
  type: TransactionType;
  amount: number;
  date: string;
  note?: string;
}

export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: string; // e.g., "Chấm công", "Thêm nhân viên"
    details: string; // e.g., "Chấm công cho 3 người ngày 2023-10-20"
    timestamp: string;
}

export type ViewMode = 'dashboard' | 'timesheet' | 'payroll' | 'debt' | 'workers' | 'projects' | 'logs' | 'backup';

export interface WeeklyPayrollItem {
  worker: Worker;
  totalShifts: number;
  totalAmount: number;
  details: TimeRecord[];
  projectNames: string[]; // Added specifically for UI display
}