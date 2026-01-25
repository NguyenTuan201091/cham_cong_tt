import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from './services/api';
import { Workbook, Sheet, TransactionRow, Personnel, PaymentBatch } from './types';
import { TransactionRowItem } from './components/TransactionRowItem';
import { Toast } from './components/Toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
    Plus, Trash2, Download, FileSpreadsheet,
    ChevronRight, ChevronLeft, Settings, Layout, Users, ArrowUp, ArrowDown,
    CreditCard, Calendar, Save, Moon, Sun, Monitor,
    Copy, Building2, Briefcase, User, Wallet, Search, Loader2
} from 'lucide-react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatNumber = (val: number | string | undefined) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(val));
};

const parseNumber = (val: string) => {
    return Number(val.replace(/\./g, ''));
};

const generateId = () => Math.random().toString(36).substr(2, 9);


function App() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [workbook, setWorkbook] = useState<Workbook | null>(null);
    const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
    const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
    const [view, setView] = useState<'SHEETS' | 'PERSONNEL' | 'PAYMENTS'>('SHEETS');
    const [loading, setLoading] = useState(false);
    const [activeBatchId, setActiveBatchId] = useState<string | null>(null); // For Payment View
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCompany, setFilterCompany] = useState<string>('ALL');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const lastSavedData = useRef<string>('');

    const companies = useMemo(() => {
        const unique = new Set(personnelList.map(p => p.company).filter(Boolean));
        return Array.from(unique).sort();
    }, [personnelList]);


    // Initial Load
    useEffect(() => {
        loadWorkbook();
    }, [month, year]);

    const loadWorkbook = async () => {
        setLoading(true);
        const data = await api.getData();
        setPersonnelList(data.personnelList || []);

        const wb = await api.getWorkbook(month, year);
        setWorkbook(wb);
        lastSavedData.current = JSON.stringify(wb); // Initialize saving ref

        if (wb.sheets.length > 0 && !activeSheetId) {
            setActiveSheetId(wb.sheets[0].id);
        } else if (wb.sheets.length === 0) {
            setActiveSheetId(null);
        }
        setLoading(false);
    };

    // Debounced Auto-save
    useEffect(() => {
        if (!workbook) return;
        const currentData = JSON.stringify(workbook);
        if (currentData === lastSavedData.current) return;

        setIsSaving(true);
        const timer = setTimeout(async () => {
            await api.saveWorkbook(workbook);
            lastSavedData.current = currentData;
            setIsSaving(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, [workbook]);

    const updateWorkbookState = (updatedWorkbook: Workbook) => {
        setWorkbook(updatedWorkbook);
        // Persistence handled by useEffect
    };

    const copyFromPreviousMonth = async () => {
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;

        if (!confirm(`Bạn có chắc muốn sao chép toàn bộ dữ liệu từ Tháng ${prevMonth}/${prevYear} sang tháng này không?\nDữ liệu hiện tại của tháng này sẽ bị xóa.`)) {
            return;
        }

        setLoading(true);
        const prevWb = await api.getWorkbook(prevMonth, prevYear);

        if (prevWb.sheets.length === 0) {
            alert(`Không tìm thấy dữ liệu của Tháng ${prevMonth}/${prevYear}.`);
            setLoading(false);
            return;
        }

        // Clone deeply and regenerate IDs
        // Clone deeply and regenerate IDs
        const newSheets: Sheet[] = prevWb.sheets.map(sheet => ({
            id: generateId(),
            name: sheet.name,
            paymentBatches: [], // Reset payment batches for new month
            rows: sheet.rows.map(row => ({
                ...row,
                id: generateId(),
                payments: {} // Reset payments
            }))
        }));

        if (workbook) {
            const updated = { ...workbook, sheets: newSheets };
            updateWorkbookState(updated);
            if (newSheets.length > 0) setActiveSheetId(newSheets[0].id);
        }
        setLoading(false);
        alert("Sao chép thành công!");
    };


    // Sheet Operations
    const addSheet = async () => {
        const name = prompt("Nhập tên Công ty (Ví dụ: TT, MBM):");
        if (!name || !workbook) return;

        const newSheet: Sheet = {
            id: generateId(),
            name: name,
            paymentBatches: [],
            rows: []
        };

        const updated = { ...workbook, sheets: [...workbook.sheets, newSheet] };
        updateWorkbookState(updated);
        setActiveSheetId(newSheet.id);
    };

    const deleteSheet = async (id: string) => {
        if (!workbook || !confirm("Bạn có chắc chắn muốn xóa Sheet này không?")) return;
        const updated = {
            ...workbook,
            sheets: workbook.sheets.filter(s => s.id !== id)
        };
        updateWorkbookState(updated);
        if (activeSheetId === id) {
            setActiveSheetId(updated.sheets[0]?.id || null);
        }
    };

    const renameSheet = async (id: string) => {
        if (!workbook) return;
        const sheet = workbook.sheets.find(s => s.id === id);
        if (!sheet) return;

        const name = prompt("Nhập tên mới:", sheet.name);
        if (!name) return;

        const updated = {
            ...workbook,
            sheets: workbook.sheets.map(s => s.id === id ? { ...s, name } : s)
        };
        updateWorkbookState(updated);
    }

    // Row Operations - Optimized with useCallback and functional updates
    const updateRow = useCallback((sheetId: string, rowId: string, field: keyof TransactionRow, value: any) => {
        setWorkbook(prev => {
            if (!prev) return prev;

            const updatedSheets = prev.sheets.map(sheet => {
                if (sheet.id !== sheetId) return sheet;

                const updatedRows = sheet.rows.map(row => {
                    if (row.id !== rowId) return row;

                    let newRow = { ...row, [field]: value };

                    // Auto-fill logic
                    if (field === 'beneficiary') {
                        const person = personnelList.find(p => p.name.toLowerCase() === (value as string).toLowerCase());
                        if (person) {
                            newRow.accountNo = person.accountNo;
                            newRow.bankName = person.bankName;
                        }
                    }

                    return newRow;
                });
                return { ...sheet, rows: updatedRows };
            });

            return { ...prev, sheets: updatedSheets };
        });
    }, [personnelList]);

    const addRow = useCallback((sheetId: string) => {
        setWorkbook(prev => {
            if (!prev) return prev;
            const updatedSheets = prev.sheets.map(sheet => {
                if (sheet.id !== sheetId) return sheet;
                const newRow: TransactionRow = {
                    id: generateId(),
                    accountNo: '',
                    bankName: 'MB',
                    beneficiary: '',
                    basicSalary: 0,
                    extraSalary: 0,
                    note: '',
                    payments: {}
                };
                return { ...sheet, rows: [...sheet.rows, newRow] };
            });
            return { ...prev, sheets: updatedSheets };
        });
    }, []);

    const deleteRow = useCallback((sheetId: string, rowId: string) => {
        setWorkbook(prev => {
            if (!prev) return prev;
            const updatedSheets = prev.sheets.map(sheet => {
                if (sheet.id !== sheetId) return sheet;
                return { ...sheet, rows: sheet.rows.filter(r => r.id !== rowId) };
            });
            return { ...prev, sheets: updatedSheets };
        });
    }, []);

    const moveRow = useCallback((sheetId: string, rowId: string, direction: 'UP' | 'DOWN') => {
        setWorkbook(prev => {
            if (!prev) return prev;
            const updatedSheets = prev.sheets.map(sheet => {
                if (sheet.id !== sheetId) return sheet;
                const rowIndex = sheet.rows.findIndex(r => r.id === rowId);
                if (rowIndex === -1) return sheet;

                const newRows = [...sheet.rows];
                if (direction === 'UP' && rowIndex > 0) {
                    [newRows[rowIndex], newRows[rowIndex - 1]] = [newRows[rowIndex - 1], newRows[rowIndex]];
                } else if (direction === 'DOWN' && rowIndex < newRows.length - 1) {
                    [newRows[rowIndex], newRows[rowIndex + 1]] = [newRows[rowIndex + 1], newRows[rowIndex]];
                }
                return { ...sheet, rows: newRows };
            });
            return { ...prev, sheets: updatedSheets };
        });
    }, []);

    // Personnel Operations
    const addPersonnel = async () => {
        const newPerson: Personnel = {
            id: generateId(),
            name: '',
            accountNo: '',
            bankName: '',
            company: ''
        };
        const newList = [...personnelList, newPerson];
        setPersonnelList(newList);

        // Persist
        const data = await api.getData();
        data.personnelList = newList;
        await api.saveData(data);
    };

    const updatePersonnel = async (id: string, field: keyof Personnel, value: string) => {
        const newList = personnelList.map(p => p.id === id ? { ...p, [field]: value } : p);
        setPersonnelList(newList);

        const data = await api.getData();
        data.personnelList = newList;
        await api.saveData(data);
    };

    const deletePersonnel = async (id: string) => {
        if (!confirm("Xóa nhân viên này?")) return;
        const newList = personnelList.filter(p => p.id !== id);
        setPersonnelList(newList);

        const data = await api.getData();
        data.personnelList = newList;
        await api.saveData(data);
    };

    // Payment Operations
    const createPaymentBatch = async (sheetId: string) => {
        if (!workbook) return;
        const name = prompt("Nhập tên đợt chi trả (Ví dụ: Đợt 1 - 15/01):");
        if (!name) return;

        const updatedSheets = workbook.sheets.map(sheet => {
            if (sheet.id !== sheetId) return sheet;
            const newBatch: PaymentBatch = {
                id: generateId(),
                name,
                date: new Date().toISOString()
            };
            return { ...sheet, paymentBatches: [...(sheet.paymentBatches || []), newBatch] };
        });
        updateWorkbookState({ ...workbook, sheets: updatedSheets });
        setActiveSheetId(sheetId); // Ensure we stay on/switch to this sheet
    };

    const updateBatchPayment = async (sheetId: string, rowId: string, batchId: string, amount: number) => {
        if (!workbook) return;
        const updatedSheets = workbook.sheets.map(sheet => {
            if (sheet.id !== sheetId) return sheet;
            const updatedRows = sheet.rows.map(row => {
                if (row.id !== rowId) return row;
                const newPayments = { ...(row.payments || {}), [batchId]: amount };
                return { ...row, payments: newPayments };
            });
            return { ...sheet, rows: updatedRows };
        });
        updateWorkbookState({ ...workbook, sheets: updatedSheets });
    };

    // Helpers
    const getPaidAmount = (row: TransactionRow) => {
        if (!row.payments) return 0;
        return Object.values(row.payments).reduce((sum, val) => sum + (Number(val) || 0), 0);
    };

    const getRemaining = (row: TransactionRow) => {
        const total = Number(row.basicSalary) + Number(row.extraSalary);
        return total - getPaidAmount(row);
    };

    // Export Excel
    const handleExport = () => {
        if (!workbook || workbook.sheets.length === 0) {
            alert("Chưa có dữ liệu để xuất!");
            return;
        }

        const wb = XLSX.utils.book_new();

        workbook.sheets.forEach(sheet => {
            const wsData = [];

            // Header
            wsData.push(["DANH SÁCH GIAO DỊCH (LIST OF TRANSACTIONS)"]);
            wsData.push([`Đợt: Lương Tháng ${month}/${year} - ${sheet.name}`]);
            wsData.push([]);

            const headers = [
                "STT (Ord. No.)",
                "Số tài khoản MB (Account No.)",
                "Ngân hàng thụ hưởng",
                "Tên đơn vị thụ hưởng (Beneficiary)",
                "Lương cơ bản",
                "Lương ngoài",
                "Số tiền (Amount)",
                "Chi tiết thanh toán (Payment Detail)"
            ];
            wsData.push(headers);

            let totalAmount = 0;

            sheet.rows.forEach((row, idx) => {
                const total = Number(row.basicSalary) + Number(row.extraSalary);
                totalAmount += total;
                wsData.push([
                    idx + 1,
                    row.accountNo,
                    row.bankName,
                    row.beneficiary.toUpperCase(),
                    row.basicSalary,
                    row.extraSalary,
                    total,
                    row.note
                ]);
            });

            // Footer
            wsData.push(["", "", "", "TỔNG CỘNG:", "", "", totalAmount, ""]);

            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Col Widths
            ws['!cols'] = [
                { wch: 8 },  // STT
                { wch: 20 }, // Account
                { wch: 15 }, // Bank
                { wch: 30 }, // Name
                { wch: 15 }, // Basic
                { wch: 15 }, // Extra
                { wch: 15 }, // Total
                { wch: 30 }, // Note
            ];

            XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 30));
        });

        const fileName = `BangLuong_Thang${month}_${year}.xlsx`;
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(data, fileName);
    };

    const activeSheet = workbook?.sheets.find(s => s.id === activeSheetId);

    // Stable Handlers for Row Item
    const handleRowUpdate = useCallback((rowId: string, field: keyof TransactionRow, value: any) => {
        if (activeSheetId) updateRow(activeSheetId, rowId, field, value);
    }, [activeSheetId, updateRow]);

    const handleRowDelete = useCallback((rowId: string) => {
        if (activeSheetId) deleteRow(activeSheetId, rowId);
    }, [activeSheetId, deleteRow]);

    const handleRowMove = useCallback((rowId: string, direction: 'UP' | 'DOWN') => {
        if (activeSheetId) moveRow(activeSheetId, rowId, direction);
    }, [activeSheetId, moveRow]);

    return (
        <div className="min-h-screen bg-slate-100 p-4">
            <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 min-h-[80vh] flex flex-col">

                {/* Header */}
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 rounded-t-xl">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 text-white p-2 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Quản Lý Lương</h1>

                        <div className="flex bg-slate-200 rounded-lg p-1 ml-4">
                            <button
                                onClick={() => { setView('SHEETS'); setSearchTerm(''); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'SHEETS' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Bảng Lương
                            </button>
                            <button
                                onClick={() => { setView('PERSONNEL'); setSearchTerm(''); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'PERSONNEL' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Nhân Sự
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-white rounded-md border border-slate-300 overflow-hidden shadow-sm">
                            <select
                                value={month} onChange={(e) => setMonth(Number(e.target.value))}
                                className="px-3 py-2 bg-transparent outline-none border-r hover:bg-slate-50 cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                            <select
                                value={year} onChange={(e) => setYear(Number(e.target.value))}
                                className="px-3 py-2 bg-transparent outline-none hover:bg-slate-50 cursor-pointer"
                            >
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                                <option value={2026}>2026</option>
                            </select>
                        </div>

                        <button
                            onClick={copyFromPreviousMonth}
                            className="flex items-center px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 font-medium shadow-sm transition-colors"
                            title="Sao chép từ tháng trước"
                        >
                            <Copy className="w-4 h-4 mr-2" /> Sao chép tháng trước
                        </button>

                        <button
                            onClick={handleExport}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm transition-colors"
                        >
                            <Download className="w-4 h-4 mr-2" /> Xuất Excel
                        </button>
                    </div>
                </div>

                {/* Saving Indicator */}
                <div className={`
                    fixed bottom-4 right-4 z-50 transition-all duration-300 transform
                    ${isSaving ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
                `}>
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-blue-100 flex items-center text-blue-600 font-medium">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang lưu...
                    </div>
                </div>

                {/* Loading */}
                {loading && <div className="p-4 text-center text-slate-500">Đang tải dữ liệu...</div>}

                {/* Content */}
                {!loading && workbook && view === 'SHEETS' && (
                    <div className="flex flex-1 flex-col md:flex-row overflow-hidden">

                        {/* Sidebar / Tabs */}
                        <div className={`
                            bg-slate-50 border-r border-slate-200 flex flex-col transition-all duration-300
                            ${isSidebarCollapsed ? 'w-16' : 'w-full md:w-64'}
                        `}>
                            <div className="p-3 font-semibold text-xs text-slate-500 uppercase tracking-wider flex justify-between items-center h-12">
                                {!isSidebarCollapsed && <span>Danh Sách Sheets</span>}
                                <button
                                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    className="p-1 hover:bg-slate-200 rounded text-slate-500 ml-auto"
                                    title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
                                >
                                    {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {workbook.sheets.map(sheet => (
                                    <div
                                        key={sheet.id}
                                        onClick={() => setActiveSheetId(sheet.id)}
                                        className={`
                                            group flex items-center justify-between px-3 py-2 cursor-pointer border-l-4 transition-all
                                            ${activeSheetId === sheet.id
                                                ? 'bg-white border-blue-600 text-blue-700 shadow-sm'
                                                : 'border-transparent text-slate-600 hover:bg-slate-100 hover:border-slate-300'}
                                        `}
                                        title={sheet.name}
                                    >
                                        <div className="flex items-center overflow-hidden">
                                            {activeSheetId === sheet.id ? <Building2 className="w-4 h-4 mr-2 flex-shrink-0" /> : <Briefcase className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />}
                                            {!isSidebarCollapsed && <span className="truncate font-medium">{sheet.name}</span>}
                                        </div>
                                        {!isSidebarCollapsed && (
                                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); renameSheet(sheet.id); }}
                                                    className="p-1 hover:bg-blue-100 rounded text-blue-600"
                                                    title="Đổi tên"
                                                >
                                                    <Settings className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteSheet(sheet.id); }}
                                                    className="p-1 hover:bg-red-100 rounded text-red-600"
                                                    title="Xóa"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-200">
                                <button
                                    onClick={addSheet}
                                    className="w-full flex justify-center items-center py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all font-medium"
                                    title="Thêm Sheet"
                                >
                                    <Plus className="w-4 h-4" />
                                    {!isSidebarCollapsed && <span className="ml-2">Thêm Sheet</span>}
                                </button>
                            </div>
                        </div>

                        {/* Main Table Area */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-white">
                            {activeSheet ? (
                                <>
                                    <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-10 gap-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            <h2 className="text-lg font-bold text-slate-800 flex items-center whitespace-nowrap">
                                                <span className="text-slate-400 mr-2 font-normal">Sheet:</span>
                                                {activeSheet.name}
                                            </h2>

                                            {/* Search Input for Sheets */}
                                            <div className="flex gap-2 flex-1 max-w-lg">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Search className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                                        placeholder="Tìm kiếm theo tên..."
                                                    />
                                                </div>
                                                <select
                                                    value={filterCompany}
                                                    onChange={(e) => setFilterCompany(e.target.value)}
                                                    className="block w-40 px-3 py-1.5 border border-slate-300 rounded-md leading-5 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                                >
                                                    <option value="ALL">Tất cả C.Ty</option>
                                                    {companies.map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="text-sm text-slate-500 whitespace-nowrap">
                                            Tổng cộng: <span className="font-bold text-emerald-600 text-lg ml-2">
                                                {formatCurrency(activeSheet.rows.reduce((sum, r) => sum + (Number(r.basicSalary) + Number(r.extraSalary)), 0))}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-auto p-4">
                                        <div className="border rounded-lg shadow-sm">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                                                    <tr>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-12 text-center">STT</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-48">Số Tài Khoản</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-32">Ngân Hàng</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-96">Tên Thụ Hưởng</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-40 text-right">Lương CB</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-40 text-right">Lương Ngoài</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-40 text-right">Tổng Tiền</th>
                                                        {activeSheet.paymentBatches?.map(batch => (
                                                            <th key={batch.id} className="p-3 border-b text-xs font-bold text-blue-600 uppercase w-32 text-right bg-blue-50/50">
                                                                {batch.name}
                                                            </th>
                                                        ))}
                                                        <th className="p-3 border-b text-xs font-bold text-red-500 uppercase w-32 text-right">Còn Lại</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase">Ghi Chú</th>
                                                        <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-24 text-center">Tác Vụ</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {activeSheet.rows
                                                        .filter(row => {
                                                            const nameMatch = row.beneficiary.toLowerCase().includes(searchTerm.toLowerCase());
                                                            if (filterCompany === 'ALL') return nameMatch;

                                                            const person = personnelList.find(p => p.name.toUpperCase() === row.beneficiary.toUpperCase());
                                                            const companyMatch = person ? person.company === filterCompany : false;

                                                            return nameMatch && companyMatch;
                                                        })
                                                        .map((row, idx) => (
                                                            <TransactionRowItem
                                                                key={row.id}
                                                                row={row}
                                                                index={idx}
                                                                paymentBatches={activeSheet.paymentBatches || []}
                                                                personnelList={personnelList}
                                                                onUpdate={handleRowUpdate}
                                                                onDelete={handleRowDelete}
                                                                onMove={handleRowMove}
                                                            />
                                                        ))}
                                                </tbody>
                                            </table>

                                            <button
                                                onClick={() => addRow(activeSheet.id)}
                                                className="w-full py-3 flex items-center justify-center text-slate-500 hover:bg-slate-50 border-t border-dashed border-slate-200 font-medium transition-colors"
                                            >
                                                <Plus className="w-4 h-4 mr-2" /> Thêm dòng mới
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                    <FileSpreadsheet className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Chọn hoặc tạo một Sheet để bắt đầu nhập liệu.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Personnel View */}
                {!loading && view === 'PERSONNEL' && (
                    <div className="flex-1 overflow-auto p-4 bg-white rounded-b-xl">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex justify-between items-center mb-6 gap-4">
                                <h2 className="text-xl font-bold text-slate-800 whitespace-nowrap">Danh Sách Nhân Sự</h2>

                                <div className="relative flex-1 max-w-md mx-4">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                        placeholder="Tìm kiếm nhân viên..."
                                    />
                                </div>

                                <button
                                    onClick={addPersonnel}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium shadow-sm transition-colors whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Thêm Nhân Viên
                                </button>
                                <button
                                    onClick={() => document.getElementById('import-excel')?.click()}
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium shadow-sm transition-colors whitespace-nowrap"
                                >
                                    <FileSpreadsheet className="w-4 h-4 mr-2" /> Nhập từ Excel
                                </button>
                                <input
                                    type="file"
                                    id="import-excel"
                                    accept=".xlsx, .xls"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        try {
                                            const data = await file.arrayBuffer();
                                            const wb = XLSX.read(data);
                                            const ws = wb.Sheets[wb.SheetNames[0]];
                                            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });

                                            // Skip header row (index 0), start from index 1
                                            const newPersonnel: Personnel[] = [];
                                            for (let i = 1; i < jsonData.length; i++) {
                                                const row: any = jsonData[i];
                                                if (row[0]) { // Check if name exists
                                                    newPersonnel.push({
                                                        id: generateId(),
                                                        name: String(row[0]).toUpperCase(),
                                                        accountNo: row[1] ? String(row[1]) : '',
                                                        bankName: row[2] ? String(row[2]) : '',
                                                        company: row[3] ? String(row[3]) : ''
                                                    });
                                                }
                                            }

                                            if (newPersonnel.length > 0) {
                                                const newList = [...personnelList, ...newPersonnel];
                                                setPersonnelList(newList);
                                                const currentData = await api.getData();
                                                currentData.personnelList = newList;
                                                await api.saveData(currentData);
                                                alert(`Đã nhập thành công ${newPersonnel.length} nhân viên!`);
                                            } else {
                                                alert("Không tìm thấy dữ liệu hợp lệ trong file Excel.");
                                            }

                                        } catch (error) {
                                            console.error("Error importing file:", error);
                                            alert("Có lỗi khi đọc file Excel.");
                                        }
                                        // Reset input
                                        e.target.value = '';
                                    }}
                                />
                            </div>

                            <div className="border rounded-lg shadow-sm overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-12 text-center">STT</th>
                                            <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase">Họ và Tên</th>
                                            <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-48">Số Tài Khoản</th>
                                            <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-32">Ngân Hàng</th>
                                            <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-64">Công Ty</th>
                                            <th className="p-3 border-b text-xs font-bold text-slate-500 uppercase w-16"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {personnelList.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-slate-400">
                                                    Chưa có nhân viên nào. Hãy thêm mới!
                                                </td>
                                            </tr>
                                        )}
                                        {personnelList.map((person, idx) => (
                                            <tr key={person.id} className="hover:bg-slate-50 group">
                                                <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                                <td className="p-3">
                                                    <input
                                                        value={person.name}
                                                        onChange={(e) => updatePersonnel(person.id, 'name', e.target.value.toUpperCase())}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none font-medium uppercase"
                                                        placeholder="Nhập tên..."
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        value={person.accountNo}
                                                        onChange={(e) => updatePersonnel(person.id, 'accountNo', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none font-mono"
                                                        placeholder="Số tài khoản..."
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        value={person.bankName}
                                                        onChange={(e) => updatePersonnel(person.id, 'bankName', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none"
                                                        placeholder="Tên ngân hàng..."
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        value={person.company}
                                                        onChange={(e) => updatePersonnel(person.id, 'company', e.target.value)}
                                                        className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 rounded px-2 py-1 outline-none"
                                                        placeholder="Công ty/Đội..."
                                                    />
                                                </td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => deletePersonnel(person.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}


                {/* Payments View */}
                {!loading && workbook && view === 'PAYMENTS' && (
                    <div className="flex flex-1 flex-col overflow-hidden bg-white rounded-b-xl">
                        {/* Toolbar */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-slate-800">Quản Lý Chi Trả</h2>
                                <select
                                    value={activeSheetId || ''}
                                    onChange={(e) => { setActiveSheetId(e.target.value); setActiveBatchId(null); }}
                                    className="p-2 rounded border border-slate-300 font-medium"
                                >
                                    <option value="" disabled>Chọn Sheet...</option>
                                    {workbook.sheets.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            {activeSheetId && (
                                <button
                                    onClick={() => createPaymentBatch(activeSheetId)}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 font-medium shadow-sm transition-colors flex items-center"
                                >
                                    <CreditCard className="w-4 h-4 mr-2" /> Tạo Đợt Chi Trả Mới
                                </button>
                            )}
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left: Batches List */}
                            {activeSheet && (
                                <div className="w-64 border-r border-slate-200 bg-slate-50 p-4 overflow-y-auto">
                                    <div className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">Các Đợt Chi Trả</div>
                                    <div className="space-y-2">
                                        {activeSheet.paymentBatches?.length === 0 && <p className="text-slate-400 text-sm">Chưa có đợt chi trả nào.</p>}
                                        {activeSheet.paymentBatches?.map(batch => (
                                            <div
                                                key={batch.id}
                                                onClick={() => setActiveBatchId(batch.id)}
                                                className={`p-3 rounded-lg cursor-pointer border transition-all ${activeBatchId === batch.id ? 'bg-white border-blue-500 shadow-sm text-blue-700' : 'bg-white border-slate-200 hover:border-slate-400'}`}
                                            >
                                                <div className="font-medium">{batch.name}</div>
                                                <div className="text-xs text-slate-400 mt-1">{new Date(batch.date).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Right: Payment Table */}
                            <div className="flex-1 overflow-auto p-4 bg-white">
                                {activeSheet && activeBatchId ? (
                                    (() => {
                                        const currentBatch = activeSheet.paymentBatches.find(b => b.id === activeBatchId);
                                        return (
                                            <div className="max-w-5xl mx-auto">
                                                <h3 className="text-lg font-bold text-slate-700 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                    Nhập số tiền chi trả cho: <span className="text-blue-600">{currentBatch?.name}</span>
                                                </h3>

                                                <table className="w-full text-left border-collapse border rounded-lg shadow-sm">
                                                    <thead className="bg-slate-100">
                                                        <tr>
                                                            <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase w-12 text-center">STT</th>
                                                            <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Họ Tên</th>
                                                            <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase text-right w-40">Tổng Lương</th>
                                                            <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase text-right w-40">Đã Trả Trước</th>
                                                            <th className="p-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase text-right w-40">Còn Lại</th>
                                                            <th className="p-3 border-b border-slate-200 text-xs font-bold text-emerald-600 uppercase text-right w-40 bg-emerald-50">Chi Trả Đợt Này</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {activeSheet.rows.map((row, idx) => {
                                                            const total = Number(row.basicSalary) + Number(row.extraSalary);
                                                            const paidInThisBatch = row.payments?.[activeBatchId] || 0;
                                                            const paidTotal = getPaidAmount(row);
                                                            const paidBefore = paidTotal - paidInThisBatch; // Paid in OTHER batches
                                                            const remaining = total - paidTotal; // Real remaining including current input? No, remaining BEFORE this payment.
                                                            // Actually, logic: "Remaining" usually means "Remaining to be paid". 
                                                            // If I type 5M in this batch, Remaining should decrease.

                                                            return (
                                                                <tr key={row.id} className="hover:bg-slate-50">
                                                                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                                                                    <td className="p-3 font-medium text-slate-700">{row.beneficiary}</td>
                                                                    <td className="p-3 text-right font-mono text-slate-600">{formatCurrency(total)}</td>
                                                                    <td className="p-3 text-right font-mono text-slate-500">{formatCurrency(paidBefore)}</td>
                                                                    <td className="p-3 text-right font-mono text-red-500 font-bold">{formatCurrency(total - paidTotal)}</td>
                                                                    <td className="p-3 bg-emerald-50/30">
                                                                        <input
                                                                            type="number"
                                                                            className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded px-2 py-1 outline-none text-right font-mono font-bold text-emerald-700"
                                                                            value={paidInThisBatch || ''}
                                                                            onChange={(e) => updateBatchPayment(activeSheet.id, row.id, activeBatchId, Number(e.target.value))}
                                                                            placeholder="0"
                                                                            onFocus={(e) => e.target.select()}
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <CreditCard className="w-16 h-16 mb-4 opacity-20" />
                                        <p>Chọn Sheet và một Đợt Chi Trả để nhập liệu</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}

export default App;
