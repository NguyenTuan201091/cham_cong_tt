import React, { useState, useMemo, useEffect } from 'react';
import { Worker, Project, TimeRecord, ViewMode, WeeklyPayrollItem, Transaction, User, ActivityLog } from './types';
import { MOCK_WORKERS, MOCK_PROJECTS, MOCK_RECORDS, MOCK_TRANSACTIONS, MOCK_USERS, MOCK_LOGS } from './constants';
import { analyzePayroll } from './services/geminiService';
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
  Edit,
  Eye,
  CreditCard,
  Phone
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

// --- Utility Functions ---

const getThursdayOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  let diff = 4 - day;
  if (diff < 0) {
      diff += 7;
  }
  d.setDate(d.getDate() + diff);
  return d;
};

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
};

const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('vi-VN');
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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
            let isValid = false;
            if (user.username === 'admin' && password === 'Tuan123456@') isValid = true;
            else if ((user.username === 'luc' || user.username === 'du') && password === '123456') isValid = true;
            if (isValid) onLogin(user);
            else setError('Mật khẩu không đúng.');
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
                        <select value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">-- Chọn người dùng --</option>
                            {MOCK_USERS.map(u => <option key={u.id} value={u.username}>{u.name} ({u.username})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">Đăng Nhập</button>
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
  if (currentUser.role === 'admin') menuItems.push({ id: 'logs', label: 'Nhật Ký', icon: History });

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden print:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden flex flex-col`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-800 shrink-0"><h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Chấm công T&T</h1></div>
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg">{currentUser.username.charAt(0).toUpperCase()}</div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{currentUser.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
                </div>
            </div>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setView(item.id); setMobileOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${currentView === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 shrink-0"><button onClick={onLogout} className="flex items-center w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"><LogOut className="w-5 h-5 mr-3" /><span className="font-medium">Đăng Xuất</span></button></div>
      </div>
    </>
  );
};

const Dashboard = ({ workers, projects, records }: any) => {
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const totalShiftsRecorded = records.length;
  const chartData = useMemo(() => {
     const data: any[] = [];
     const today = new Date();
     for(let i=6; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayRecords = records.filter((r: any) => r.date === dateStr);
        const totalShifts = dayRecords.reduce((acc: number, curr: any) => acc + curr.shifts, 0);
        const details: Record<string, number> = {};
        dayRecords.forEach((r: any) => {
             const project = projects.find((p: any) => p.id === r.projectId);
             const pName = project ? project.name : 'Khác';
             details[pName] = (details[pName] || 0) + r.shifts;
        });
        data.push({ name: `${d.getDate()}/${d.getMonth()+1}`, shifts: totalShifts, details: details });
     }
     return data;
  }, [records, projects]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Tổng Quan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Tổng Công Nhật</p><p className="text-3xl font-bold text-slate-800 mt-1">{workers.length}</p></div><div className="p-3 bg-blue-50 rounded-lg"><Users className="w-6 h-6 text-blue-600" /></div></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Công Trình Đang Chạy</p><p className="text-3xl font-bold text-slate-800 mt-1">{activeProjects}</p></div><div className="p-3 bg-orange-50 rounded-lg"><HardHat className="w-6 h-6 text-orange-600" /></div></div></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">Lượt Chấm Công</p><p className="text-3xl font-bold text-slate-800 mt-1">{totalShiftsRecorded}</p></div><div className="p-3 bg-emerald-50 rounded-lg"><CalendarClock className="w-6 h-6 text-emerald-600" /></div></div></div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><h3 className="text-lg font-semibold mb-4 text-slate-800">Biểu Đồ Chấm Công (7 Ngày Qua)</h3><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip content={<div className="bg-white p-2 border rounded shadow text-xs">Phân tích chi tiết</div>} /><Bar dataKey="shifts" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
    </div>
  );
};

const Timesheet = ({ workers, projects, records, onAddRecord }: any) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState(projects.length > 0 ? projects[0].id : '');
    const [filterByProject, setFilterByProject] = useState(true);
    const [inputs, setInputs] = useState<Record<string, any>>({});
    const filteredWorkers = useMemo(() => filterByProject ? workers.filter((w: any) => w.currentProjectId === projectId) : workers, [workers, projectId, filterByProject]);

    useEffect(() => {
        const initialInputs: any = {};
        workers.forEach((w: any) => { initialInputs[w.id] = { shifts: 1, customRate: w.dailyRate, selected: false, note: '' }; });
        setInputs(initialInputs);
    }, [workers, projectId]);

    const handleSave = () => {
        const newRecords: TimeRecord[] = [];
        filteredWorkers.forEach((worker: any) => {
            const data = inputs[worker.id];
            if (data?.selected) newRecords.push({ id: Date.now() + '-' + worker.id, workerId: worker.id, projectId, date, shifts: data.shifts, rateUsed: data.customRate, note: data.note });
        });
        if (newRecords.length === 0) { alert("Vui lòng chọn ít nhất một công nhật."); return; }
        onAddRecord(newRecords);
        alert("Lưu thành công!");
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Chấm Công</h2><input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded" /></div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4 w-12"><input type="checkbox" /></th><th className="p-4">Công Nhật</th><th className="p-4">Công (Shift)</th><th className="p-4">Đơn giá</th><th className="p-4">Thành tiền</th></tr></thead>
                    <tbody className="divide-y">{filteredWorkers.map((w: any) => <tr key={w.id}><td className="p-4"><input type="checkbox" checked={inputs[w.id]?.selected} onChange={e => setInputs({...inputs, [w.id]: {...inputs[w.id], selected: e.target.checked}})} /></td><td className="p-4 font-medium">{w.name}</td><td className="p-4"><input type="number" step="0.5" value={inputs[w.id]?.shifts} onChange={e => setInputs({...inputs, [w.id]: {...inputs[w.id], shifts: Number(e.target.value)}})} className="w-16 border rounded p-1" /></td><td className="p-4">{formatCurrency(inputs[w.id]?.customRate || 0)}</td><td className="p-4 font-bold text-blue-600">{formatCurrency((inputs[w.id]?.shifts || 0) * (inputs[w.id]?.customRate || 0))}</td></tr>)}</tbody>
                </table>
                <div className="p-4 border-t bg-slate-50 flex justify-end"><button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Lưu Chấm Công</button></div>
            </div>
        </div>
    );
};

const Payroll = ({ workers, records, projects, currentUser }: any) => {
    const [weekEnd, setWeekEnd] = useState(() => getThursdayOfWeek(new Date()).toISOString().split('T')[0]);
    const weekStart = useMemo(() => { const d = new Date(weekEnd); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]; }, [weekEnd]);
    const weeklyData = useMemo(() => {
        let filteredRecords = records.filter((r: any) => r.date >= weekStart && r.date <= weekEnd);
        return workers.map((w: any) => {
            const workerRecords = filteredRecords.filter((r: any) => r.workerId === w.id);
            const totalShifts = workerRecords.reduce((sum: number, r: any) => sum + r.shifts, 0);
            const totalAmount = workerRecords.reduce((sum: number, r: any) => sum + (r.shifts * r.rateUsed), 0);
            const projectNames = Array.from(new Set(workerRecords.map((r: any) => projects.find((p: any) => p.id === r.projectId)?.name || 'Unknown')));
            return { worker: w, totalShifts, totalAmount, details: workerRecords, projectNames };
        }).filter((i: any) => i.totalShifts > 0);
    }, [weekStart, weekEnd, records, workers, projects]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden"><h2 className="text-2xl font-bold">Bảng Lương Tuần</h2><button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center"><FileDown className="w-4 h-4 mr-2" /> Xuất Báo Cáo</button></div>
            <div className="hidden print:block mb-8 border-b pb-4 text-center">
                <h1 className="text-xl font-bold uppercase">Bảng Lương Công Nhật T&T</h1>
                <p className="text-sm">Kỳ: {formatDate(weekStart)} - {formatDate(weekEnd)} | Xuất bởi: {currentUser.name}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Công Nhật</th><th className="p-4">Công Trình</th><th className="p-4 text-center">Tổng Công</th><th className="p-4 text-right">Lương</th></tr></thead>
                    <tbody className="divide-y">{weeklyData.map((item: any) => <tr key={item.worker.id}><td className="p-4"><div className="font-bold">{item.worker.name}</div><div className="text-xs text-slate-500">{item.worker.role}</div></td><td className="p-4 text-sm">{item.projectNames.join(', ')}</td><td className="p-4 text-center"><span className="bg-blue-50 px-2 py-1 rounded font-bold text-blue-600">{item.totalShifts}</span></td><td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(item.totalAmount)}</td></tr>)}</tbody>
                </table>
            </div>
        </div>
    );
};

// --- CRUD Components Updated ---

const ManageWorkers = ({ workers, projects, onAdd, onDelete, onUpdate }: any) => {
    // Default role 'Công nhật'
    const initialFormState = { id: '', name: '', role: 'Công nhật', dailyRate: 350000, currentProjectId: '', identityCardNumber: '', phone: '', bankAccount: '', bankName: '' };
    const [formData, setFormData] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [viewWorker, setViewWorker] = useState<any>(null);

    // Sort workers: 'Công nhật' first
    const sortedWorkers = useMemo(() => {
        return [...workers].sort((a, b) => {
            if (a.role === 'Công nhật' && b.role !== 'Công nhật') return -1;
            if (a.role !== 'Công nhật' && b.role === 'Công nhật') return 1;
            return a.name.localeCompare(b.name);
        });
    }, [workers]);

    const handleEdit = (w: any) => {
        setFormData(w);
        setIsEditing(true);
        setViewWorker(null);
    };

    const handleSave = () => {
        if (!formData.name) { alert("Vui lòng nhập tên!"); return; }
        if (isEditing) {
            onUpdate(formData);
            alert("Cập nhật thành công!");
        } else {
            onAdd({ ...formData, id: Date.now().toString() });
            alert("Thêm thành công!");
        }
        setFormData(initialFormState);
        setIsEditing(false);
    };

    const cancelEdit = () => {
        setFormData(initialFormState);
        setIsEditing(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Quản Lý Công Nhật</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Form Section */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
                    <h3 className="font-bold mb-4 text-lg border-b pb-2 flex items-center">
                        {isEditing ? <Edit className="w-5 h-5 mr-2 text-orange-600" /> : <Plus className="w-5 h-5 mr-2 text-blue-600" />}
                        {isEditing ? 'Sửa Thông Tin' : 'Thêm Công Nhật'}
                    </h3>
                    <div className="space-y-3">
                        <div><label className="text-xs text-slate-500 font-bold">Họ Tên</label><input className="w-full p-2 border rounded focus:ring-1 ring-blue-500 outline-none" placeholder="Họ tên" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div><label className="text-xs text-slate-500 font-bold">Vai Trò</label>
                            <select className="w-full p-2 border rounded outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                <option value="Công nhật">Công nhật</option>
                                <option value="Thợ Chính">Thợ Chính</option>
                                <option value="Phụ Hồ">Phụ Hồ</option>
                                <option value="Thợ Điện">Thợ Điện</option>
                                <option value="Thợ Nước">Thợ Nước</option>
                                <option value="Kỹ Sư">Kỹ Sư</option>
                            </select>
                        </div>
                        <div><label className="text-xs text-slate-500 font-bold">Công Trình</label>
                            <select className="w-full p-2 border rounded outline-none" value={formData.currentProjectId} onChange={e => setFormData({ ...formData, currentProjectId: e.target.value })}>
                                <option value="">-- Chọn công trình --</option>
                                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div><label className="text-xs text-slate-500 font-bold">SĐT</label><input className="w-full p-2 border rounded outline-none text-sm" placeholder="SĐT" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                            <div><label className="text-xs text-slate-500 font-bold">CCCD</label><input className="w-full p-2 border rounded outline-none text-sm" placeholder="CCCD" value={formData.identityCardNumber} onChange={e => setFormData({ ...formData, identityCardNumber: e.target.value })} /></div>
                        </div>
                        <div><label className="text-xs text-slate-500 font-bold">Lương/Ngày</label><input type="number" step="10000" className="w-full p-2 border rounded outline-none" placeholder="Lương 1 công" value={formData.dailyRate} onChange={e => setFormData({ ...formData, dailyRate: Number(e.target.value) })} /></div>
                        <div className="border-t pt-3 mt-3">
                            <h4 className="text-xs font-bold text-slate-700 mb-2 uppercase flex items-center"><CreditCard className="w-3 h-3 mr-1" /> Tài Khoản Ngân Hàng</h4>
                            <input className="w-full p-2 border rounded outline-none text-sm mb-2" placeholder="Số tài khoản" value={formData.bankAccount} onChange={e => setFormData({ ...formData, bankAccount: e.target.value })} />
                            <input className="w-full p-2 border rounded outline-none text-sm" placeholder="Tên ngân hàng" value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} />
                        </div>
                        <div className="flex gap-2 pt-4">
                            <button className={`flex-1 py-2 text-white rounded font-bold shadow-sm transition-colors ${isEditing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`} onClick={handleSave}>
                                {isEditing ? 'Cập Nhật' : 'Lưu Lại'}
                            </button>
                            {isEditing && <button className="px-4 py-2 bg-slate-200 text-slate-600 rounded font-bold hover:bg-slate-300" onClick={cancelEdit}>Hủy</button>}
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Details Modal (Simplified as a div overlay) */}
                    {viewWorker && (
                        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-blue-800 text-lg flex items-center"><IdCard className="w-5 h-5 mr-2" /> Chi tiết: {viewWorker.name}</h3>
                                <button onClick={() => setViewWorker(null)} className="p-1 hover:bg-blue-200 rounded-full"><X className="w-5 h-5 text-blue-600" /></button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                                <div><p className="text-slate-500">CCCD</p><p className="font-medium">{viewWorker.identityCardNumber || '-'}</p></div>
                                <div><p className="text-slate-500">Số Điện Thoại</p><p className="font-medium text-blue-600">{viewWorker.phone || '-'}</p></div>
                                <div><p className="text-slate-500">Ngân Hàng</p><p className="font-medium">{viewWorker.bankName || '-'}</p></div>
                                <div><p className="text-slate-500">Số Tài Khoản</p><p className="font-medium font-mono">{viewWorker.bankAccount || '-'}</p></div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="p-4 text-left font-bold text-slate-600">Nhân Sự</th>
                                        <th className="p-4 text-left font-bold text-slate-600">Thông Tin Ngân Hàng</th>
                                        <th className="p-4 text-center font-bold text-slate-600">Dự Án</th>
                                        <th className="p-4 text-right font-bold text-slate-600">Đơn Giá</th>
                                        <th className="p-4 text-center font-bold text-slate-600">Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {sortedWorkers.map((w: any) => {
                                        const p = projects.find((proj: any) => proj.id === w.currentProjectId);
                                        return (
                                            <tr key={w.id} className={`${w.role === 'Công nhật' ? 'bg-emerald-50/30' : ''} hover:bg-slate-50 transition-colors`}>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-800 flex items-center">
                                                        {w.name}
                                                        {w.role === 'Công nhật' && <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] rounded-full uppercase font-bold">Mặc định</span>}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium">{w.role}</div>
                                                </td>
                                                <td className="p-4">
                                                    {w.bankAccount ? (
                                                        <div className="text-xs">
                                                            <div className="font-mono text-slate-700 font-bold">{w.bankAccount}</div>
                                                            <div className="text-slate-500 italic">{w.bankName}</div>
                                                        </div>
                                                    ) : <span className="text-xs text-slate-400 italic">Chưa cập nhật</span>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded text-slate-600">
                                                        {p ? p.name : '--'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-slate-700">{formatCurrency(w.dailyRate)}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-center gap-1">
                                                        <button onClick={() => setViewWorker(w)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                                                        <button onClick={() => handleEdit(w)} className="p-1.5 text-orange-600 hover:bg-orange-100 rounded transition-colors" title="Chỉnh sửa"><Edit className="w-4 h-4" /></button>
                                                        <button onClick={() => onDelete(w.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
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
            </div>
        </div>
    );
};

const ManageProjects = ({ projects, onAdd, onDelete }: any) => {
    const [newProject, setNewProject] = useState<Partial<Project>>({ name: '', address: '', status: 'active', standardRate: 0, doubleRate: 0 });
     return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Quản Lý Công Trình</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-semibold mb-4 text-lg">Thêm Công Trình</h3>
                    <div className="space-y-4">
                        <input className="w-full p-2 border rounded" placeholder="Tên công trình" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
                        <input className="w-full p-2 border rounded" placeholder="Địa chỉ" value={newProject.address} onChange={e => setNewProject({...newProject, address: e.target.value})} />
                        <div className="grid grid-cols-2 gap-2">
                             <div><label className="text-xs text-slate-500 mb-1 block">Giá 1 công (VNĐ)</label><input className="w-full p-2 border rounded" type="number" placeholder="500,000" value={newProject.standardRate || ''} onChange={e => setNewProject({...newProject, standardRate: Number(e.target.value)})} /></div>
                             <div><label className="text-xs text-slate-500 mb-1 block">Giá 2 công (VNĐ)</label><input className="w-full p-2 border rounded" type="number" placeholder="1,000,000" value={newProject.doubleRate || ''} onChange={e => setNewProject({...newProject, doubleRate: Number(e.target.value)})} /></div>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700" onClick={() => { if(newProject.name) { onAdd({...newProject, id: Date.now().toString(), status: 'active'}); setNewProject({ name: '', address: '', status: 'active', standardRate: 0, doubleRate: 0 }); } }}> <Plus className="w-4 h-4 inline mr-2" /> Thêm </button>
                    </div>
                </div>
                <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50"><tr><th className="p-4 text-left">Công Trình</th><th className="p-4 text-right">Đơn Giá</th><th className="p-4 text-center">Trạng Thái</th><th className="p-4 text-right">Thao Tác</th></tr></thead>
                        <tbody className="divide-y">{projects.map((p: any) => (<tr key={p.id}><td className="p-4"><div><div className="font-bold">{p.name}</div><div className="text-xs text-slate-500">{p.address}</div></div></td><td className="p-4 text-right text-sm">1C: {formatCurrency(p.standardRate || 0)}<br/>2C: {formatCurrency(p.doubleRate || 0)}</td><td className="p-4 text-center"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{p.status === 'active' ? 'Đang chạy' : 'Hoàn thành'}</span></td><td className="p-4 text-right"><button onClick={() => onDelete(p.id)} className="text-red-500 p-2 rounded hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

const ActivityLogs = ({ logs }: any) => (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold">Nhật Ký Hệ Thống</h2>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden"><table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Thời Gian</th><th className="p-4">Người Dùng</th><th className="p-4">Hành Động</th><th className="p-4">Chi Tiết</th></tr></thead><tbody className="divide-y">{logs.map((log: any) => <tr key={log.id}><td className="p-4 text-sm text-slate-500">{formatDateTime(log.timestamp)}</td><td className="p-4 font-bold">{log.userName}</td><td className="p-4 text-blue-600 text-sm font-bold">{log.action}</td><td className="p-4 text-sm">{log.details}</td></tr>)}</tbody></table></div>
    </div>
);

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
      const newLog: ActivityLog = { id: Date.now().toString(), userId: user.id, userName: user.name, action, details, timestamp: new Date().toISOString() };
      setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (u: User) => { setUser(u); setView('dashboard'); logAction('Đăng Nhập', 'Vào hệ thống'); };
  const handleLogout = () => setUser(null);
  const handleAddRecords = (newR: TimeRecord[]) => { setRecords(prev => [...prev, ...newR]); logAction('Chấm Công', `Thêm ${newR.length} bản ghi`); };
  const handleAddTransaction = (t: Transaction) => { setTransactions(prev => [...prev, t]); logAction('Giao Dịch', `${t.type} cho worker ID ${t.workerId}`); };

  // Worker CRUD
  const handleAddWorker = (w: Worker) => { setWorkers(prev => [...prev, w]); logAction('Thêm Nhân Sự', w.name); };
  const handleDeleteWorker = (id: string) => { setWorkers(prev => prev.filter(x => x.id !== id)); logAction('Xóa Nhân Sự', `ID: ${id}`); };
  const handleUpdateWorker = (w: Worker) => { setWorkers(prev => prev.map(x => x.id === w.id ? w : x)); logAction('Cập Nhật Nhân Sự', w.name); };

  // Project CRUD
  const handleAddProject = (p: Project) => { setProjects(prev => [...prev, p]); logAction('Thêm Công Trình', p.name); };
  const handleDeleteProject = (id: string) => { setProjects(prev => prev.filter(x => x.id !== id)); logAction('Xóa Công Trình', `ID: ${id}`); };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const renderContent = () => {
    switch (view) {
      case 'dashboard': return <Dashboard workers={workers} projects={projects} records={records} />;
      case 'timesheet': return <Timesheet workers={workers} projects={projects} records={records} onAddRecord={handleAddRecords} />;
      case 'payroll': return <Payroll workers={workers} records={records} projects={projects} currentUser={user} />;
      case 'debt': return <DebtManagement workers={workers} records={records} transactions={transactions} onAddTransaction={handleAddTransaction} projects={projects} />;
      case 'workers': return <ManageWorkers workers={workers} projects={projects} onAdd={handleAddWorker} onDelete={handleDeleteWorker} onUpdate={handleUpdateWorker} />;
      case 'projects': return <ManageProjects projects={projects} onAdd={handleAddProject} onDelete={handleDeleteProject} />;
      case 'logs': return user.role === 'admin' ? <ActivityLogs logs={logs} /> : <Dashboard workers={workers} projects={projects} records={records} />;
      default: return <Dashboard workers={workers} projects={projects} records={records} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar currentView={view} setView={setView} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} currentUser={user} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white border-b lg:hidden print:hidden">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-slate-600"><Menu className="w-6 h-6" /></button>
          <h1 className="text-lg font-bold">Chấm công T&T</h1>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">{user.username.charAt(0).toUpperCase()}</div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 print:p-0"><div className="max-w-7xl mx-auto">{renderContent()}</div></main>
      </div>
    </div>
  );
}

// Debt Management Placeholder (Keeping logic consistent)
const DebtManagement = ({ workers, records, transactions, onAddTransaction, projects }: any) => {
    const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
    const [newAmount, setNewAmount] = useState('');
    const [newNote, setNewNote] = useState('');

    const debtData = useMemo(() => {
        return workers.map((w: any) => {
            const wRecords = records.filter((r: any) => r.workerId === w.id);
            const totalEarned = wRecords.reduce((sum: number, r: any) => sum + (r.shifts * r.rateUsed), 0);
            const wTx = transactions.filter((t: any) => t.workerId === w.id);
            const totalAdvanced = wTx.filter((t: any) => t.type === 'advance').reduce((sum: number, t: any) => sum + t.amount, 0);
            const totalPaid = wTx.filter((t: any) => t.type === 'payment').reduce((sum: number, t: any) => sum + t.amount, 0);
            return { worker: w, totalEarned, totalAdvanced, totalPaid, remaining: totalEarned - totalAdvanced - totalPaid };
        });
    }, [workers, records, transactions]);

    const handleAdd = (type: 'advance' | 'payment') => {
        if (!selectedWorkerId || !newAmount) return;
        onAddTransaction({ id: Date.now().toString(), workerId: selectedWorkerId, type, amount: Number(newAmount), date: new Date().toISOString().split('T')[0], note: newNote });
        setNewAmount(''); setNewNote('');
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Công Nợ & Ứng Lương</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b"><tr><th className="p-4">Công Nhật</th><th className="p-4 text-right">Tổng Lương</th><th className="p-4 text-right">Đã Ứng</th><th className="p-4 text-right">Còn Nợ</th><th className="p-4 text-center">Thao Tác</th></tr></thead>
                        <tbody className="divide-y">{debtData.map((d: any) => <tr key={d.worker.id} className={selectedWorkerId === d.worker.id ? 'bg-blue-50' : ''}><td className="p-4 font-bold">{d.worker.name}</td><td className="p-4 text-right">{formatCurrency(d.totalEarned)}</td><td className="p-4 text-right text-orange-600">{formatCurrency(d.totalAdvanced)}</td><td className="p-4 text-right font-bold text-red-600">{formatCurrency(d.remaining)}</td><td className="p-4 text-center"><button onClick={() => setSelectedWorkerId(d.worker.id)} className="text-blue-600 text-sm font-bold">Giao dịch</button></td></tr>)}</tbody>
                    </table>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
                    <h3 className="font-bold mb-4">Giao Dịch {selectedWorkerId && `- ${workers.find((x:any)=>x.id===selectedWorkerId)?.name}`}</h3>
                    {!selectedWorkerId ? <p className="text-slate-400 text-sm">Vui lòng chọn công nhân từ danh sách</p> : (
                        <div className="space-y-4">
                            <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="Số tiền..." className="w-full p-2 border rounded" />
                            <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Ghi chú..." className="w-full p-2 border rounded" />
                            <div className="flex gap-2">
                                <button onClick={() => handleAdd('advance')} className="flex-1 bg-orange-600 text-white py-2 rounded font-bold">Ứng Lương</button>
                                <button onClick={() => handleAdd('payment')} className="flex-1 bg-emerald-600 text-white py-2 rounded font-bold">Thanh Toán</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};