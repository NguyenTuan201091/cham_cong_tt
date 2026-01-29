import React, { memo } from 'react';
import { TransactionRow, Personnel, PaymentBatch } from '../types';
import { Trash2, ListOrdered } from 'lucide-react';

interface TransactionRowItemProps {
    row: TransactionRow;
    index: number;
    paymentBatches: PaymentBatch[];
    onUpdate: (rowId: string, field: keyof TransactionRow, value: any) => void;
    onDelete: (rowId: string) => void;
    onMove: (rowId: string, direction: 'UP' | 'DOWN') => void;
    onMoveToPosition: (rowId: string, position: number) => void;
    onNotify: (message: string) => void;
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



export const TransactionRowItem = memo(({
    row,
    index,
    paymentBatches,
    onUpdate,
    onDelete,
    onMove,
    onMoveToPosition,
    onNotify }: TransactionRowItemProps) => {

    const handleBasicSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(row.id, 'basicSalary', parseNumber(e.target.value));
    };

    const handleExtraSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(row.id, 'extraSalary', parseNumber(e.target.value));
    };

    const handleJumpToPosition = () => {
        const target = prompt("Nhập số thứ tự muốn chuyển đến (VD: 5):", (index + 1).toString());
        if (target) {
            const pos = parseInt(target, 10);
            if (!isNaN(pos)) {
                onMoveToPosition(row.id, pos);
            }
        }
    };

    const handleCopy = (amount: number) => {
        navigator.clipboard.writeText(amount.toString());
        onNotify(`Đã copy: ${formatNumber(amount)}`);
    };

    return (
        <tr className="hover:bg-blue-50 group transition-colors">
            <td className="p-1 md:p-2 text-center text-slate-400 font-mono text-xs md:text-sm sticky left-0 bg-white group-hover:bg-blue-50 z-10 transition-colors">{index + 1}</td>
            <td className="p-1 md:p-2">
                <input
                    className="w-full min-w-[100px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-xs md:text-sm font-mono"
                    value={row.accountNo}
                    onChange={(e) => onUpdate(row.id, 'accountNo', e.target.value)}
                    placeholder="VD: 090..."
                />
            </td>
            <td className="p-1 md:p-2">
                <input
                    className="w-full min-w-[60px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-xs md:text-sm"
                    value={row.bankName}
                    onChange={(e) => onUpdate(row.id, 'bankName', e.target.value)}
                    placeholder="MB..."
                />
            </td>
            <td className="p-1 md:p-2 sticky left-[40px] md:left-[48px] bg-white group-hover:bg-blue-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors">
                <input
                    className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none font-bold text-slate-900 uppercase text-xs md:text-sm"
                    value={row.beneficiary}
                    list="personnel-suggestions"
                    onChange={(e) => onUpdate(row.id, 'beneficiary', e.target.value.toUpperCase())}
                    placeholder="NGUYEN VAN A"
                />
            </td>
            <td className="p-1 md:p-2">
                <input
                    type="text"
                    className="w-full min-w-[90px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-right font-mono text-xs md:text-sm"
                    value={formatNumber(row.basicSalary)}
                    onChange={handleBasicSalaryChange}
                    onDoubleClick={() => handleCopy(Number(row.basicSalary) || 0)}
                    onFocus={(e) => e.target.select()}
                    title="Double click để copy"
                />
            </td>
            <td className="p-1 md:p-2">
                <input
                    type="text"
                    className="w-full min-w-[90px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-right font-mono text-xs md:text-sm"
                    value={formatNumber(row.extraSalary)}
                    onChange={handleExtraSalaryChange}
                    onDoubleClick={() => handleCopy(Number(row.extraSalary) || 0)}
                    onFocus={(e) => e.target.select()}
                    title="Double click để copy"
                />
            </td>
            <td
                className="p-1 md:p-2 text-right font-bold text-emerald-600 text-xs md:text-sm cursor-pointer hover:text-emerald-700 active:scale-95 transition-all select-none min-w-[90px]"
                onDoubleClick={() => handleCopy((Number(row.basicSalary) || 0) + (Number(row.extraSalary) || 0))}
                title="Double click để copy"
            >
                {formatCurrency((Number(row.basicSalary) || 0) + (Number(row.extraSalary) || 0))}
            </td>

            {/* Dynamic Payment Columns */}
            {paymentBatches?.map(batch => (
                <td
                    key={batch.id}
                    className="p-1 md:p-2 text-right font-mono text-xs md:text-sm text-blue-600 bg-blue-50/30 cursor-pointer hover:bg-blue-100 transition-colors select-none min-w-[90px]"
                    onDoubleClick={() => handleCopy(row.payments?.[batch.id] || 0)}
                    title="Double click để copy"
                >
                    {formatCurrency(row.payments?.[batch.id] || 0)}
                </td>
            ))}



            <td className="p-1 md:p-2">
                <input
                    className="w-full min-w-[150px] bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white rounded px-2 py-1 outline-none text-xs md:text-sm"
                    value={row.note}
                    onChange={(e) => onUpdate(row.id, 'note', e.target.value)}
                    placeholder="Chi tiết..."
                />
            </td>
            <td className="p-1 md:p-2 text-center flex items-center justify-center gap-1 group-hover:opacity-100 opacity-100 md:opacity-0 transition-opacity">
                <button
                    onClick={handleJumpToPosition}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                    title="Chuyển nhanh đến STT..."
                >
                    <ListOrdered className="w-4 h-4" />
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
        prevProps.paymentBatches === nextProps.paymentBatches // Assuming array ref changes only when batches change
        // functions are assumed stable if useCallback is used in parent
    );
});
