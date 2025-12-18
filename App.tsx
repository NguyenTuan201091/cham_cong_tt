import React, { useState, useMemo, useEffect } from 'react';
import { Worker, Project, TimeRecord, ViewMode, Transaction, User, ActivityLog } from './types';
import { MOCK_WORKERS, MOCK_PROJECTS, MOCK_RECORDS, MOCK_TRANSACTIONS, MOCK_USERS, MOCK_LOGS } from './constants';
import {
  LayoutDashboard,
  Users,
  HardHat,
  CalendarClock,
  Banknote,
  Menu,
  Plus,
  Trash2,
  Wallet,
  FileDown,
  LogOut,
  History,
  Lock,
  Edit,
  Eye,
  CreditCard,
  Download,
  Upload,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Eraser,
  Filter,
  Save,
  XCircle,
  FileJson
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Utility Functions ---

const getThursdayOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  let diff = 4 - day;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
};

// Safer date formatting manually parsing YYYY-MM-DD to avoid timezone shifting
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        // Handle ISO string or YYYY-MM-DD
        const simpleDate = dateStr.split('T')[0];
        const parts = simpleDate.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            return `${day}/${month}/${year}`;
        }
        // Fallback for other formats
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    } catch (e) {
        return dateStr;
    }
};

const formatDateTime = (isoString: string) => {
    try {
        const date = new Date(isoString);
        return date.toLocaleString('vi-VN');
    } catch (e) {
        return isoString;
    }
};

const formatCurrency = (amount: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header];
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ].join('\n');
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.setAttribute('href', URL.createObjectURL(blob));
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.click();
};

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.username === username);
    if (user) {
      const isValid = (user.username === 'admin' && password === 'Tuan123456@') || 
                      ((user.username === 'luc' || user.username === 'du') && password === '123456');
      if (isValid) onLogin(user);
      else setError('Mật khẩu không đúng.');
    } else setError('Tên đăng nhập không tồn tại.');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-slate-200 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-5 text-blue-600">
           <HardHat className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 uppercase leading-tight">Công ty T&T</h1>
        <p className="text-slate-500 mt-2 mb-8 text-base font-medium">Hệ thống chấm công công nhật</p>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Người dùng</label>
            <select value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-base font-medium">
              <option value="">-- Chọn tài khoản --</option>
              {MOCK_USERS.map(u => <option key={u.id} value={u.username}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Mật khẩu</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 text-base" />
          </div>
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg font-medium border border-red-100">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white py-3.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-2 text-base">ĐĂNG NHẬP</button>
        </form>
      </div>
    </div>
  );
};

const Sidebar = ({ currentView, setView, mobileOpen, setMobileOpen, currentUser, onLogout }: any) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
    { id: 'timesheet', label: 'Chấm Công', icon: CalendarClock },
    { id: 'payroll', label: 'Bảng Lương', icon: Banknote },
    { id: 'debt', label: 'Công Nợ & Ứng', icon: Wallet },
    { id: 'workers', label: 'Công Nhật', icon: Users },
    { id: 'projects', label: 'Công Trình', icon: HardHat },
  ];

  if (currentUser.role === 'admin') {
    menuItems.push({ id: 'backup', label: 'Sao Lưu', icon: Database });
    menuItems.push({ id: 'logs', label: 'Nhật Ký', icon: History });
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:inset-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col print:hidden`}>
        <div className="flex flex-col items-center justify-center py-8 border-b border-slate-800 shrink-0">
            <span className="font-bold text-2xl tracking-tight text-blue-400 uppercase">Công ty T&T</span>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Hệ thống quản lý</span>
        </div>
        <div className="p-4 border-b border-slate-800 bg-slate-800/20">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold shadow-lg text-sm">{currentUser.name.charAt(0)}</div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center mt-0.5">
                {currentUser.role === 'admin' && <ShieldCheck className="w-3 h-3 mr-1 text-blue-400" />}
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setView(item.id); setMobileOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button type="button" onClick={onLogout} className="flex items-center w-full px-4 py-3 rounded-lg text-slate-500 hover:bg-red-900/20 hover:text-red-400 transition-colors font-bold text-sm">
            <LogOut className="w-5 h-5 mr-3" /> Đăng Xuất
          </button>
        </div>
      </div>
    </>
  );
};

// --- Functional Components ---

const Timesheet = ({ workers, projects, records, onAddRecord, onDeleteRecord, onUpdateRecord }: any) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [filterByAssigned, setFilterByAssigned] = useState(true);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editShifts, setEditShifts] = useState<string>('');

  useEffect(() => {
    // When project changes, find the project rate
    const currentProject = projects.find((p: any) => p.id === projectId);
    const standardRate = currentProject?.standardRate || 350000;

    const initial: any = {};
    workers.forEach((w: any) => {
      // Use project rate instead of worker rate
      initial[w.id] = { shifts: 1, customRate: standardRate, selected: false };
    });
    setInputs(initial);
  }, [workers, projectId, projects]);

  const filteredWorkers = useMemo(() => {
    if (!filterByAssigned) return workers;
    return workers.filter((w: any) => w.currentProjectId === projectId);
  }, [workers, projectId, filterByAssigned]);

  const existingRecords = useMemo(() => {
      // Correctly filter records matching BOTH date AND project
      return records.filter((r: any) => r.date === date && r.projectId === projectId);
  }, [records, date, projectId]);

  const handleSave = () => {
    const selectedKeys = Object.keys(inputs).filter(id => inputs[id].selected);
    const newRecords = selectedKeys.map(id => ({
        // Use a more unique ID to prevent collision during batch add, allowing Delete to work properly
        id: `${Date.now()}-${id}-${Math.random().toString(36).substr(2, 5)}`, 
        workerId: id,
        projectId,
        date,
        shifts: Number(inputs[id].shifts),
        rateUsed: inputs[id].customRate
      }));

    if (newRecords.length) {
      onAddRecord(newRecords);
      setInputs(prev => {
        const reset = { ...prev };
        Object.keys(reset).forEach(k => reset[k].selected = false);
        return reset;
      });
    } else {
      alert("Bạn chưa chọn công nhân nào!");
    }
  };

  const startEdit = (record: any) => {
      setEditingId(record.id);
      setEditShifts(record.shifts.toString());
  };

  const saveEdit = (id: string) => {
      onUpdateRecord(id, Number(editShifts));
      setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Chấm công Hằng Ngày</h2>
        <div className="flex flex-wrap gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 border rounded-lg shadow-sm font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          <select value={projectId} onChange={e => setProjectId(e.target.value)} className="px-3 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold text-sm text-blue-700 min-w-[200px]">
            {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button 
            type="button"
            onClick={() => setFilterByAssigned(!filterByAssigned)}
            className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all shadow-sm ${filterByAssigned ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
          >
            {filterByAssigned ? 'Đang lọc thợ tại CT' : 'Hiện tất cả thợ'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Danh sách ({filteredWorkers.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                <th className="p-4 w-12 text-center"></th>
                <th className="p-4">Công nhân</th>
                <th className="p-4 text-center">Công</th>
                <th className="p-4 text-right">Giá công (CT)</th>
                <th className="p-4 text-right">Tạm tính</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.map((w: any) => (
                <tr key={w.id} className={`${inputs[w.id]?.selected ? 'bg-blue-50/50' : ''} hover:bg-slate-50 transition-colors`}>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={inputs[w.id]?.selected || false} 
                      onChange={e => setInputs({...inputs, [w.id]: {...inputs[w.id], selected: e.target.checked}})}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-base text-slate-800">{w.name}</p>
                    <p className="text-xs text-slate-500 font-medium uppercase mt-0.5">{w.role}</p>
                  </td>
                  <td className="p-4 text-center">
                    <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-1">
                      <input 
                        type="number" step="0.5" min="0" 
                        value={inputs[w.id]?.shifts || 1} 
                        onChange={e => {
                            const val = e.target.value;
                            const numVal = parseFloat(val);
                            // Auto-adjust rate if shifts = 2 and doubleRate exists
                            const project = projects.find((p: any) => p.id === projectId);
                            let newRate = inputs[w.id]?.customRate;
                            
                            if (project) {
                                if (numVal === 2 && project.doubleRate) {
                                    // If 2 shifts, use half of doubleRate as the unit price so that 2 * price = doubleRate
                                    newRate = project.doubleRate / 2;
                                } else if (inputs[w.id]?.shifts === '2' && numVal !== 2) {
                                    // If changing FROM 2 to something else, revert to standard rate
                                    newRate = project.standardRate;
                                }
                            }

                            setInputs({...inputs, [w.id]: {...inputs[w.id], shifts: val, customRate: newRate}})
                        }}
                        className="w-16 p-1 text-center font-bold text-base text-blue-700 outline-none"
                      />
                    </div>
                  </td>
                  <td className="p-4 text-right text-sm font-medium text-slate-500">
                     <input 
                        type="number"
                        value={inputs[w.id]?.customRate || 0} 
                        onChange={e => setInputs({...inputs, [w.id]: {...inputs[w.id], customRate: Number(e.target.value)}})}
                        className="w-24 p-1 text-right bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-blue-500 font-bold"
                      />
                  </td>
                  <td className="p-4 text-right font-bold text-base text-slate-800">
                    {formatCurrency((inputs[w.id]?.shifts || 0) * (inputs[w.id]?.customRate || 0))}
                  </td>
                </tr>
              ))}
              {filteredWorkers.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm italic">Không tìm thấy công nhân nào thuộc công trình này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t bg-slate-50 flex justify-end items-center">
          <button onClick={handleSave} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> CHỐT CÔNG
          </button>
        </div>
      </div>

      {/* History / Edit Section */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden animate-in slide-in-from-bottom-2 fade-in">
          <div className="p-4 bg-orange-50 border-b flex justify-between items-center border-orange-100">
             <h3 className="text-sm font-bold text-orange-800 uppercase flex items-center gap-2">
                <History className="w-4 h-4" /> Đã chấm hôm nay tại {projects.find((p:any) => p.id === projectId)?.name}
             </h3>
             <span className="text-xs font-medium text-orange-600 bg-white px-2 py-1 rounded-lg border border-orange-200">
                {formatDate(date)}
             </span>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-white text-xs font-bold text-slate-400 uppercase tracking-widest border-b">
                   <tr>
                      <th className="p-4">Công nhân</th>
                      <th className="p-4 text-center">Số công</th>
                      <th className="p-4 text-right">Đơn giá</th>
                      <th className="p-4 text-right">Hành động</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {existingRecords.length > 0 ? existingRecords.map((r: any) => {
                       const worker = workers.find((w:any) => w.id === r.workerId);
                       const isEditing = editingId === r.id;
                       
                       return (
                           <tr key={r.id} className="hover:bg-slate-50">
                               <td className="p-4 font-bold text-slate-700 text-sm">{worker?.name || 'Không xác định'}</td>
                               <td className="p-4 text-center">
                                   {isEditing ? (
                                       <input 
                                          type="number" step="0.5" 
                                          value={editShifts}
                                          onChange={e => setEditShifts(e.target.value)}
                                          className="w-16 p-1 border rounded text-center font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                                          autoFocus
                                       />
                                   ) : (
                                       <span className="font-bold text-blue-600 text-sm">{r.shifts}</span>
                                   )}
                               </td>
                               <td className="p-4 text-right text-sm text-slate-500">{formatCurrency(r.rateUsed)}</td>
                               <td className="p-4 text-right">
                                   <div className="flex justify-end gap-2">
                                       {isEditing ? (
                                           <>
                                               <button onClick={() => saveEdit(r.id)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                                               <button onClick={() => setEditingId(null)} className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"><XCircle className="w-4 h-4" /></button>
                                           </>
                                       ) : (
                                           <>
                                               <button 
                                                  type="button"
                                                  onClick={() => startEdit(r)}
                                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                  title="Sửa công"
                                               >
                                                  <Edit className="w-4 h-4" />
                                               </button>
                                               <button 
                                                  type="button"
                                                  onClick={(e) => { 
                                                      // Directly delete without browser confirm if it's causing issues
                                                      // Or use a simple js check
                                                      e.stopPropagation();
                                                      onDeleteRecord(r.id);
                                                  }}
                                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                  title="Xóa"
                                               >
                                                  <Trash2 className="w-4 h-4" />
                                               </button>
                                           </>
                                       )}
                                   </div>
                               </td>
                           </tr>
                       )
                   }) : (
                       <tr>
                           <td colSpan={4} className="p-8 text-center text-slate-400 text-sm italic">Chưa có dữ liệu chấm công cho ngày này tại công trình này.</td>
                       </tr>
                   )}
                </tbody>
             </table>
          </div>
      </div>
    </div>
  );
};

const Payroll = ({ workers, records, projects }: any) => {
  const [weekEnd, setWeekEnd] = useState(() => getThursdayOfWeek(new Date()).toISOString().split('T')[0]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(''); // Filter state
  
  const weekStart = useMemo(() => {
    const d = new Date(weekEnd);
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  }, [weekEnd]);

  const payrollData = useMemo(() => {
    // 1. Filter by date range
    let filteredRecords = records.filter((r: any) => r.date >= weekStart && r.date <= weekEnd);
    
    // 2. Filter by project if selected
    if (selectedProjectId) {
        filteredRecords = filteredRecords.filter((r: any) => r.projectId === selectedProjectId);
    }

    return workers.map((w: any) => {
      const wRecords = filteredRecords.filter((r: any) => r.workerId === w.id);
      const totalShifts = wRecords.reduce((sum: number, r: any) => sum + r.shifts, 0);
      const totalAmount = wRecords.reduce((sum: number, r: any) => sum + (r.shifts * r.rateUsed), 0);
      const projectNames = Array.from(new Set(wRecords.map(r => projects.find((p:any)=>p.id===r.projectId)?.name))).filter(Boolean);
      return { worker: w, totalShifts, totalAmount, projectNames, details: wRecords };
    }).filter((item: any) => item.totalShifts > 0);
  }, [workers, records, projects, weekStart, weekEnd, selectedProjectId]);

  const selectedProjectName = projects.find((p:any) => p.id === selectedProjectId)?.name || "TẤT CẢ CÔNG TRÌNH";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <h2 className="text-2xl font-bold text-slate-800 uppercase">Thanh Toán Tuần</h2>
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Lọc CT</span>
               <select 
                   value={selectedProjectId} 
                   onChange={(e) => setSelectedProjectId(e.target.value)}
                   className="p-1 border-none outline-none font-bold text-sm text-slate-700 bg-transparent min-w-[150px]"
               >
                   <option value="">Tất cả công trình</option>
                   {projects.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
               </select>
           </div>
           <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Ngày chốt</span>
               <input 
                 type="date" 
                 value={weekEnd} 
                 onChange={e => setWeekEnd(e.target.value)} 
                 className="p-1 border-none rounded-lg font-bold text-sm text-blue-600 outline-none"
               />
            </div>
            <button onClick={() => window.print()} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-700 transition-all shadow-sm">
              <FileDown className="w-5 h-5" /> IN
            </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="hidden print:block text-center p-8 border-b">
          <h1 className="text-3xl font-bold text-slate-900 uppercase">CÔNG TY T&T</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase tracking-[0.2em] text-sm">BẢNG THANH TOÁN TIỀN LƯƠNG CÔNG NHẬT</p>
          <div className="flex justify-center gap-8 mt-4">
              <div className="text-left">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Kỳ lương</p>
                  <p className="font-bold text-base">{formatDate(weekStart)} - {formatDate(weekEnd)}</p>
              </div>
              <div className="text-left border-l pl-8">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Phạm vi công trình</p>
                  <p className="font-bold text-base uppercase">{selectedProjectName}</p>
              </div>
          </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nhân sự</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Chi tiết chấm công (Ngày: Công)</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest w-32">Tổng Công</th>
                <th className="p-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest w-40">Thành Tiền</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {payrollData.map((item: any) => (
                <tr key={item.worker.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                        <p className="font-bold text-slate-800 text-base">{item.worker.name}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase mt-1">{item.projectNames.join(' • ')}</p>
                    </td>
                    <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                            {item.details.sort((a:any,b:any) => a.date.localeCompare(b.date)).map((d: any) => {
                                const dateObj = new Date(d.date);
                                return (
                                    <span key={d.id} className="inline-flex items-center px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600">
                                        <span className="font-medium mr-1">{dateObj.getDate()}/{dateObj.getMonth()+1}:</span>
                                        <span className="font-bold text-blue-600">{d.shifts}c</span>
                                    </span>
                                )
                            })}
                        </div>
                    </td>
                    <td className="p-4 text-center">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-bold text-sm">{item.totalShifts}</span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600 text-base">{formatCurrency(item.totalAmount)}</td>
                </tr>
                ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white">
                <tr>
                <td className="p-5 text-right font-bold uppercase text-xs tracking-widest" colSpan={2}>TỔNG CỘNG CHI TRẢ:</td>
                <td colSpan={2} className="p-5 text-right text-2xl font-bold text-emerald-400">
                    {formatCurrency(payrollData.reduce((sum, item) => sum + item.totalAmount, 0))}
                </td>
                </tr>
            </tfoot>
            </table>
        </div>
      </div>
    </div>
  );
};

const ManageWorkers = ({ workers, projects, onAdd, onDelete, onUpdate }: any) => {
  // Removed dailyRate from initialForm as requested
  const initialForm = { id: '', name: '', role: 'Công nhật', currentProjectId: '', bankAccount: '', bankName: '' };
  const [f, setF] = useState(initialForm);
  const [isEdit, setIsEdit] = useState(false);

  const handleSave = () => {
    if (!f.name) return alert("Vui lòng nhập tên công nhân!");
    // Preserve existing dailyRate if editing, or set default 0 if adding (since it's not used in UI anymore)
    const workerToSave = isEdit 
        ? { ...f, dailyRate: (workers.find((w:any) => w.id === f.id)?.dailyRate || 0) }
        : { ...f, id: Date.now().toString(), dailyRate: 0 };
        
    isEdit ? onUpdate(workerToSave) : onAdd(workerToSave);
    setF(initialForm);
    setIsEdit(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 bg-white p-5 rounded-xl border shadow-sm h-fit space-y-4">
        <h3 className="font-bold text-base flex items-center border-b pb-3 uppercase text-slate-700">
          {isEdit ? <Edit className="w-5 h-5 mr-2 text-orange-500" /> : <Plus className="w-5 h-5 mr-2 text-blue-500" />}
          {isEdit ? 'Sửa thông tin' : 'Thêm thợ mới'}
        </h3>
        <div className="space-y-3">
          <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Họ tên</label><input className="w-full p-3 border rounded-lg mt-1 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500" value={f.name} onChange={e => setF({...f, name: e.target.value})} /></div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Chức vụ</label>
            <select
                className="w-full p-3 border rounded-lg mt-1 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                value={f.role} 
                onChange={e => setF({...f, role: e.target.value})} 
            >
                <option value="Công nhật">Công nhật</option>
                <option value="Thợ chính">Thợ chính</option>
                <option value="Phụ hồ">Phụ hồ</option>
                <option value="Kỹ thuật">Kỹ thuật</option>
                <option value="Khác">Khác</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Công trình trực thuộc</label>
            <select className="w-full p-3 border rounded-lg mt-1 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white" value={f.currentProjectId} onChange={e => setF({...f, currentProjectId: e.target.value})}>
              <option value="">-- Chưa gán --</option>
              {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tài khoản ngân hàng</h4>
            <input className="w-full p-3 border rounded-lg text-sm mb-3 font-medium" placeholder="Số tài khoản..." value={f.bankAccount} onChange={e => setF({...f, bankAccount: e.target.value})} />
            <input className="w-full p-3 border rounded-lg text-sm font-medium" placeholder="Tên ngân hàng..." value={f.bankName} onChange={e => setF({...f, bankName: e.target.value})} />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSave} className={`flex-1 py-3 text-white rounded-lg font-bold text-xs uppercase shadow-lg ${isEdit ? 'bg-orange-500' : 'bg-blue-600'}`}>{isEdit ? 'CẬP NHẬT' : 'LƯU HỒ SƠ'}</button>
          {isEdit && <button onClick={() => { setIsEdit(false); setF(initialForm); }} className="px-5 bg-slate-200 rounded-lg font-bold text-xs uppercase">Hủy</button>}
        </div>
      </div>
      <div className="lg:col-span-3 bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Hồ sơ công nhân</th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Phụ trách tại</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Quản lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workers.map((w: any) => (
                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-base text-slate-800">{w.name}</p>
                    <p className="text-xs text-slate-500 font-medium uppercase mt-1">{w.role} • {w.bankAccount || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    {w.currentProjectId ? (
                      <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold uppercase">
                        {projects.find((p: any) => p.id === w.currentProjectId)?.name || 'Unknown'}
                      </span>
                    ) : <span className="text-xs text-slate-400 font-bold italic uppercase">Vãng lai / Chưa gán</span>}
                  </td>
                  <td className="p-4 flex justify-center gap-3">
                    <button onClick={() => { setF(w); setIsEdit(true); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => { if(confirm('Xóa công nhân này?')) onDelete(w.id) }} className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-all"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ManageProjects = ({ projects, onAdd, onDelete, onUpdate }: any) => {
    const initialForm = { id: '', name: '', address: '', status: 'active', standardRate: 500000, doubleRate: 1000000 };
    const [f, setF] = useState<any>(initialForm);
    const [isEdit, setIsEdit] = useState(false);

    const handleSave = () => {
        if (!f.name) return alert("Vui lòng nhập tên công trình!");
        isEdit ? onUpdate(f) : onAdd({ ...f, id: Date.now().toString() });
        setF(initialForm);
        setIsEdit(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                <h3 className="font-bold text-base border-b pb-3 uppercase text-slate-700">
                    {isEdit ? 'Cập nhật Công Trình' : 'Khai báo Công Trình'}
                </h3>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tên công trình</label>
                    <input className="w-full p-3 border rounded-lg mt-1 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="VD: Cầu Mỹ Thuận 2..." value={f.name} onChange={e => setF({...f, name: e.target.value})} />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Địa chỉ</label>
                    <input className="w-full p-3 border rounded-lg mt-1 font-medium text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Địa chỉ..." value={f.address} onChange={e => setF({...f, address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Lương 1 công</label>
                        <input type="number" className="w-full p-3 border rounded-lg mt-1 font-bold text-blue-600 text-sm outline-none" value={f.standardRate} onChange={e => setF({...f, standardRate: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Lương 2 công</label>
                        <input type="number" className="w-full p-3 border rounded-lg mt-1 font-bold text-emerald-600 text-sm outline-none" value={f.doubleRate} onChange={e => setF({...f, doubleRate: Number(e.target.value)})} />
                    </div>
                </div>
                <div>
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Trạng thái</label>
                     <select className="w-full p-3 border rounded-lg mt-1 font-bold text-sm bg-white" value={f.status} onChange={e => setF({...f, status: e.target.value})}>
                         <option value="active">Đang thi công</option>
                         <option value="completed">Đã hoàn thành</option>
                     </select>
                </div>
                <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} className={`w-full text-white py-3.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-100 ${isEdit ? 'bg-orange-500' : 'bg-blue-600'}`}>{isEdit ? 'LƯU THAY ĐỔI' : 'TẠO DỰ ÁN MỚI'}</button>
                    {isEdit && <button onClick={() => { setIsEdit(false); setF(initialForm); }} className="px-5 bg-slate-200 rounded-xl font-bold text-xs uppercase">Hủy</button>}
                </div>
            </div>
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left min-w-[600px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Dự án</th>
                            <th className="p-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Đơn giá (1/2 công)</th>
                            <th className="p-5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
                            <th className="p-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Quản lý</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {projects.map((p: any) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                                <td className="p-5">
                                    <p className="font-bold text-slate-800 text-base">{p.name}</p>
                                    <p className="text-xs text-slate-400 font-medium uppercase mt-1">{p.address}</p>
                                </td>
                                <td className="p-5 text-center">
                                    <div className="text-sm font-bold text-slate-600 mb-1">{formatCurrency(p.standardRate || 0)} <span className="text-xs text-slate-400 font-normal">/1c</span></div>
                                    <div className="text-sm font-bold text-emerald-600">{formatCurrency(p.doubleRate || 0)} <span className="text-xs text-slate-400 font-normal">/2c</span></div>
                                </td>
                                <td className="p-5 text-center">
                                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {p.status === 'active' ? 'Đang thi công' : 'Đã hoàn thành'}
                                    </span>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => { setF(p); setIsEdit(true); }} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"><Edit className="w-5 h-5" /></button>
                                        <button onClick={() => { if(confirm('Xóa dự án này?')) onDelete(p.id); }} className="p-2 text-red-600 hover:bg-red-100 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DebtManagement = ({ workers, records, transactions, onAddTx, onDeleteTx }: any) => {
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const debtSummary = useMemo(() => {
        return workers.map((w: any) => {
            const earned = records.filter((r: any) => r.workerId === w.id).reduce((s: number, r: any) => s + (r.shifts * r.rateUsed), 0);
            const wTx = transactions.filter((t: any) => t.workerId === w.id);
            const advanced = wTx.filter((t: any) => t.type === 'advance').reduce((s: number, t: any) => s + t.amount, 0);
            const paid = wTx.filter((t: any) => t.type === 'payment').reduce((s: number, t: any) => s + t.amount, 0);
            return { worker: w, earned, advanced, paid, balance: earned - (advanced + paid), history: wTx };
        });
    }, [workers, records, transactions]);

    const active = debtSummary.find((d: any) => d.worker.id === selectedWorkerId);

    const handleTx = (type: 'advance' | 'payment') => {
        if (!selectedWorkerId || !amount) return alert("Vui lòng nhập số tiền!");
        onAddTx({ id: Date.now().toString(), workerId: selectedWorkerId, type, amount: Number(amount), date: new Date().toISOString().split('T')[0], note: note || (type==='advance'?'Tạm ứng lương':'Thanh toán lương') });
        setAmount(''); setNote('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden h-fit">
                <div className="p-5 bg-slate-50 border-b font-bold text-xs uppercase tracking-widest text-slate-500">Bảng theo dõi công nợ công nhân</div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <th className="p-4">Tên công nhân</th>
                            <th className="p-4 text-right">Tổng lương tích lũy</th>
                            <th className="p-4 text-right">Đã ứng</th>
                            <th className="p-4 text-right">Số dư còn lại</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {debtSummary.map((d: any) => (
                            <tr key={d.worker.id} onClick={() => setSelectedWorkerId(d.worker.id)} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedWorkerId === d.worker.id ? 'bg-blue-50' : ''}`}>
                                <td className="p-4 font-bold text-sm text-slate-800">{d.worker.name}</td>
                                <td className="p-4 text-right text-sm font-medium text-slate-500">{formatCurrency(d.earned)}</td>
                                <td className="p-4 text-right text-sm font-bold text-orange-600">{formatCurrency(d.advanced)}</td>
                                <td className="p-4 text-right font-bold text-base text-blue-700">{formatCurrency(d.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="space-y-4">
                {active ? (
                    <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                        <h3 className="font-bold text-base border-b pb-3 uppercase">Giao dịch cho: {active.worker.name}</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Số tiền (VNĐ)</label><input type="number" className="w-full p-3 border rounded-lg mt-1 font-bold text-xl text-blue-700 outline-none" value={amount} onChange={e => setAmount(e.target.value)} /></div>
                            <div><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nội dung</label><input className="w-full p-3 border rounded-lg mt-1 font-medium text-sm outline-none" value={note} onChange={e => setNote(e.target.value)} /></div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => handleTx('advance')} className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-orange-700 shadow-lg shadow-orange-100">ỨNG LƯƠNG</button>
                                <button onClick={() => handleTx('payment')} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-100">THANH TOÁN</button>
                            </div>
                        </div>
                        <div className="pt-5 border-t mt-5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Lịch sử giao dịch gần nhất</h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {active.history.length === 0 && <p className="text-center text-slate-300 text-sm italic">Chưa có giao dịch</p>}
                                {active.history.sort((a:any,b:any)=>new Date(b.date).getTime() - new Date(a.date).getTime()).map((tx: any) => (
                                    <div key={tx.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                        <div className="overflow-hidden">
                                            <p className={`text-[10px] font-bold uppercase ${tx.type==='advance'?'text-orange-600':'text-emerald-600'}`}>{tx.type==='advance'?'Tạm ứng':'Đã trả'}</p>
                                            <p className="text-xs font-bold text-slate-700 truncate mt-0.5">{tx.note}</p>
                                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{formatDate(tx.date)}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className="font-bold text-sm">{formatCurrency(tx.amount)}</p>
                                            <button onClick={() => onDeleteTx(tx.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-blue-50 p-10 rounded-2xl border border-dashed border-blue-200 text-center flex flex-col items-center">
                        <Wallet className="w-12 h-12 text-blue-300 mb-4" />
                        <h3 className="font-bold text-blue-800 uppercase text-sm">Chọn công nhân</h3>
                        <p className="text-xs text-blue-600 mt-2 font-medium leading-relaxed">Vui lòng chọn một công nhân ở bảng bên trái để quản lý tiền ứng và thanh toán công nợ.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>(MOCK_WORKERS);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [records, setRecords] = useState<TimeRecord[]>(MOCK_RECORDS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [logs, setLogs] = useState<ActivityLog[]>(MOCK_LOGS);

  const logAction = (action: string, details: string) => {
    if (!user) return;
    setLogs(prev => [{ id: Date.now().toString(), userId: user.id, userName: user.name, action, details, timestamp: new Date().toISOString() }, ...prev]);
  };

  const handleAddTx = (t: Transaction) => {
      setTransactions(prev => [...prev, t]);
      logAction('Tài chính', `${t.type==='advance'?'Chi tiền ứng':'Thanh toán lương'} cho ${workers.find(w=>w.id===t.workerId)?.name}`);
  };

  const handleImportData = (table: string, data: any[], mode: 'append' | 'replace') => {
    const updateFn = (prev: any[]) => mode === 'replace' ? data : [...prev, ...data];
    if (table === 'workers') setWorkers(updateFn);
    else if (table === 'projects') setProjects(updateFn);
    else if (table === 'records') setRecords(updateFn);
    logAction('Dữ liệu', `Import ${data.length} bản ghi vào ${table}`);
  };

  const handleDeleteRecord = (id: string) => {
      setRecords(prev => prev.filter(r => r.id !== id));
      logAction('Chấm công', `Xóa bản ghi chấm công ${id}`);
  };

  const handleUpdateRecord = (id: string, newShifts: number) => {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, shifts: newShifts } : r));
      logAction('Chấm công', `Cập nhật bản ghi ${id} thành ${newShifts} công`);
  };

  // --- Backup & Restore Functions ---
  const handleFullBackup = () => {
    const data = {
        workers,
        projects,
        records,
        transactions,
        logs,
        version: "1.0",
        backupDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_TT_FULL_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    logAction('Hệ thống', 'Thực hiện sao lưu toàn bộ dữ liệu (JSON)');
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        alert('Vui lòng chọn file JSON hợp lệ (file backup từ hệ thống).');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Basic validation
        if (!Array.isArray(data.workers) || !Array.isArray(data.projects)) {
            throw new Error('Cấu trúc file không hợp lệ');
        }

        if(window.confirm(`Tìm thấy dữ liệu backup ngày ${formatDate(data.backupDate || '')}.\nBạn có chắc chắn muốn KHÔI PHỤC không? Dữ liệu hiện tại sẽ bị thay thế.`)) {
             if (data.workers) setWorkers(data.workers);
             if (data.projects) setProjects(data.projects);
             if (data.records) setRecords(data.records);
             if (data.transactions) setTransactions(data.transactions);
             if (data.logs) setLogs(data.logs);
             alert('Khôi phục dữ liệu thành công!');
             logAction('Hệ thống', 'Khôi phục dữ liệu từ file backup JSON');
        }
      } catch (err) {
        console.error(err);
        alert('File backup bị lỗi hoặc không đúng định dạng!');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const chartData = useMemo(() => {
      const dates = [...new Set(records.map(r => r.date))].sort();
      // Get last 10 distinct dates
      const recentDates = dates.slice(-10);

      return recentDates.map(date => {
          const dayRecords = records.filter(r => r.date === date);
          const dataPoint: any = { name: formatDate(date) }; // Use formatted date as label
          
          // Initialize all projects to 0 to align bars
          projects.forEach(p => {
              dataPoint[p.name] = 0;
          });

          // Aggregate shifts per project
          dayRecords.forEach(r => {
              const project = projects.find(p => p.id === r.projectId);
              if (project) {
                  dataPoint[project.name] = (dataPoint[project.name] || 0) + r.shifts;
              }
          });
          return dataPoint;
      });
  }, [records, projects]);

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  if (!user) return <LoginScreen onLogin={u => setUser(u)} />;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar currentView={view} setView={setView} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} currentUser={user} onLogout={() => setUser(null)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white border-b border-slate-200 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-600"><Menu className="w-6 h-6" /></button>
          <h1 className="text-sm font-black tracking-tighter uppercase text-slate-700">Công ty T&T</h1>
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-lg">{user.name.charAt(0)}</div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {view === 'dashboard' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">XIN CHÀO, {user.name.toUpperCase()}!</h2>
                        <p className="text-slate-500 font-medium text-base mt-1">Hôm nay là {formatDate(new Date().toISOString())} - Chúc một ngày làm việc hiệu quả!</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Users className="w-7 h-7" /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tổng nhân sự</p><p className="text-3xl font-black text-slate-800 mt-1">{workers.length}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600"><HardHat className="w-7 h-7" /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">CT Đang chạy</p><p className="text-3xl font-black text-slate-800 mt-1">{projects.filter(p => p.status === 'active').length}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
                    <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600"><CalendarClock className="w-7 h-7" /></div>
                    <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sản lượng tích lũy</p><p className="text-3xl font-black text-slate-800 mt-1">{records.reduce((s, r) => s + r.shifts, 0)}</p></div>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-3 text-base"><History className="w-5 h-5 text-blue-500" /> TỔNG HỢP CÔNG THEO NGÀY</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 11}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 700, fontSize: 11}} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 'bold'}} />
                        {projects.map((p: any, index: number) => (
                            <Bar key={p.id} dataKey={p.name} stackId="a" fill={chartColors[index % chartColors.length]} radius={[4, 4, 0, 0]} barSize={32} />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            {view === 'timesheet' && <Timesheet workers={workers} projects={projects} records={records} onDeleteRecord={handleDeleteRecord} onUpdateRecord={handleUpdateRecord} onAddRecord={(r: any) => { setRecords(p => [...p, ...r]); logAction('Chấm công', `Ghi nhận ${r.length} bản ghi chấm công`); }} />}
            {view === 'payroll' && <Payroll workers={workers} records={records} projects={projects} currentUser={user} />}
            {view === 'debt' && <DebtManagement workers={workers} records={records} transactions={transactions} onAddTx={handleAddTx} onDeleteTx={(id:string)=>setTransactions(prev=>prev.filter(t=>t.id!==id))} />}
            {view === 'workers' && <ManageWorkers workers={workers} projects={projects} onAdd={(w: any) => setWorkers(p => [...p, w])} onDelete={(id: any) => setWorkers(p => p.filter(x => x.id !== id))} onUpdate={(w: any) => setWorkers(p => p.map(x => x.id === w.id ? w : x))} />}
            {view === 'projects' && <ManageProjects projects={projects} onAdd={(p: any) => setProjects((prev: any) => [...prev, p])} onDelete={(id: any) => setProjects((prev: any) => prev.filter((p: any) => p.id !== id))} onUpdate={(p: any) => setProjects((prev: any) => prev.map((item: any) => item.id === p.id ? p : item))} />}
            {view === 'backup' && user.role === 'admin' && (
              <div className="space-y-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-2xl font-bold flex items-center gap-3 uppercase"><Database className="text-blue-600 w-7 h-7" /> Trung tâm Dữ liệu & Sao lưu</h2>
                
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-2"><Info className="w-5 h-5" /> LƯU Ý QUAN TRỌNG</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">Vì hệ thống chưa kết nối cơ sở dữ liệu (Database) nên mỗi lần cập nhật phiên bản mới, dữ liệu có thể bị đặt lại. 
                    Vui lòng thực hiện <strong>SAO LƯU FULL (JSON)</strong> trước khi cập nhật và <strong>KHÔI PHỤC</strong> sau khi cập nhật xong.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {/* Full Backup */}
                   <div className="p-8 border-2 border-slate-100 rounded-2xl bg-white hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center text-center" onClick={handleFullBackup}>
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-5 group-hover:scale-110 transition-transform shadow-sm"><Database className="w-8 h-8" /></div>
                      <h4 className="font-black text-lg uppercase text-slate-800">1. Sao lưu Full (JSON)</h4>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Tải về toàn bộ dữ liệu (Công nhân, Công trình, Chấm công, Tiền ứng) để lưu trữ an toàn.</p>
                      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase">Tải xuống ngay</button>
                   </div>

                   {/* Restore */}
                   <label className="p-8 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 hover:bg-white hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center text-center relative">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-5 group-hover:scale-110 transition-transform shadow-sm"><RefreshCw className="w-8 h-8" /></div>
                      <h4 className="font-black text-lg uppercase text-slate-800">2. Khôi phục Dữ liệu</h4>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Chọn file JSON đã sao lưu trước đó để khôi phục lại trạng thái cũ.</p>
                      <span className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs uppercase">Chọn File Backup</span>
                      <input type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} />
                   </label>

                   {/* Excel Report (Legacy) */}
                   <div className="p-8 border-2 border-slate-100 rounded-2xl bg-white hover:border-orange-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center text-center opacity-80 hover:opacity-100" onClick={() => exportToCSV(records, 'BaoCaoChamCong_TT')}>
                      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-5 group-hover:scale-110 transition-transform shadow-sm"><FileDown className="w-8 h-8" /></div>
                      <h4 className="font-black text-lg uppercase text-slate-800">3. Xuất Excel/CSV</h4>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Chỉ xuất dữ liệu chấm công để làm báo cáo. Không dùng để khôi phục hệ thống.</p>
                      <button className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg font-bold text-xs uppercase">Xuất báo cáo</button>
                   </div>
                </div>
              </div>
            )}
            {view === 'logs' && user.role === 'admin' && (
              <div className="space-y-5">
                <h2 className="text-2xl font-bold flex items-center gap-3 uppercase"><History className="text-slate-700 w-7 h-7" /> Nhật ký truy cập hệ thống</h2>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Thời điểm</th><th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Tài khoản</th><th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Hành động</th><th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Chi tiết</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{logs.map(l => <tr key={l.id} className="hover:bg-slate-50/50 transition-colors"><td className="p-5 text-xs text-slate-400 font-bold">{formatDateTime(l.timestamp)}</td><td className="p-5 font-bold text-slate-700 text-sm">{l.userName.toUpperCase()}</td><td className="p-5 font-bold text-blue-600 text-sm uppercase">{l.action}</td><td className="p-5 text-sm text-slate-600 font-medium">{l.details}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}