import React, { memo } from 'react';
import { TransactionRow, Personnel, PaymentBatch } from '../types';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface TransactionRowItemProps {
    row: TransactionRow;
    index: number;
    paymentBatches: PaymentBatch[];
    personnelList: Personnel[];
    onUpdate: (rowId: string, field: keyof TransactionRow, value: any) => void;
    onDelete: (rowId: string) => void;
    onMove: (rowId: string, direction: 'UP' | 'DOWN') => void;
}

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

const getPaidAmount = (row: TransactionRow) => {
    if (!row.payments) return 0;
    return Object.values(row.payments).reduce((sum, val) => sum + (Number(val) || 0), 0);
};

const getRemaining = (row: TransactionRow) => {
    const total = Number(row.basicSalary) + Number(row.extraSalary);
    return total - getPaidAmount(row);
};

export const TransactionRowItem = memo(({
    row,
    index,
    paymentBatches,
    personnelList,
    onUpdate,
    onDelete,
    onMove
}: TransactionRowItemProps) => {

    const handleBasicSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(row.id, 'basicSalary', parseNumber(e.target.value));
    };

    const handleExtraSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(row.id, 'extraSalary', parseNumber(e.target.value));
    };

    const handleCopy = (amount: number) => {
        navigator.clipboard.writeText(amount.toString());
        // Simple visual feedback could be improved, but for now just log or let user know
        // We can use a temporary alert or custom toast if requested. 
        // For a quick non-intrusive feedback, maybe just relying on system clipboard?
        // Let's add a small native notification if supported or just standard alert for clarity as requested.
        alert(`Đã copy: ${formatNumber(amount)}`);
    };

    return (
        <tr className="hover:bg-blue-50 group transition-colors">
            <td className="p-2 text-center text-slate-400 font-mono text-sm">{index + 1}</td>
            <td className="p-2">
                <input
                    className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-sm font-mono"
                    value={row.accountNo}
                    onChange={(e) => onUpdate(row.id, 'accountNo', e.target.value)}
                    placeholder="VD: 090..."
                />
            </td>
            <td className="p-2">
                <input
                    className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-sm"
                    value={row.bankName}
                    onChange={(e) => onUpdate(row.id, 'bankName', e.target.value)}
                    placeholder="MB, VCB..."
                />
            </td>
            <td className="p-2">
                <input
                    className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none font-bold text-slate-900 uppercase text-sm"
                    value={row.beneficiary}
                    list="personnel-suggestions"
                    onChange={(e) => onUpdate(row.id, 'beneficiary', e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                />
                <datalist id="personnel-suggestions">
                    {personnelList.map(p => (
                        <option key={p.id} value={p.name}>{p.company}</option>
                    ))}
                </datalist>
            </td>
            <td className="p-2">
                <input
                    type="text"
                    className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-right font-mono text-sm"
                    value={formatNumber(row.basicSalary)}
                    onChange={handleBasicSalaryChange}
                    onFocus={(e) => e.target.select()}
                />
            </td>
            <td className="p-2">
                <input
                    type="text"
                    className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-right font-mono text-sm"
                    value={formatNumber(row.extraSalary)}
                    onChange={handleExtraSalaryChange}
                    onFocus={(e) => e.target.select()}
                />
            </td>
            <td
                className="p-2 text-right font-bold text-emerald-600 text-sm cursor-pointer hover:text-emerald-700 active:scale-95 transition-all select-none"
                onDoubleClick={() => handleCopy(Number(row.basicSalary) + Number(row.extraSalary))}
                title="Double click để copy"
            >
                {formatCurrency(Number(row.basicSalary) + Number(row.extraSalary))}
            </td>

            {/* Dynamic Payment Columns */}
            {paymentBatches?.map(batch => (
                <td
                    key={batch.id}
                    className="p-2 text-right font-mono text-sm text-blue-600 bg-blue-50/30 cursor-pointer hover:bg-blue-100 transition-colors select-none"
                    onDoubleClick={() => handleCopy(row.payments?.[batch.id] || 0)}
                    title="Double click để copy"
                >
                    {formatCurrency(row.payments?.[batch.id] || 0)}
                </td>
            ))}

            <td
                className="p-2 text-right font-bold text-red-500 text-sm cursor-pointer hover:text-red-700 active:scale-95 transition-all select-none"
                onDoubleClick={() => handleCopy(getRemaining(row))}
                title="Double click để copy"
            >
                {formatCurrency(getRemaining(row))}
            </td>

            <td className="p-2">
                <input
                    className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-sm"
                    value={row.note}
                    onChange={(e) => onUpdate(row.id, 'note', e.target.value)}
                    placeholder="Chi tiết..."
                />
            </td>
            <td className="p-2 text-center flex items-center justify-center gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                <button
                    onClick={() => onMove(row.id, 'UP')}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                    title="Lên"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onMove(row.id, 'DOWN')}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                    title="Xuống"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(row.id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all ml-1"
                    title="Xóa"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    // Custom comparison function for React.memo
    // Returns true if props are equal (do not re-render)
    // Returns false if props are different (re-render)

    // We strictly compare the row object and other scalar props.
    // Important: The `onUpdate` function reference MUST be stable in the parent,
    // otherwise this memoization is useless.
    return (
        prevProps.row === nextProps.row &&
        prevProps.index === nextProps.index &&
        prevProps.paymentBatches === nextProps.paymentBatches && // Assuming array ref changes only when batches change
        prevProps.personnelList === nextProps.personnelList // Assuming list ref changes only when list changes
        // functions are assumed stable if useCallback is used in parent
    );
});
