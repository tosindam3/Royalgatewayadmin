import React from 'react';
import { TableSkeleton } from './Skeleton';
import Button from './Button';

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    align?: 'left' | 'center' | 'right';
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    emptyMessage?: string;
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
}

export function DataTable<T>({
    data,
    columns,
    isLoading,
    emptyMessage = "No intelligence records found.",
    pagination
}: DataTableProps<T>) {
    if (isLoading) {
        return <TableSkeleton rows={8} cols={columns.length} />;
    }

    return (
        <div className="w-full bg-white/5 border border-white/5 rounded-[32px] overflow-hidden backdrop-blur-3xl animate-in fade-in duration-500">
            <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ${col.className || ''}`}
                                    style={{ textAlign: col.align || 'left' }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                        <span className="text-4xl text-slate-400 font-black">∅</span>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{emptyMessage}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((item, rowIdx) => (
                                <tr key={rowIdx} className="group hover:bg-white/[0.03] transition-all">
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={`px-8 py-5 text-sm ${col.className || ''}`}
                                            style={{ textAlign: col.align || 'left' }}
                                        >
                                            {col.render ? col.render(item) : (item[col.key as keyof T] as React.ReactNode)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="p-6 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Phase {pagination.currentPage} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={pagination.currentPage === 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={pagination.currentPage === pagination.totalPages}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DataTable;
