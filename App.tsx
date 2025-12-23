import React, { useState, useMemo, useEffect } from 'react';
import { Worker, Project, TimeRecord, ViewMode, WeeklyPayrollItem, Transaction, User, ActivityLog } from './types';
import { MOCK_USERS } from './constants'; // Only keeping Users for Auth simulation
import { analyzePayroll } from './services/geminiService';
import { api } from './services/api';
import {
  LayoutDashboard,
  Users,
  HardHat,
  CalendarClock,
  Banknote,
  Menu,
  X,
  Plus,
  Trash2,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  Filter,
  Wallet,
  ArrowRightLeft,
  Calendar,
  Briefcase,
  IdCard,
  Printer,
  FileDown,
  LogOut,
  History,
  Lock,
  Settings,
  Database,
  Upload,
  Download,
  AlertTriangle,
  Edit,
  Check,
  XCircle,
  Undo2,
  Info,
  Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// --- Utility Functions ---

// Safe ID Generator (crypto.randomUUID crashes in non-secure contexts like http://localhost)
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Calculate the End of the payroll week (Thursday) based on a selected date
const getThursdayOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) ... 4 (Thu) ... 6 (Sat)
  
  let diff = 4 - day;
  if (diff < 0) {
      diff += 7; // If it's Fri (5) or Sat (6), go to next week's Thursday
  }
  
  d.setDate(d.getDate() + diff);
  return d;
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
};

const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN');
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// --- Components ---

const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium animate-pulse">Đang đồng bộ dữ liệu...</p>
    </div>
);

// New Confirmation Modal Component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 transform transition-all scale-100">
        <div className="flex items-center gap-3 mb-3 text-red-600">
           <AlertTriangle className="w-6 h-6" />
           <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" /> Xóa ngay
          </button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = MOCK_USERS.find(u => u.username === username);
        
        if (user) {
            let isValid = false;
            if (user.username === 'admin' && password === 'Tuan123456@') isValid = true;
            else if ((user.username === 'luc' || user.username === 'du') && password === '123456') isValid = true;
            
            if (isValid) {
                onLogin(user);
            } else {
                setError('Mật khẩu không đúng.');
            }
        } else {
            setError('Tên đăng nhập không tồn tại.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                        <Lock className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">Đăng Nhập Hệ Thống</h1>
                    <p className="text-slate-500 mt-2">Chấm công công nhật T&T</p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
                        <select 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="">-- Chọn người dùng --</option>
                            {MOCK_USERS.map(u => (
                                <option key={u.id} value={u.username}>{u.name} ({u.username})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Đăng Nhập
                    </button>
                </form>
                <div className="mt-6 text-center text-xs text-slate-400">
                    <p>Hệ thống nội bộ T&T</p>
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ currentView, setView, mobileOpen, setMobileOpen, currentUser, onLogout }: {
  currentView: ViewMode,
  setView: (v: ViewMode) => void,
  mobileOpen: boolean,
  setMobileOpen: (v: boolean) => void,
  currentUser: User,
  onLogout: () => void
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'timesheet', label: 'Chấm Công', icon: CalendarClock },
    { id: 'payroll', label: 'Bảng Lương', icon: Banknote },
    { id: 'debt', label: 'Công Nợ & Ứng', icon: Wallet },
    { id: 'workers', label: 'Công Nhật', icon: Users },
    { id: 'projects', label: 'Công Trình', icon: HardHat },
  ];

  if (currentUser.role === 'admin') {
      menuItems.push({ id: 'logs', label: 'Nhật Ký', icon: History });
      menuItems.push({ id: 'backup', label: 'Sao Lưu & Phục Hồi', icon: Database });
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden print:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden flex flex-col`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-800 shrink-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Chấm công T&T</h1>
        </div>
        
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
                    {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{currentUser.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                </div>
            </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as ViewMode);
                  setMobileOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
            <button 
                onClick={onLogout}
                className="flex items-center w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
            >
                <LogOut className="w-5 h-5 mr-3" />
                <span className="font-medium">Đăng Xuất</span>
            </button>
        </div>
      </div>
    </>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-sm z-50">
        <p className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
        <p className="text-blue-600 font-bold mb-2">
          Tổng: {data.shifts} công
        </p>
        {data.details && Object.keys(data.details).length > 0 && (
          <div className="space-y-1">
             <p className="text-xs font-semibold text-slate-400 uppercase">Chi tiết:</p>
             {Object.entries(data.details).map(([pName, count]: [string, any]) => (
               <div key={pName} className="flex justify-between gap-6 text-xs text-slate-600">
                  <span className="truncate max-w-[150px]">{pName}:</span>
                  <span className="font-medium">{count}</span>
               </div>
             ))}
          </div>
        )}
      </div>
    );
  }
  return null;
};

const Dashboard = ({ workers, projects, records }: { workers: Worker[], projects: Project[], records: TimeRecord[] }) => {
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalShiftsRecorded = records.length;
  
  const chartData = useMemo(() => {
     const data: any[] = [];
     const today = new Date();
     for(let i=6; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayRecords = records.filter(r => r.date === dateStr);
        const totalShifts = dayRecords.reduce((acc, curr) => acc + curr.shifts, 0);
        
        // Group by project
        const details: Record<string, number> = {};
        dayRecords.forEach(r => {
             const project = projects.find(p => p.id === r.projectId);
             const pName = project ? project.name : 'Khác';
             details[pName] = (details[pName] || 0) + r.shifts;
        });

        data.push({
            name: `${d.getDate()}/${d.getMonth()+1}`,
            shifts: totalShifts,
            details: details
        });
     }
     return data;
  }, [records, projects]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Tổng Quan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng Công Nhật</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{workers.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Công Trình Đang Chạy</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{activeProjects}</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <HardHat className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lượt Chấm Công</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{totalShiftsRecorded}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <CalendarClock className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Biểu Đồ Chấm Công (7 Ngày Qua)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Bar dataKey="shifts" name="Số công" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

const Timesheet = ({ workers, projects, records, onAddRecord, onUpdateRecord, onDeleteRecord }: { 
    workers: Worker[], 
    projects: Project[], 
    records: TimeRecord[],
    onAddRecord: (records: TimeRecord[]) => void,
    onUpdateRecord: (id: string, shifts: number, rate: number) => void,
    onDeleteRecord: (id: string) => void
}) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
    const [filterByProject, setFilterByProject] = useState(true);
    
    // Deletion Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [inputs, setInputs] = useState<Record<string, { shifts: number, customRate: number, selected: boolean, note: string }>>({});

    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [editShiftValue, setEditShiftValue] = useState<number>(0);
    const [editRateValue, setEditRateValue] = useState<number>(0); 

    const filteredWorkers = useMemo(() => {
        if (!filterByProject || !projectId) return workers;
        return workers.filter(w => w.currentProjectId === projectId);
    }, [workers, projectId, filterByProject]);

    // Use strictly formatted strings for comparison to avoid any type coercion issues
    const existingRecords = useMemo(() => {
        return records.filter(r => r.date === date && String(r.projectId) === String(projectId));
    }, [records, date, projectId]);

    const currentProjectName = projects.find(p => p.id === projectId)?.name || 'Không xác định';

    const calculateRecommendedRate = (currentProjectId: string, shifts: number, defaultWorkerRate: number): number => {
        const project = projects.find(p => p.id === currentProjectId);
        if (!project) return defaultWorkerRate;
        if (shifts === 2 && project.doubleRate) return project.doubleRate / 2;
        if (project.standardRate) return project.standardRate;
        return defaultWorkerRate;
    };

    useEffect(() => {
        const initialInputs: any = {};
        workers.forEach(w => {
            const targetProjectId = projectId;
            const rate = calculateRecommendedRate(targetProjectId, 1, w.dailyRate);

            initialInputs[w.id] = { 
                shifts: 1, 
                customRate: rate,
                selected: false, 
                note: '' 
            };
        });
        setInputs(initialInputs);
    }, [workers, projectId, projects]);

    const handleInputChange = (workerId: string, field: string, value: any) => {
        setInputs(prev => {
            const current = prev[workerId];
            let newState = { ...current, [field]: value };
            if (field === 'shifts') {
                const worker = workers.find(w => w.id === workerId);
                if (worker) {
                    const newRate = calculateRecommendedRate(projectId, Number(value), worker.dailyRate);
                    newState.customRate = newRate;
                }
            }
            return { ...prev, [workerId]: newState };
        });
    };

    const handleSave = () => {
        const newRecords: TimeRecord[] = [];
        filteredWorkers.forEach(worker => {
            const data = inputs[worker.id];
            if (data && data.selected) {
                 newRecords.push({
                    id: generateId(),
                    workerId: worker.id,
                    projectId,
                    date,
                    shifts: data.shifts,
                    rateUsed: data.customRate, 
                    note: data.note
                });
            }
        });
        
        if (newRecords.length === 0) {
            alert("Vui lòng chọn ít nhất một công nhật để chấm công.");
            return;
        }

        onAddRecord(newRecords);
        setInputs(prev => {
            const next = { ...prev };
            filteredWorkers.forEach(w => {
                if(next[w.id]) next[w.id].selected = false;
            });
            return next;
        });
    };

    const startEditing = (record: TimeRecord) => {
        setEditingRecordId(record.id);
        setEditShiftValue(record.shifts);
        setEditRateValue(record.rateUsed); 
    };

    const saveEdit = () => {
        if (editingRecordId) {
            onUpdateRecord(editingRecordId, editShiftValue, editRateValue);
            setEditingRecordId(null);
        }
    };

    const confirmDelete = () => {
        if (deleteId) {
            onDeleteRecord(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-6">
            <ConfirmationModal 
                isOpen={!!deleteId} 
                title="Xóa Chấm Công"
                message="Bạn có chắc chắn muốn xóa bản ghi chấm công này không? Hành động này không thể hoàn tác."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteId(null)}
            />

             <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">Chấm Công Hàng Ngày</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <input 
                            type="date" 
                            value={date} 
                            onChange={(e) => setDate(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <select 
                            value={projectId} 
                            onChange={(e) => setProjectId(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <label className="flex items-center cursor-pointer select-none">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 text-blue-600 rounded mr-2" 
                            checked={filterByProject}
                            onChange={(e) => setFilterByProject(e.target.checked)}
                        />
                        <div className="text-slate-700 font-medium">Chỉ hiện công nhật thuộc công trình này</div>
                    </label>
                </div>
            </div>

            {/* Section: Add New Records */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                    Bảng Chấm Công (Thêm Mới)
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 w-12"><input type="checkbox" onChange={(e) => { const checked = e.target.checked; setInputs(prev => { const next = { ...prev }; filteredWorkers.forEach(w => { if(next[w.id]) next[w.id].selected = checked; }); return next; }); }} /></th>
                                <th className="p-4 font-semibold text-slate-700">Công Nhật</th>
                                <th className="p-4 font-semibold text-slate-700">Công (Shift)</th>
                                <th className="p-4 font-semibold text-slate-700">Đơn giá</th>
                                <th className="p-4 font-semibold text-slate-700">Tổng Tiền</th>
                                <th className="p-4 font-semibold text-slate-700">Ghi Chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredWorkers.length > 0 ? filteredWorkers.map(worker => {
                                const input = inputs[worker.id] || { shifts: 1, customRate: worker.dailyRate, selected: false, note: '' };
                                return (
                                    <tr key={worker.id} className={input.selected ? 'bg-blue-50/50' : ''}>
                                        <td className="p-4"><input type="checkbox" checked={input.selected} onChange={(e) => handleInputChange(worker.id, 'selected', e.target.checked)} className="w-4 h-4" /></td>
                                        <td className="p-4">
                                            <div className="font-medium">{worker.name}</div>
                                            <div className="text-xs text-slate-500">{worker.role}</div>
                                        </td>
                                        <td className="p-4"><input type="number" step="0.5" min="0" value={input.shifts} onChange={(e) => handleInputChange(worker.id, 'shifts', Number(e.target.value))} className="w-20 px-2 py-1 border rounded" /></td>
                                        <td className="p-4"><input type="number" value={input.customRate} readOnly className="w-32 px-2 py-1 border rounded bg-slate-100 text-right" /></td>
                                        <td className="p-4 font-medium text-emerald-600">{formatCurrency(input.shifts * input.customRate)}</td>
                                        <td className="p-4"><input type="text" value={input.note} onChange={(e) => handleInputChange(worker.id, 'note', e.target.value)} className="w-full px-2 py-1 border rounded" /></td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Không có công nhật nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button onClick={handleSave} className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm">
                        <Save className="w-5 h-5 mr-2" /> Lưu Chấm Công
                    </button>
                </div>
            </div>

            {/* Section: Edit/Delete Existing Records */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                <div className="p-4 bg-orange-50 border-b border-orange-200 flex justify-between items-center">
                    <div className="font-bold text-orange-800 flex items-center">
                        <History className="w-4 h-4 mr-2" /> 
                        <span>Danh sách đã chấm hôm nay ({formatShortDate(date)}) - <span className="text-blue-600">{currentProjectName}</span></span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">Công Nhật</th>
                                <th className="p-4 font-semibold text-slate-600">Số Công</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Đơn Giá (VNĐ)</th>
                                <th className="p-4 font-semibold text-slate-600 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {existingRecords.length > 0 ? existingRecords.map(record => {
                                const worker = workers.find(w => w.id === record.workerId);
                                const isEditing = editingRecordId === record.id;
                                return (
                                    <tr key={record.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium text-slate-800">{worker?.name}</td>
                                        <td className="p-4">
                                            {isEditing ? (
                                                <input 
                                                    type="number" step="0.5" className="w-20 px-2 py-1 border border-blue-400 rounded focus:ring-2 focus:ring-blue-200 outline-none"
                                                    value={editShiftValue} onChange={e => setEditShiftValue(Number(e.target.value))}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-bold text-blue-600">{record.shifts}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-slate-500">
                                            {isEditing ? (
                                                <input 
                                                    type="number" step="10000" className="w-28 px-2 py-1 border border-blue-400 rounded focus:ring-2 focus:ring-blue-200 outline-none text-right"
                                                    value={editRateValue} onChange={e => setEditRateValue(Number(e.target.value))}
                                                />
                                            ) : (
                                                formatCurrency(record.rateUsed)
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {isEditing ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={saveEdit} className="p-2 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingRecordId(null)} className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => startEditing(record)} className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"><Edit className="w-4 h-4" /></button>
                                                    <button 
                                                        type="button" 
                                                        onClick={(e) => { 
                                                            e.stopPropagation(); 
                                                            setDeleteId(record.id);
                                                        }} 
                                                        className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={4} className="p-8 text-center text-slate-400">Chưa có dữ liệu chấm công cho ngày này tại công trình này.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Payroll = ({ workers, records, projects }: { workers: Worker[], records: TimeRecord[], projects: Project[] }) => {
    const [weekEnd, setWeekEnd] = useState(() => {
        const d = getThursdayOfWeek(new Date());
        return d.toISOString().split('T')[0];
    });
    
    // Filter state
    const [filterProjectId, setFilterProjectId] = useState('');
    
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);

    const weekStart = useMemo(() => {
        const d = new Date(weekEnd);
        d.setDate(d.getDate() - 6); 
        return d.toISOString().split('T')[0];
    }, [weekEnd]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = new Date(e.target.value);
        if (isNaN(selected.getTime())) return;
        const thursday = getThursdayOfWeek(selected);
        setWeekEnd(thursday.toISOString().split('T')[0]);
        setAiAnalysis(null);
    };

    const weeklyData = useMemo(() => {
        let filteredRecords = records.filter(r => r.date >= weekStart && r.date <= weekEnd);
        
        if (filterProjectId) {
            filteredRecords = filteredRecords.filter(r => r.projectId === filterProjectId);
        }
        
        const items: WeeklyPayrollItem[] = workers.map(w => {
            const workerRecords = filteredRecords.filter(r => r.workerId === w.id);
            const totalShifts = workerRecords.reduce((sum, r) => sum + r.shifts, 0);
            const totalAmount = workerRecords.reduce((sum, r) => sum + (r.shifts * r.rateUsed), 0);
            
            const projectNames = Array.from(new Set(workerRecords.map(r => {
                const p = projects.find(proj => proj.id === r.projectId);
                return p ? p.name : 'Unknown';
            })));

            return {
                worker: w,
                totalShifts,
                totalAmount,
                details: workerRecords,
                projectNames
            };
        });
        
        if (!filterProjectId) {
            items.sort((a, b) => {
                const pA = a.projectNames[0] || '';
                const pB = b.projectNames[0] || '';
                return pA.localeCompare(pB);
            });
        }
        
        return items.filter(i => i.totalShifts > 0);

    }, [weekStart, weekEnd, records, workers, projects, filterProjectId]);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        const result = await analyzePayroll(weeklyData, weekStart, weekEnd);
        setAiAnalysis(result);
        setAnalyzing(false);
    };

    const totalPayout = weeklyData.reduce((sum, item) => sum + item.totalAmount, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <h2 className="text-2xl font-bold text-slate-800">Bảng Lương Theo Tuần</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                     <button
                        onClick={() => window.print()}
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        <FileDown className="w-4 h-4 mr-2" /> Xuất PDF / In
                    </button>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        <select 
                            value={filterProjectId} 
                            onChange={(e) => setFilterProjectId(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                        >
                            <option value="">Tất cả công trình</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-1 shadow-sm">
                            <div className="flex flex-col items-start mr-2 border-r border-slate-200 pr-2">
                                <span className="text-[10px] text-slate-500 uppercase font-bold">Bắt đầu (T6)</span>
                                <span className="text-sm font-medium text-slate-700">{formatDate(weekStart)}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 uppercase font-bold block">Kết thúc (T5)</span>
                                <input 
                                    type="date" 
                                    value={weekEnd} 
                                    onChange={handleDateChange}
                                    className="outline-none text-sm text-slate-800 bg-transparent font-medium p-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="hidden print:block mb-8 text-center border-b pb-4">
                 <h1 className="text-2xl font-bold uppercase">Bảng Lương Công Nhật</h1>
                 <p className="text-slate-800 mt-2 text-lg font-medium">Kỳ lương: {formatDate(weekStart)} - {formatDate(weekEnd)}</p>
                 <p className="text-slate-900 font-bold mt-1 text-xl uppercase">
                     Công trình: {filterProjectId ? projects.find(p => p.id === filterProjectId)?.name : 'TẤT CẢ CÔNG TRÌNH'}
                 </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6 lg:w-full print:col-span-3 print:w-full">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-black print:shadow-none">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 print:bg-gray-100 print:border-black">
                                    <tr>
                                        <th className="p-4 font-semibold text-slate-700 print:text-black">Công Nhật</th>
                                        <th className="p-4 font-semibold text-slate-700 print:text-black">Công Trình</th>
                                        <th className="p-4 font-semibold text-slate-700 text-center print:text-black">Tổng Công</th>
                                        <th className="p-4 font-semibold text-slate-700 text-right print:text-black">Lương Tuần</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                                    {weeklyData.length > 0 ? weeklyData.map(item => {
                                        const sortedDetails = [...item.details].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                                        return (
                                            <tr key={item.worker.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-800 print:text-black">{item.worker.name}</div>
                                                    <div className="text-xs text-slate-500 print:text-gray-600">{item.worker.role}</div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600 print:text-black">
                                                    {item.projectNames.map((name, idx) => (
                                                        <div key={idx} className="flex items-center">
                                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 print:hidden"></span>
                                                            {name}
                                                        </div>
                                                    ))}
                                                </td>
                                                <td className="p-4 text-center align-top">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-blue-700 text-lg print:text-black">
                                                            {item.totalShifts}
                                                        </span>
                                                        <div className="flex flex-wrap justify-center gap-2 mt-1 max-w-[250px]">
                                                            {sortedDetails.map((d, i) => (
                                                                <span key={i} className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 whitespace-nowrap print:border-slate-400 print:text-black print:text-sm print:font-semibold">
                                                                    {formatShortDate(d.date)}: <span className="text-base font-bold">{d.shifts}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-bold text-emerald-600 print:text-black">{formatCurrency(item.totalAmount)}</td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">
                                                {filterProjectId ? 'Không có dữ liệu cho công trình này trong tuần' : 'Không có dữ liệu cho tuần này'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50 font-semibold text-slate-800 print:bg-gray-100 print:border-t print:border-black">
                                    <tr>
                                        <td colSpan={3} className="p-4 text-right">Tổng Cộng:</td>
                                        <td className="p-4 text-right text-emerald-700 print:text-black">{formatCurrency(totalPayout)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 print:hidden">
                     <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center mb-4">
                            <BrainCircuit className="w-6 h-6 mr-2" />
                            <h3 className="text-lg font-bold">Trợ Lý AI</h3>
                        </div>
                        <p className="text-indigo-100 text-sm mb-6">
                            Sử dụng AI để phân tích dữ liệu bảng lương, tìm ra các bất thường và tối ưu chi phí.
                        </p>
                        <button 
                            onClick={handleAnalyze}
                            disabled={analyzing || weeklyData.length === 0}
                            className="w-full py-2 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {analyzing ? 'Đang phân tích...' : 'Phân Tích Ngay'}
                        </button>
                     </div>

                     {aiAnalysis && (
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                             <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">Kết Quả Phân Tích</h3>
                             <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                 {aiAnalysis}
                             </div>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

const DebtManagement = ({ workers, records, transactions, onAddTransaction, projects }: { 
    workers: Worker[], 
    records: TimeRecord[], 
    transactions: Transaction[],
    onAddTransaction: (t: Transaction) => void,
    projects: Project[]
}) => {
    // Keeping DebtManagement same as before
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProjectId, setFilterProjectId] = useState('');

    // New Transaction State
    const [newTxType, setNewTxType] = useState<'advance' | 'payment'>('advance');
    const [newTxAmount, setNewTxAmount] = useState('');
    const [newTxDate, setNewTxDate] = useState(new Date().toISOString().split('T')[0]);
    const [newTxNote, setNewTxNote] = useState('');

    const debtData = useMemo(() => {
        let processedWorkers = workers;

        // 1. Filter by Project
        if (filterProjectId) {
            processedWorkers = processedWorkers.filter(w => w.currentProjectId === filterProjectId);
        }

        // 2. Filter by Name
        if (searchTerm) {
            processedWorkers = processedWorkers.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        return processedWorkers.map(w => {
            // Total Salary Earned (Lifetime) - UPDATED TO USE rateUsed
            const workerRecords = records.filter(r => r.workerId === w.id);
            const totalEarned = workerRecords.reduce((sum, r) => sum + (r.shifts * r.rateUsed), 0);
            
            // Total Transactions
            const workerTx = transactions.filter(t => t.workerId === w.id);
            const totalAdvanced = workerTx.filter(t => t.type === 'advance').reduce((sum, t) => sum + t.amount, 0);
            const totalPaid = workerTx.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
            
            const remainingDebt = totalEarned - (totalAdvanced + totalPaid);
            
            return {
                worker: w,
                totalEarned,
                totalAdvanced,
                totalPaid,
                remainingDebt
            };
        });
    }, [workers, records, transactions, searchTerm, filterProjectId]);

    const totalCompanyDebt = debtData.reduce((sum, d) => sum + d.remainingDebt, 0);
    const selectedWorker = workers.find(w => w.id === selectedWorkerId);
    const selectedWorkerTx = selectedWorkerId ? transactions.filter(t => t.workerId === selectedWorkerId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

    const handleAdd = async () => {
        if (!selectedWorkerId || !newTxAmount) return;
        const tx: Transaction = {
            id: generateId(),
            workerId: selectedWorkerId,
            type: newTxType,
            amount: Number(newTxAmount),
            date: newTxDate,
            note: newTxNote
        };
        // Ensure async operation is handled in Parent but this view only triggers callback
        onAddTransaction(tx);
        setNewTxAmount('');
        setNewTxNote('');
        setIsFormOpen(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <h2 className="text-2xl font-bold text-slate-800">Quản Lý Công Nợ & Ứng Lương</h2>
                 <button
                    onClick={() => window.print()}
                    className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                >
                    <FileDown className="w-4 h-4 mr-2" /> Xuất PDF / In
                </button>
            </div>
            
             <div className="hidden print:block mb-8 text-center">
                 <h1 className="text-2xl font-bold uppercase">Báo Cáo Công Nợ</h1>
                 <p className="text-slate-600 mt-2">Ngày lập: {formatDate(new Date().toISOString())}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <p className="text-sm font-medium text-slate-500">Tổng Nợ Lương Cần Trả</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(totalCompanyDebt)}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-4 print:hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Tìm tên công nhật..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="w-full md:w-64">
                    <select 
                        value={filterProjectId} 
                        onChange={(e) => setFilterProjectId(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">Tất cả công trình</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Master List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:col-span-3 print:border-black print:shadow-none">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 print:bg-gray-100 print:border-black">
                                <tr>
                                    <th className="p-4 font-semibold text-slate-700 print:text-black">Công Nhật</th>
                                    <th className="p-4 font-semibold text-slate-700 text-right print:text-black">Tổng Lương</th>
                                    <th className="p-4 font-semibold text-slate-700 text-right print:text-black">Đã Ứng</th>
                                    <th className="p-4 font-semibold text-slate-700 text-right print:text-black">Đã Trả</th>
                                    <th className="p-4 font-semibold text-slate-700 text-right print:text-black">Còn Nợ</th>
                                    <th className="p-4 text-center print:hidden">Chi Tiết</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                                {debtData.map(d => (
                                    <tr key={d.worker.id} className={selectedWorkerId === d.worker.id ? "bg-blue-50 print:bg-transparent" : "hover:bg-slate-50 print:hover:bg-transparent"}>
                                        <td className="p-4 font-medium text-slate-800 print:text-black">
                                            {d.worker.name}
                                            {d.worker.currentProjectId && (
                                                <div className="text-xs text-slate-500 font-normal print:text-gray-600">
                                                    {projects.find(p => p.id === d.worker.currentProjectId)?.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-slate-600 print:text-black">{formatCurrency(d.totalEarned)}</td>
                                        <td className="p-4 text-right text-orange-600 print:text-black">{formatCurrency(d.totalAdvanced)}</td>
                                        <td className="p-4 text-right text-green-600 print:text-black">{formatCurrency(d.totalPaid)}</td>
                                        <td className={`p-4 text-right font-bold ${d.remainingDebt > 0 ? 'text-red-600' : 'text-slate-400'} print:text-black`}>
                                            {formatCurrency(d.remainingDebt)}
                                        </td>
                                        <td className="p-4 text-center print:hidden">
                                            <button 
                                                onClick={() => {
                                                    setSelectedWorkerId(d.worker.id);
                                                    setIsFormOpen(false);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail View */}
                <div className="space-y-6 print:hidden">
                    {selectedWorker ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full max-h-[600px]">
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
                                <div>
                                    <h3 className="font-bold text-slate-800">{selectedWorker.name}</h3>
                                    <p className="text-xs text-slate-500">{selectedWorker.role}</p>
                                </div>
                                <button 
                                    onClick={() => setIsFormOpen(!isFormOpen)}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center"
                                >
                                    <ArrowRightLeft className="w-4 h-4 mr-1.5" /> Giao Dịch
                                </button>
                            </div>

                            {/* Add Transaction Form */}
                            {isFormOpen && (
                                <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <button 
                                                className={`flex-1 py-1.5 text-sm rounded-md font-medium ${newTxType === 'advance' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white text-slate-600 border border-slate-200'}`}
                                                onClick={() => setNewTxType('advance')}
                                            >
                                                Ứng Lương
                                            </button>
                                            <button 
                                                className={`flex-1 py-1.5 text-sm rounded-md font-medium ${newTxType === 'payment' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white text-slate-600 border border-slate-200'}`}
                                                onClick={() => setNewTxType('payment')}
                                            >
                                                Thanh Toán
                                            </button>
                                        </div>
                                        <input 
                                            type="number" 
                                            placeholder="Số tiền..." 
                                            className="w-full p-2 text-sm border rounded"
                                            value={newTxAmount}
                                            onChange={e => setNewTxAmount(e.target.value)}
                                        />
                                        <input 
                                            type="date" 
                                            className="w-full p-2 text-sm border rounded"
                                            value={newTxDate}
                                            onChange={e => setNewTxDate(e.target.value)}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Ghi chú..." 
                                            className="w-full p-2 text-sm border rounded"
                                            value={newTxNote}
                                            onChange={e => setNewTxNote(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleAdd}
                                            className="w-full py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                                        >
                                            Lưu Giao Dịch
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Transaction List */}
                            <div className="flex-1 overflow-auto p-4">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Lịch sử giao dịch</h4>
                                {selectedWorkerTx.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedWorkerTx.map(tx => (
                                            <div key={tx.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div>
                                                    <div className={`text-sm font-semibold ${tx.type === 'advance' ? 'text-orange-600' : 'text-green-600'}`}>
                                                        {tx.type === 'advance' ? 'Đã Ứng' : 'Thanh Toán'}
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1 flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(tx.date)}
                                                    </div>
                                                    {tx.note && <div className="text-xs text-slate-600 mt-1 italic">"{tx.note}"</div>}
                                                </div>
                                                <div className="font-bold text-slate-800">
                                                    {formatCurrency(tx.amount)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 text-sm py-8">Chưa có giao dịch nào</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400">
                            Chọn một công nhật để xem chi tiết
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ManageWorkers = ({ workers, projects, onAdd, onDelete, onUpdate }: any) => {
    const initialFormState: Worker = { id: '', name: '', role: 'Công nhật', dailyRate: 0, currentProjectId: '', identityCardNumber: '', phone: '', bankAccount: '', bankName: '' };
    const [form, setForm] = useState<Worker>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    
    // Deletion Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!form.name) return alert("Vui lòng nhập tên công nhật");
        
        if (isEditing) {
            onUpdate(form);
            // alert("Cập nhật thành công!"); // Handled by parent async
        } else {
            onAdd({...form, id: generateId()});
        }
        
        setForm(initialFormState);
        setIsEditing(false);
    };

    const handleEdit = (worker: Worker) => {
        setForm(worker);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setForm(initialFormState);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            <ConfirmationModal 
                isOpen={!!deleteId} 
                title="Xóa Công Nhật"
                message="Bạn có chắc chắn muốn xóa công nhật này không?"
                onConfirm={() => {
                    if (deleteId) onDelete(deleteId);
                    setDeleteId(null);
                }}
                onCancel={() => setDeleteId(null)}
            />

            <h2 className="text-2xl font-bold text-slate-800">Quản Lý Công Nhật</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">{isEditing ? 'Sửa Thông Tin' : 'Thêm Công Nhật Mới'}</h3>
                        {isEditing && (
                             <button onClick={handleCancel} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">Hủy</button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded" placeholder="Họ tên" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <select className="w-full p-2 border rounded" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                            <option>Công nhật</option>
                            <option>Thợ Chính</option>
                            <option>Phụ Hồ</option>
                            <option>Kỹ Sư</option>
                            <option>Bảo Vệ</option>
                        </select>
                         <select 
                            className="w-full p-2 border rounded" 
                            value={form.currentProjectId || ''} 
                            onChange={e => setForm({...form, currentProjectId: e.target.value})}
                        >
                            <option value="">-- Chọn Công Trình --</option>
                            {projects.map((p: Project) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <input className="w-full p-2 border rounded" placeholder="SĐT" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="Số CCCD" value={form.identityCardNumber || ''} onChange={e => setForm({...form, identityCardNumber: e.target.value})} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                             <input className="w-full p-2 border rounded" placeholder="Số TK" value={form.bankAccount || ''} onChange={e => setForm({...form, bankAccount: e.target.value})} />
                             <input className="w-full p-2 border rounded" placeholder="Tên Ngân hàng" value={form.bankName || ''} onChange={e => setForm({...form, bankName: e.target.value})} />
                        </div>

                        <button 
                            className={`w-full text-white py-2 rounded font-medium flex items-center justify-center ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            onClick={handleSubmit}
                        >
                            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                            {isEditing ? 'Cập Nhật' : 'Thêm'}
                        </button>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left">Tên & Liên Hệ</th>
                                <th className="p-4 text-left">Công Trình Hiện Tại</th>
                                <th className="p-4 text-left">Vai Trò</th>
                                <th className="p-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workers.map((w: Worker) => {
                                const projectName = w.currentProjectId ? projects.find((p: Project) => p.id === w.currentProjectId)?.name : '-';
                                return (
                                    <tr key={w.id} className={isEditing && form.id === w.id ? 'bg-orange-50' : 'hover:bg-slate-50'}>
                                        <td className="p-4">
                                            <div className="font-medium">{w.name}</div>
                                            <div className="text-sm text-slate-500">{w.phone}</div>
                                            <div className="text-xs text-slate-400 mt-1 flex items-center">
                                                <IdCard className="w-3 h-3 mr-1" />
                                                {w.identityCardNumber || '--'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center text-sm">
                                                <Briefcase className="w-3 h-3 mr-1 text-slate-400" />
                                                {projectName}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-500">{w.role}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(w)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        setDeleteId(w.id);
                                                    }} 
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
};

const ManageProjects = ({ projects, onAdd, onDelete, onUpdate }: any) => {
    const initialFormState: Project = { id: '', name: '', address: '', status: 'active', standardRate: 0, doubleRate: 0 };
    const [form, setForm] = useState<Partial<Project>>(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    
    // Deletion Modal State
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!form.name) return alert("Vui lòng nhập tên công trình");

        if (isEditing) {
            onUpdate(form);
            // alert("Cập nhật công trình thành công!");
        } else {
            onAdd({...form, id: generateId(), status: 'active'});
        }
        setForm(initialFormState);
        setIsEditing(false);
    };

    const handleEdit = (p: Project) => {
        setForm(p);
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setForm(initialFormState);
        setIsEditing(false);
    };

     return (
        <div className="space-y-6">
            <ConfirmationModal 
                isOpen={!!deleteId} 
                title="Xóa Công Trình"
                message="Bạn có chắc chắn muốn xóa công trình này không?"
                onConfirm={() => {
                    if (deleteId) onDelete(deleteId);
                    setDeleteId(null);
                }}
                onCancel={() => setDeleteId(null)}
            />

            <h2 className="text-2xl font-bold text-slate-800">Quản Lý Công Trình</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">{isEditing ? 'Cập Nhật Công Trình' : 'Thêm Công Trình'}</h3>
                         {isEditing && (
                             <button onClick={handleCancel} className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">Hủy</button>
                        )}
                    </div>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded" placeholder="Tên công trình" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                        <input className="w-full p-2 border rounded" placeholder="Địa chỉ" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                        
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                 <label className="text-xs text-slate-500 mb-1 block">Giá 1 công (VNĐ)</label>
                                 <input 
                                    className="w-full p-2 border rounded" 
                                    type="number" 
                                    placeholder="500,000" 
                                    value={form.standardRate || ''} 
                                    onChange={e => setForm({...form, standardRate: Number(e.target.value)})} 
                                />
                             </div>
                             <div>
                                 <label className="text-xs text-slate-500 mb-1 block">Giá 2 công (VNĐ)</label>
                                 <input 
                                    className="w-full p-2 border rounded" 
                                    type="number" 
                                    placeholder="1,000,000" 
                                    value={form.doubleRate || ''} 
                                    onChange={e => setForm({...form, doubleRate: Number(e.target.value)})} 
                                />
                             </div>
                        </div>
                        
                        {isEditing && (
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Trạng thái</label>
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={form.status}
                                    onChange={e => setForm({...form, status: e.target.value as any})}
                                >
                                    <option value="active">Đang chạy</option>
                                    <option value="completed">Đã hoàn thành</option>
                                </select>
                            </div>
                        )}

                        <button 
                            className={`w-full text-white py-2 rounded font-medium flex items-center justify-center ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            onClick={handleSubmit}
                        >
                            {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                            {isEditing ? 'Cập Nhật' : 'Thêm'}
                        </button>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left">Tên Công Trình</th>
                                <th className="p-4 text-left">Địa Chỉ</th>
                                <th className="p-4 text-right">Đơn Giá (1/2 công)</th>
                                <th className="p-4 text-center">Trạng Thái</th>
                                <th className="p-4 text-right">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {projects.map((p: Project) => (
                                <tr key={p.id} className={isEditing && form.id === p.id ? 'bg-orange-50' : 'hover:bg-slate-50'}>
                                    <td className="p-4 font-medium">{p.name}</td>
                                    <td className="p-4 text-slate-500">{p.address}</td>
                                    <td className="p-4 text-right">
                                        {(p.standardRate || p.doubleRate) ? (
                                            <div className="flex flex-col text-sm">
                                                <span className="text-blue-600">1C: {formatCurrency(p.standardRate || 0)}</span>
                                                <span className="text-indigo-600">2C: {formatCurrency(p.doubleRate || 0)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic text-sm">Chưa set</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {p.status === 'active' ? 'Đang chạy' : 'Hoàn thành'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEdit(p)} className="text-blue-600 hover:bg-blue-50 p-2 rounded">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setDeleteId(p.id);
                                                }} 
                                                className="text-red-500 hover:bg-red-50 p-2 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ActivityLogs Component
const ActivityLogs = ({ logs }: { logs: ActivityLog[] }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Nhật Ký Hoạt Động</h2>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-700">Thời Gian</th>
                            <th className="p-4 font-semibold text-slate-700">Người Dùng</th>
                            <th className="p-4 font-semibold text-slate-700">Hành Động</th>
                            <th className="p-4 font-semibold text-slate-700">Chi Tiết</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-4 text-slate-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                                <td className="p-4 font-medium">{log.userName}</td>
                                <td className="p-4 text-blue-600">{log.action}</td>
                                <td className="p-4 text-slate-600">{log.details}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Chưa có nhật ký nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// SystemBackup Component
const SystemBackup = ({ onRestore, workers, projects, records, transactions, logs }: { onRestore: (data: any) => void, workers: Worker[], projects: Project[], records: TimeRecord[], transactions: Transaction[], logs: ActivityLog[] }) => {
    const handleExport = () => {
        const data = {
            workers,
            projects,
            records,
            transactions,
            logs,
            version: "1.0",
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `backup_T_and_T_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (window.confirm("CẢNH BÁO: Hành động này sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu từ file backup. Dữ liệu sẽ được gửi lên server. Bạn có chắc chắn không?")) {
                    onRestore(data);
                }
            } catch (error) {
                alert("Lỗi đọc file: " + error);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Sao Lưu & Phục Hồi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <Download className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Sao Lưu Dữ Liệu</h3>
                    </div>
                    <p className="text-slate-500 mb-6">Tải xuống toàn bộ dữ liệu hệ thống (từ Server) dưới dạng file JSON để lưu trữ an toàn.</p>
                    <button onClick={handleExport} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        Tải Xuống Backup
                    </button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Upload className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Phục Hồi Dữ Liệu</h3>
                    </div>
                    <p className="text-slate-500 mb-6">Khôi phục dữ liệu từ file backup. Dữ liệu sẽ được gửi lên Server để đồng bộ.</p>
                    <label className="w-full flex items-center justify-center py-2 bg-white border-2 border-dashed border-emerald-500 text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer font-medium">
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        Chọn File Backup
                    </label>
                </div>
            </div>
        </div>
    );
};

// Main App Component
const App = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [view, setView] = useState<ViewMode>('dashboard');
    const [mobileOpen, setMobileOpen] = useState(false);
    
    // Global Loading State
    const [isLoading, setIsLoading] = useState(false);

    // Data State (Initially Empty)
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [records, setRecords] = useState<TimeRecord[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);

    // Fetch initial data on login
    useEffect(() => {
        const loadData = async () => {
            if (!currentUser) return;
            
            setIsLoading(true);
            try {
                // Use Promise.allSettled to allow some APIs to fail (like 404s on new deployments)
                // without crashing the whole app load.
                const results = await Promise.allSettled([
                    api.getWorkers(),
                    api.getProjects(),
                    api.getRecords(),
                    api.getTransactions(),
                    api.getLogs()
                ]);

                // Helper to extract data or return empty array if failed
                const extract = <T,>(result: PromiseSettledResult<T>, name: string): T => {
                    if (result.status === 'fulfilled') return result.value;
                    console.warn(`Failed to load ${name} (using empty default):`, result.reason);
                    return [] as any; // Cast for simplicity, assuming array return types
                };

                setWorkers(extract(results[0], 'Workers') || []);
                setProjects(extract(results[1], 'Projects') || []);
                setRecords(extract(results[2], 'Records') || []);
                setTransactions(extract(results[3], 'Transactions') || []);
                setLogs(extract(results[4], 'Logs') || []);
                
            } catch (error) {
                console.error("Critical failure loading data:", error);
                // No alert here to prevent blocking UI on transient network errors
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [currentUser]);

    const addLog = async (action: string, details: string) => {
        if (!currentUser) return;
        const newLog: ActivityLog = {
            id: generateId(),
            userId: currentUser.id,
            userName: currentUser.name,
            action,
            details,
            timestamp: new Date().toISOString()
        };
        // Optimistic update
        setLogs(prev => [newLog, ...prev]);
        // Sync with background
        try {
            await api.createLog(newLog);
        } catch(e) { console.error("Log failed", e); }
    };

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setView('dashboard');
        // We do not await this log to prevent UI block
        // In real app, auth is handled by backend session
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setWorkers([]);
        setProjects([]);
        setRecords([]);
        setTransactions([]);
        setLogs([]);
    };

    // Async Handlers
    const handleAddRecords = async (newRecords: TimeRecord[]) => {
        setIsLoading(true);
        try {
            const savedRecords = await api.createRecords(newRecords);
            setRecords(prev => [...prev, ...savedRecords]);
            await addLog('Chấm công', `Thêm ${newRecords.length} bản ghi chấm công`);
        } catch (error) {
            alert("Lỗi khi lưu chấm công");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRecord = async (id: string, shifts: number, rate: number) => {
        setIsLoading(true);
        try {
            const updated = await api.updateRecord(id, shifts, rate);
            setRecords(prev => prev.map(r => r.id === id ? updated : r));
            await addLog('Sửa chấm công', `Cập nhật bản ghi ${id}`);
        } catch (error) {
             alert("Lỗi khi cập nhật");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRecord = async (id: string) => {
        setIsLoading(true);
        try {
            await api.deleteRecord(id);
            setRecords(prev => prev.filter(r => r.id !== id));
            await addLog('Xóa chấm công', `Xóa bản ghi ${id}`);
        } catch (error) {
            alert("Lỗi khi xóa");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddTransaction = async (tx: Transaction) => {
        setIsLoading(true);
        try {
            const newTx = await api.createTransaction(tx);
            setTransactions(prev => [...prev, newTx]);
            await addLog('Giao dịch', `${tx.type === 'advance' ? 'Ứng' : 'Thanh toán'} ${formatCurrency(tx.amount)}`);
        } catch (error) {
            alert("Lỗi giao dịch");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddWorker = async (w: Worker) => {
        setIsLoading(true);
        try {
            const newWorker = await api.createWorker(w);
            setWorkers(prev => [...prev, newWorker]);
            await addLog('Thêm công nhật', `Thêm công nhật ${w.name}`);
        } catch (error) {
            alert("Lỗi thêm nhân viên");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateWorker = async (w: Worker) => {
        setIsLoading(true);
        try {
            const updated = await api.updateWorker(w);
            setWorkers(prev => prev.map(item => item.id === w.id ? updated : item));
            await addLog('Sửa công nhật', `Cập nhật công nhật ${w.name}`);
        } catch (error) {
            alert("Lỗi cập nhật nhân viên");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteWorker = async (id: string) => {
        setIsLoading(true);
        try {
            await api.deleteWorker(id);
            setWorkers(prev => prev.filter(w => w.id !== id));
            await addLog('Xóa công nhật', `Xóa công nhật ID ${id}`);
        } catch (error) {
             alert("Lỗi xóa nhân viên");
        } finally {
            setIsLoading(false);
        }
    };

   const handleAddProject = async (p: Project) => {
  setIsLoading(true);
  try {
    const storage = await api.getStorage();

    const newProject: Project = {
      ...p,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    storage.projects = [
      newProject,
      ...storage.projects,
    ];

    await api.saveStorage(storage);

    setProjects(prev => [newProject, ...prev]);

    await addLog('Thêm công trình', `Thêm công trình ${p.name}`);
  } catch (error) {
    console.error(error);
    alert("Lỗi thêm công trình");
  } finally {
    setIsLoading(false);
  }
};


   const handleUpdateProject = async (p: Project) => {
  setIsLoading(true);
  try {
    const storage = await api.getStorage();

    storage.projects = storage.projects.map(project =>
      project.id === p.id ? { ...project, ...p } : project
    );

    await api.saveStorage(storage);

    setProjects(prev =>
      prev.map(item => (item.id === p.id ? p : item))
    );

    await addLog('Sửa công trình', `Cập nhật công trình ${p.name}`);
  } catch (error) {
    console.error(error);
    alert('Lỗi cập nhật công trình');
  } finally {
    setIsLoading(false);
  }
};

const handleDeleteProject = async (id: string) => {
  setIsLoading(true);
  try {
    const storage = await api.getStorage();

    storage.projects = storage.projects.filter(p => p.id !== id);

    await api.saveStorage(storage);

    setProjects(prev => prev.filter(p => p.id !== id));

    await addLog('Xóa công trình', `Xóa công trình ID ${id}`);
  } catch (error) {
    console.error(error);
    alert('Lỗi xóa công trình');
  } finally {
    setIsLoading(false);
  }
};


    const handleRestore = async (data: any) => {
        setIsLoading(true);
        try {
            await api.restoreBackup(data);
            // Reload data after restore
            const results = await Promise.allSettled([
                api.getWorkers(),
                api.getProjects(),
                api.getRecords(),
                api.getTransactions(),
                api.getLogs()
            ]);
            
            const extract = <T,>(result: PromiseSettledResult<T>) => result.status === 'fulfilled' ? result.value : [];
            
            setWorkers(extract(results[0]) as any || []);
            setProjects(extract(results[1]) as any || []);
            setRecords(extract(results[2]) as any || []);
            setTransactions(extract(results[3]) as any || []);
            setLogs(extract(results[4]) as any || []);
            
            await addLog('Phục hồi dữ liệu', 'Khôi phục dữ liệu từ file backup');
            alert("Phục hồi thành công!");
        } catch (error) {
            alert("Lỗi phục hồi dữ liệu");
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            {isLoading && <LoadingOverlay />}
            
            <Sidebar 
                currentView={view} 
                setView={setView} 
                mobileOpen={mobileOpen} 
                setMobileOpen={setMobileOpen} 
                currentUser={currentUser}
                onLogout={handleLogout}
            />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 print:hidden">
                    <button 
                        onClick={() => setMobileOpen(true)}
                        className="lg:hidden p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1 flex justify-end">
                       {/* Header actions if needed */}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {view === 'dashboard' && <Dashboard workers={workers} projects={projects} records={records} />}
                        {view === 'timesheet' && <Timesheet workers={workers} projects={projects} records={records} onAddRecord={handleAddRecords} onUpdateRecord={handleUpdateRecord} onDeleteRecord={handleDeleteRecord} />}
                        {view === 'payroll' && <Payroll workers={workers} records={records} projects={projects} />}
                        {view === 'debt' && <DebtManagement workers={workers} records={records} transactions={transactions} onAddTransaction={handleAddTransaction} projects={projects} />}
                        {view === 'workers' && <ManageWorkers workers={workers} projects={projects} onAdd={handleAddWorker} onUpdate={handleUpdateWorker} onDelete={handleDeleteWorker} />}
                        {view === 'projects' && <ManageProjects projects={projects} onAdd={handleAddProject} onUpdate={handleUpdateProject} onDelete={handleDeleteProject} />}
                        {view === 'logs' && currentUser.role === 'admin' && <ActivityLogs logs={logs} />}
                        {view === 'backup' && currentUser.role === 'admin' && <SystemBackup onRestore={handleRestore} workers={workers} projects={projects} records={records} transactions={transactions} logs={logs} />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;
