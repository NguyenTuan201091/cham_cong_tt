import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Worker, Project, TimeRecord, ViewMode, WeeklyPayrollItem, Transaction, User, ActivityLog } from './types';
import { MOCK_WORKERS, MOCK_PROJECTS, MOCK_RECORDS, MOCK_TRANSACTIONS, MOCK_USERS, MOCK_LOGS } from './constants';
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
  ChevronLeft,
  ChevronRight,
  Wallet,
  IdCard,
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
  ShieldCheck
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Utility Functions ---

const getThursdayOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  let diff = 4 - day;
  if (diff < 0) diff += 7;
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
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-slate-200 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4"><Lock className="w-8 h-8 text-blue-600" /></div>
                <h1 className="text-2xl font-bold text-slate-800">Đăng Nhập T&T</h1>
                <p className="text-slate-500 mt-2 mb-8">Hệ thống quản lý công nhật</p>
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Người dùng</label>
                        <select value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            <option value="">-- Chọn người dùng --</option>
                            {MOCK_USERS.map(u => <option key={u.id} value={u.username}>{u.name}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm">Bắt đầu làm việc</button>
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

  // Restrict Admin-only menus
  if (currentUser.role === 'admin') {
    menuItems.push({ id: 'backup', label: 'Sao Lưu Dữ Liệu', icon: Database });
    menuItems.push({ id: 'logs', label: 'Nhật Ký', icon: History });
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-20 bg-black/50 lg:hidden print:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} print:hidden flex flex-col`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-800 shrink-0 font-bold text-xl">T&T Management</div>
        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
            <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">{currentUser.username.charAt(0).toUpperCase()}</div>
                <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center">
                        {currentUser.role === 'admin' && <ShieldCheck className="w-3 h-3 mr-1 text-blue-400" />}
                        {currentUser.role}
                    </p>
                </div>
            </div>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setView(item.id); setMobileOpen(false); }} className={`flex items-center w-full px-4 py-3 rounded-lg transition-all ${currentView === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={onLogout} className="flex items-center w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors font-medium"><LogOut className="w-5 h-5 mr-3" /> Đăng Xuất</button></div>
      </div>
    </>
  );
};

const ManageWorkers = ({ workers, projects, onAdd, onDelete, onUpdate }: any) => {
    const initialForm = { id: '', name: '', role: 'Công nhật', dailyRate: 350000, currentProjectId: '', identityCardNumber: '', phone: '', bankAccount: '', bankName: '' };
    const [f, setF] = useState(initialForm);
    const [isEdit, setIsEdit] = useState(false);
    const [viewWorker, setViewWorker] = useState<any>(null);

    // Sorting: 'Công nhật' first
    const sortedWorkers = useMemo(() => {
        return [...workers].sort((a, b) => {
            if (a.role === 'Công nhật' && b.role !== 'Công nhật') return -1;
            if (a.role !== 'Công nhật' && b.role === 'Công nhật') return 1;
            return a.name.localeCompare(b.name);
        });
    }, [workers]);

    const handleSave = () => {
        if (!f.name) { alert("Vui lòng nhập tên!"); return; }
        if (isEdit) {
            onUpdate(f);
            alert("Cập nhật thành công!");
        } else {
            onAdd({ ...f, id: Date.now().toString() });
            alert("Thêm thành công!");
        }
        setF(initialForm);
        setIsEdit(false);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Quản Lý Nhân Sự</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-xl border shadow-sm h-fit space-y-4 sticky top-6">
                    <h3 className="font-bold text-lg border-b pb-2 flex items-center">
                        {isEdit ? <Edit className="w-5 h-5 mr-2 text-orange-600" /> : <Plus className="w-5 h-5 mr-2 text-blue-600" />}
                        {isEdit ? 'Sửa Công Nhật' : 'Thêm Nhân Sự'}
                    </h3>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Họ Tên</label><input className="w-full p-2 border rounded mt-1" placeholder="Tên..." value={f.name} onChange={e => setF({...f, name: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Vai Trò (Công việc)</label>
                        <select className="w-full p-2 border rounded mt-1" value={f.role} onChange={e => setF({...f, role: e.target.value})}>
                            <option value="Công nhật">Công nhật</option>
                            <option value="Thợ Chính">Thợ Chính</option>
                            <option value="Phụ Hồ">Phụ Hồ</option>
                            <option value="Cai thợ">Cai thợ</option>
                        </select>
                    </div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Đơn giá / Công</label><input className="w-full p-2 border rounded mt-1" type="number" step="10000" value={f.dailyRate} onChange={e => setF({...f, dailyRate: Number(e.target.value)})} /></div>
                    <div className="pt-2 border-t">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center mb-2"><CreditCard className="w-3 h-3 mr-1" /> NGÂN HÀNG</h4>
                        <input className="w-full p-2 border rounded text-sm mb-2" placeholder="Số tài khoản..." value={f.bankAccount} onChange={e => setF({...f, bankAccount: e.target.value})} />
                        <input className="w-full p-2 border rounded text-sm" placeholder="Tên ngân hàng..." value={f.bankName} onChange={e => setF({...f, bankName: e.target.value})} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={handleSave} className={`flex-1 py-2 text-white rounded font-bold shadow-sm transition-colors ${isEdit ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {isEdit ? 'Cập Nhật' : 'Lưu Lại'}
                        </button>
                        {isEdit && <button onClick={() => { setIsEdit(false); setF(initialForm); }} className="px-4 bg-slate-200 text-slate-600 rounded font-bold hover:bg-slate-300 transition-colors">Hủy</button>}
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-3 space-y-4">
                    {viewWorker && (
                        <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-200 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-blue-800 flex items-center"><IdCard className="w-5 h-5 mr-2" /> Hồ Sơ: {viewWorker.name}</h3><button onClick={() => setViewWorker(null)} className="p-1 hover:bg-blue-200 rounded-full"><X className="w-5 h-5 text-blue-600" /></button></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><p className="text-slate-500">Công việc</p><p className="font-bold">{viewWorker.role}</p></div>
                                <div><p className="text-slate-500">SĐT</p><p className="font-bold text-blue-600">{viewWorker.phone || '-'}</p></div>
                                <div><p className="text-slate-500">Số tài khoản</p><p className="font-mono font-bold">{viewWorker.bankAccount || '-'}</p></div>
                                <div><p className="text-slate-500">Ngân hàng</p><p className="font-bold italic">{viewWorker.bankName || '-'}</p></div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Nhân sự</th>
                                    <th className="p-4 text-left text-xs font-bold text-slate-500 uppercase">Tài khoản</th>
                                    <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">Đơn giá</th>
                                    <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {sortedWorkers.map((w: any) => (
                                    <tr key={w.id} className={`${w.role === 'Công nhật' ? 'bg-emerald-50/20' : ''} hover:bg-slate-50 transition-colors`}>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 flex items-center">
                                                {w.name}
                                                {w.role === 'Công nhật' && <span className="ml-2 text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-black uppercase">TOP</span>}
                                            </div>
                                            <div className="text-xs text-slate-500">{w.role}</div>
                                        </td>
                                        <td className="p-4">
                                            {w.bankAccount ? (
                                                <div className="text-xs font-medium">
                                                    <p className="font-mono">{w.bankAccount}</p>
                                                    <p className="text-slate-400 italic">{w.bankName}</p>
                                                </div>
                                            ) : <span className="text-xs text-slate-300 italic">Chưa có STK</span>}
                                        </td>
                                        <td className="p-4 text-right font-bold text-slate-700">{formatCurrency(w.dailyRate)}</td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-1">
                                                <button onClick={() => setViewWorker(w)} className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Xem chi tiết"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setF(w); setIsEdit(true); setViewWorker(null); window.scrollTo({top:0, behavior:'smooth'}); }} className="p-2 text-orange-600 hover:bg-orange-100 rounded transition-colors" title="Sửa"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => onDelete(w.id)} className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ workers, projects, records }: any) => {
  const activeProjects = projects.filter((p: any) => p.status === 'active').length;
  const chartData = useMemo(() => {
     const data: any[] = [];
     for(let i=6; i>=0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayShifts = records.filter((r: any) => r.date === dateStr).reduce((acc: number, curr: any) => acc + curr.shifts, 0);
        data.push({ name: `${d.getDate()}/${d.getMonth()+1}`, shifts: dayShifts });
     }
     return data;
  }, [records]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Bảng Tin Hệ Thống</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><p className="text-sm font-medium text-slate-500">Tổng Công Nhật</p><p className="text-3xl font-bold text-slate-800 mt-1">{workers.length}</p></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><p className="text-sm font-medium text-slate-500">Công Trình Đang Chạy</p><p className="text-3xl font-bold text-blue-600 mt-1">{activeProjects}</p></div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200"><p className="text-sm font-medium text-slate-500">Bản Ghi Chấm Công</p><p className="text-3xl font-bold text-emerald-600 mt-1">{records.length}</p></div>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-6">Sản Lượng Công Việc (7 Ngày Qua)</h3>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="shifts" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
    </div>
  );
};

const Timesheet = ({ workers, projects, records, onAddRecord }: any) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState(projects[0]?.id || '');
    const [inputs, setInputs] = useState<Record<string, any>>({});
    
    useEffect(() => {
        const initial: any = {};
        workers.forEach((w: any) => { initial[w.id] = { shifts: 1, customRate: w.dailyRate, selected: false }; });
        setInputs(initial);
    }, [workers]);

    const handleSave = () => {
        const newR = workers.filter((w: any) => inputs[w.id]?.selected).map((w: any) => ({
            id: Date.now() + '-' + w.id, workerId: w.id, projectId, date, 
            shifts: inputs[w.id].shifts, rateUsed: inputs[w.id].customRate
        }));
        if (newR.length) { onAddRecord(newR); alert("Lưu thành công!"); }
        else { alert("Vui lòng chọn ít nhất một nhân sự!"); }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Chấm Công Daily</h2><div className="flex gap-2"><input type="date" value={date} onChange={e => setDate(e.target.value)} className="p-2 border rounded" /><select value={projectId} onChange={e => setProjectId(e.target.value)} className="p-2 border rounded">{projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4 w-12"><input type="checkbox" /></th><th className="p-4">Nhân Sự</th><th className="p-4">Số Công</th><th className="p-4">Đơn Giá</th><th className="p-4 text-right">Tổng Tiền</th></tr></thead>
                    <tbody className="divide-y">{workers.map((w: any) => <tr key={w.id}><td className="p-4"><input type="checkbox" checked={inputs[w.id]?.selected} onChange={e => setInputs({...inputs, [w.id]: {...inputs[w.id], selected: e.target.checked}})} /></td><td className="p-4 font-medium">{w.name}</td><td className="p-4"><input type="number" step="0.5" value={inputs[w.id]?.shifts} onChange={e => setInputs({...inputs, [w.id]: {...inputs[w.id], shifts: Number(e.target.value)}})} className="w-16 border rounded p-1" /></td><td className="p-4 text-sm text-slate-500">{formatCurrency(inputs[w.id]?.customRate || 0)}</td><td className="p-4 text-right font-bold text-blue-600">{formatCurrency((inputs[w.id]?.shifts || 0) * (inputs[w.id]?.customRate || 0))}</td></tr>)}</tbody>
                </table>
                <div className="p-4 border-t bg-slate-50 flex justify-end"><button onClick={handleSave} className="bg-blue-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-700 shadow transition-colors">Lưu Chấm Công</button></div>
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
            const wRecords = filteredRecords.filter((r: any) => r.workerId === w.id);
            const totalShifts = wRecords.reduce((sum: number, r: any) => sum + r.shifts, 0);
            const totalAmount = wRecords.reduce((sum: number, r: any) => sum + (r.shifts * r.rateUsed), 0);
            const pNames = Array.from(new Set(wRecords.map((r: any) => projects.find((p: any) => p.id === r.projectId)?.name || 'Unknown')));
            return { worker: w, totalShifts, totalAmount, details: wRecords, projectNames: pNames };
        }).filter((i: any) => i.totalShifts > 0);
    }, [weekStart, weekEnd, records, workers, projects]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden"><h2 className="text-2xl font-bold">Bảng Lương Theo Tuần</h2><button onClick={() => window.print()} className="bg-slate-800 text-white px-4 py-2 rounded flex items-center font-bold shadow-sm hover:bg-slate-700 transition-colors"><FileDown className="w-4 h-4 mr-2" /> PDF / Báo Cáo</button></div>
            <div className="hidden print:block text-center border-b pb-6 mb-8">
                <h1 className="text-2xl font-bold uppercase">Báo Cáo Lương Công Nhật T&T</h1>
                <p className="mt-2 font-medium">Kỳ: {formatDate(weekStart)} đến {formatDate(weekEnd)}</p>
                <div className="flex justify-between mt-4 text-xs italic"><span>Người lập: {currentUser.name}</span><span>Ngày xuất: {formatDateTime(new Date().toISOString())}</span></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Nhân sự</th><th className="p-4 text-center">Tổng công</th><th className="p-4 text-right">Thành tiền</th></tr></thead>
                    <tbody className="divide-y">{weeklyData.map((item: any) => <tr key={item.worker.id}><td className="p-4"><div><p className="font-bold text-slate-800">{item.worker.name}</p><p className="text-xs text-slate-500">{item.worker.role} - {item.projectNames.join(', ')}</p></div></td><td className="p-4 text-center font-bold text-blue-600 bg-blue-50/30">{item.totalShifts}</td><td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(item.totalAmount)}</td></tr>)}</tbody>
                    <tfoot className="bg-slate-50 font-bold border-t"><tr><td className="p-4 text-right">TỔNG CỘNG:</td><td colSpan={2} className="p-4 text-right text-emerald-700 text-lg">{formatCurrency(weeklyData.reduce((s,i)=>s+i.totalAmount, 0))}</td></tr></tfoot>
                </table>
            </div>
        </div>
    );
};

const BackupManager = ({ workers, projects, records, onImportData }: any) => {
    const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
    const [isLoading, setIsLoading] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, table: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = text.split('\n').filter(r => r.trim());
            const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const data = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const obj: any = {};
                headers.forEach((h, i) => {
                    const val = values[i];
                    if (!isNaN(val as any) && val !== '') obj[h] = Number(val);
                    else if (val === 'true') obj[h] = true;
                    else if (val === 'false') obj[h] = false;
                    else obj[h] = val;
                });
                return obj;
            });
            onImportData(table, data, importMode);
            setIsLoading(false);
            if(e.target) e.target.value = '';
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center"><Database className="mr-2" /> Dữ Liệu & Sao Lưu (Admin Only)</h2>
            <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                <h3 className="text-lg font-bold text-amber-800 flex items-center"><RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Nhập Dữ Liệu</h3>
                <p className="text-sm text-amber-700 mt-1">Lưu ý: Import file Chấm công sẽ cập nhật ngay lập tức vào Bảng lương.</p>
                <div className="flex gap-4 mt-6">
                    <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${importMode === 'append' ? 'bg-blue-50 border-blue-600 text-blue-700 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        <input type="radio" className="hidden" checked={importMode === 'append'} onChange={() => setImportMode('append')} />
                        <CheckCircle2 className={`w-4 h-4 mr-2 ${importMode === 'append' ? 'block' : 'hidden'}`} /> Cộng dồn
                    </label>
                    <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${importMode === 'replace' ? 'bg-red-50 border-red-600 text-red-700 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        <input type="radio" className="hidden" checked={importMode === 'replace'} onChange={() => setImportMode('replace')} />
                        <AlertCircle className={`w-4 h-4 mr-2 ${importMode === 'replace' ? 'block' : 'hidden'}`} /> Ghi đè (Xóa sạch cũ)
                    </label>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3"><div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CalendarClock className="w-6 h-6" /></div><div><h4 className="font-bold">Chấm Công</h4><p className="text-xs text-slate-500">{records.length} bản ghi</p></div></div>
                        <button onClick={() => exportToCSV(records, 'ChamCong')} className="text-blue-600 p-2 hover:bg-blue-50 rounded"><Download className="w-5 h-5" /></button>
                    </div>
                    <label className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" /> Nhập Chấm Công (.csv)
                        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileSelect(e, 'records')} />
                    </label>
                </div>
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Users className="w-6 h-6" /></div><div><h4 className="font-bold">Nhân Sự</h4><p className="text-xs text-slate-500">{workers.length} người</p></div></div>
                        <button onClick={() => exportToCSV(workers, 'CongNhat')} className="text-blue-600 p-2 hover:bg-blue-50 rounded"><Download className="w-5 h-5" /></button>
                    </div>
                    <label className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-bold cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" /> Nhập Nhân Sự (.csv)
                        <input type="file" accept=".csv" className="hidden" onChange={(e) => handleFileSelect(e, 'workers')} />
                    </label>
                </div>
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
  const [logs, setLogs] = useState<ActivityLog[]>(MOCK_LOGS);

  const logAction = (action: string, details: string) => {
      if (!user) return;
      setLogs(prev => [{ id: Date.now().toString(), userId: user.id, userName: user.name, action, details, timestamp: new Date().toISOString() }, ...prev]);
  };

  const handleImportData = (table: string, data: any[], mode: 'append' | 'replace') => {
      const updateFn = (prev: any[]) => mode === 'replace' ? data : [...prev, ...data];
      if (table === 'workers') setWorkers(updateFn);
      else if (table === 'projects') setProjects(updateFn);
      else if (table === 'records') setRecords(updateFn);
      logAction('Nhập Dữ Liệu', `Đã nhập ${data.length} bản ghi vào ${table} (${mode === 'replace' ? 'Ghi đè' : 'Cộng dồn'})`);
  };

  // Redirect non-admins if they try to access restricted views (e.g. via state manipulation or leftovers)
  useEffect(() => {
    if (user && user.role !== 'admin' && (view === 'backup' || view === 'logs')) {
        setView('dashboard');
    }
  }, [view, user]);

  if (!user) return <LoginScreen onLogin={u => setUser(u)} />;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar currentView={view} setView={setView} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} currentUser={user} onLogout={() => setUser(null)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 bg-white border-b lg:hidden print:hidden"><button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-slate-600"><Menu className="w-6 h-6" /></button><h1 className="text-lg font-bold">T&T Management</h1><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">{user.username.charAt(0).toUpperCase()}</div></header>
        <main className="flex-1 overflow-auto p-4 md:p-8 print:p-0"><div className="max-w-7xl mx-auto">
          {view === 'dashboard' && <Dashboard workers={workers} projects={projects} records={records} />}
          {view === 'timesheet' && <Timesheet workers={workers} projects={projects} records={records} onAddRecord={(r: any) => { setRecords(p => [...p, ...r]); logAction('Chấm công', `Thêm ${r.length} bản ghi`); }} />}
          {view === 'payroll' && <Payroll workers={workers} records={records} projects={projects} currentUser={user} />}
          {view === 'workers' && <ManageWorkers workers={workers} projects={projects} onAdd={(w:any) => { setWorkers(p => [...p, w]); logAction('Thêm nhân sự', w.name); }} onDelete={(id:any) => setWorkers(p => p.filter(x => x.id !== id))} onUpdate={(w:any) => setWorkers(p => p.map(x => x.id === w.id ? w : x))} />}
          {view === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 h-fit"><h3 className="font-bold text-lg">Thêm Công Trình</h3><input className="w-full p-2 border rounded" placeholder="Tên..." /><button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Lưu Dự Án</button></div>
                <div className="md:col-span-2 bg-white rounded-xl border shadow-sm overflow-hidden"><table className="w-full"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Dự án</th><th className="p-4">Trạng thái</th></tr></thead><tbody className="divide-y">{projects.map((p: any) => <tr key={p.id}><td className="p-4 font-bold">{p.name}</td><td className="p-4"><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase font-bold">{p.status}</span></td></tr>)}</tbody></table></div>
            </div>
          )}
          {view === 'backup' && user.role === 'admin' && <BackupManager workers={workers} projects={projects} records={records} onImportData={handleImportData} />}
          {view === 'logs' && user.role === 'admin' && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Nhật Ký Hệ Thống</h2>
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <table className="w-full text-left"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Thời gian</th><th className="p-4">Hành động</th><th className="p-4">Chi tiết</th></tr></thead><tbody className="divide-y">{logs.map(l => <tr key={l.id}><td className="p-4 text-xs text-slate-500">{formatDateTime(l.timestamp)}</td><td className="p-4 font-bold text-blue-600">{l.action}</td><td className="p-4 text-sm">{l.details}</td></tr>)}</tbody></table>
                </div>
            </div>
          )}
          {view === 'debt' && (
            <div className="p-12 text-center text-slate-400">
                <Wallet className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Tính năng Công Nợ đang được phát triển...</p>
            </div>
          )}
        </div></main>
      </div>
    </div>
  );
}
