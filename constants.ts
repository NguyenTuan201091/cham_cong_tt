import { Project, TimeRecord, Worker, Transaction, User, ActivityLog } from "./types";

export const MOCK_USERS: User[] = [
    { id: 'u1', username: 'admin', name: 'Tuấn', role: 'admin' },
    { id: 'u2', username: 'luc', name: 'Lực', role: 'user' },
    { id: 'u3', username: 'du', name: 'Dũ', role: 'user' },
];

export const MOCK_WORKERS: Worker[] = [
  { id: 'w1', name: 'Nguyễn Văn A', role: 'Thợ Chính', dailyRate: 500000, currentProjectId: 'p1', identityCardNumber: '079090001234', phone: '0901234567', bankAccount: '1903456789', bankName: 'Techcombank' },
  { id: 'w2', name: 'Trần Văn B', role: 'Phụ Hồ', dailyRate: 350000, currentProjectId: 'p1', identityCardNumber: '079091005678', phone: '0909876543' },
  { id: 'w3', name: 'Lê Thị C', role: 'Phụ Hồ', dailyRate: 350000, currentProjectId: 'p2', identityCardNumber: '079092009012', phone: '0912345678' },
  { id: 'w4', name: 'Phạm Văn D', role: 'Kỹ Sư', dailyRate: 800000, currentProjectId: 'p1', identityCardNumber: '079088003456', phone: '0988776655', bankAccount: '999888777', bankName: 'Vietcombank' },
];

export const MOCK_PROJECTS: Project[] = [
  { id: 'p1', name: 'Biệt thự Quận 7', address: '123 Nguyễn Văn Linh', status: 'active', standardRate: 500000, doubleRate: 1100000 },
  { id: 'p2', name: 'Nhà phố Thủ Đức', address: '45 Võ Văn Ngân', status: 'active', standardRate: 400000, doubleRate: 850000 },
  { id: 'p3', name: 'Cải tạo Chung cư', address: '88 Lý Thường Kiệt', status: 'completed' },
];

// Helper to find worker rate for mock generation
const getRate = (workerId: string) => MOCK_WORKERS.find(w => w.id === workerId)?.dailyRate || 0;

// Generate some initial records for the current week
const generateMockRecords = (): TimeRecord[] => {
  const records: TimeRecord[] = [];
  const today = new Date();
  // Generate for last 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add random records
    if (i % 6 !== 0) { // Skip some days (Sunday-ish)
        // Record for Worker 1 (Project 1)
        records.push({
            id: `r-${i}-1`,
            workerId: 'w1',
            projectId: 'p1',
            date: dateStr,
            shifts: 1,
            rateUsed: getRate('w1')
        });
        
        // Record for Worker 2 (Project 1)
        if (i === 2) {
             records.push({
                id: `r-${i}-2`,
                workerId: 'w2',
                projectId: 'p1',
                date: dateStr,
                shifts: 2,
                rateUsed: 325000, 
                note: 'Tăng ca đổ bê tông'
            });
        } else {
             records.push({
                id: `r-${i}-2`,
                workerId: 'w2',
                projectId: 'p1', // Fixed: w2 works in p1, not p2
                date: dateStr,
                shifts: 1,
                rateUsed: getRate('w2')
            });
        }

        // Record for Worker 3 (Project 2)
        records.push({
            id: `r-${i}-3`,
            workerId: 'w3',
            projectId: 'p2',
            date: dateStr,
            shifts: 1,
            rateUsed: getRate('w3')
        });
    }
  }
  return records;
};

export const MOCK_RECORDS: TimeRecord[] = generateMockRecords();

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 't1', workerId: 'w1', type: 'advance', amount: 1000000, date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0], note: 'Ứng tiền ăn' },
    { id: 't2', workerId: 'w2', type: 'advance', amount: 500000, date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0], note: 'Mượn xăng xe' },
    { id: 't3', workerId: 'w1', type: 'payment', amount: 2000000, date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString().split('T')[0], note: 'Thanh toán tuần trước' },
];

export const MOCK_LOGS: ActivityLog[] = [
    { id: 'l1', userId: 'u1', userName: 'Tuấn', action: 'Đăng nhập', details: 'Đăng nhập vào hệ thống', timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString() },
    { id: 'l2', userId: 'u2', userName: 'Lực', action: 'Chấm công', details: 'Chấm công cho Nguyễn Văn A (p1)', timestamp: new Date().toISOString() },
];