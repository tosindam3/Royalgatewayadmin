import React, { useState, useEffect } from 'react';
import { Search, Download, X, Filter } from 'lucide-react';

interface SummaryFiltersBarProps {
    month: string;
    onMonthChange: (month: string) => void;
    departmentId: string;
    onDepartmentChange: (id: string) => void;
    branchId: string;
    onBranchChange: (id: string) => void;
    search: string;
    onSearchChange: (search: string) => void;
    onExport: () => void;
    onClearFilters: () => void;
    departments?: Array<{ id: number; name: string }>;
    branches?: Array<{ id: number; name: string }>;
    isExporting?: boolean;
}

const SummaryFiltersBar: React.FC<SummaryFiltersBarProps> = ({
    month,
    onMonthChange,
    departmentId,
    onDepartmentChange,
    branchId,
    onBranchChange,
    search,
    onSearchChange,
    onExport,
    onClearFilters,
    departments = [],
    branches = [],
    isExporting = false,
}) => {
    const [localSearch, setLocalSearch] = useState(search);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearchChange(localSearch);
        }, 300);

        return () => clearTimeout(timer);
    }, [localSearch, onSearchChange]);

    const hasActiveFilters = departmentId || branchId || search;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                {/* Month Picker */}
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                        Month:
                    </label>
                    <input
                        type="month"
                        value={month}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                </div>

                {/* Department Filter */}
                {departments.length > 0 && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                            Department:
                        </label>
                        <select
                            value={departmentId}
                            onChange={(e) => onDepartmentChange(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Branch Filter */}
                {branches.length > 0 && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-gray-300">
                            Branch:
                        </label>
                        <select
                            value={branchId}
                            onChange={(e) => onBranchChange(e.target.value)}
                            className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        >
                            <option value="">All Branches</option>
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Search */}
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            placeholder="Search employee name or staff ID..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                        />
                    </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}

                {/* Export Button */}
                <button
                    onClick={onExport}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
                    <Filter className="w-3 h-3" />
                    <span>Active filters:</span>
                    {departmentId && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-md">
                            Department: {departments.find(d => d.id.toString() === departmentId)?.name}
                        </span>
                    )}
                    {branchId && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-md">
                            Branch: {branches.find(b => b.id.toString() === branchId)?.name}
                        </span>
                    )}
                    {search && (
                        <span className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-md">
                            Search: "{search}"
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default SummaryFiltersBar;
