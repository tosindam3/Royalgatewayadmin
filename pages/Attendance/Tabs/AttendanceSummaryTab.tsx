import React, { useState } from 'react';
import { Users, UserCheck, UserX, Clock, TrendingUp, Briefcase, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAttendanceSummaryKpis, useAttendanceSummaryTable } from '../../../hooks/useAttendanceData';
import GlassCard from '../../../components/GlassCard';
import SummaryKpiCard from '../../../components/attendance/SummaryKpiCard';
import SummaryFiltersBar from '../../../components/attendance/SummaryFiltersBar';
import SourcesBadge from '../../../components/attendance/SourcesBadge';
import EmployeeMonthDrawer from '../../../components/attendance/EmployeeMonthDrawer';
import AttendanceSkeleton from '../../../components/ui/AttendanceSkeleton';

const AttendanceSummaryTab: React.FC = () => {
    // Get current month in YYYY-MM format
    const getCurrentMonth = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    // State
    const [month, setMonth] = useState(getCurrentMonth());
    const [departmentId, setDepartmentId] = useState('');
    const [branchId, setBranchId] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; name: string } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Build filters object
    const filters = {
        ...(departmentId && { department_id: departmentId }),
        ...(branchId && { branch_id: branchId }),
    };

    // Fetch data
    const { data: kpisData, isLoading: kpisLoading, error: kpisError } = useAttendanceSummaryKpis(month, filters);
    const { data: tableData, isLoading: tableLoading, error: tableError } = useAttendanceSummaryTable(
        month,
        filters,
        page,
        pageSize,
        search
    );

    // Mock departments and branches (replace with actual data)
    const departments = [
        { id: 1, name: 'Engineering' },
        { id: 2, name: 'Sales' },
        { id: 3, name: 'HR' },
    ];

    const branches = [
        { id: 1, name: 'Main Office' },
        { id: 2, name: 'Branch A' },
        { id: 3, name: 'Branch B' },
    ];

    const handleClearFilters = () => {
        setDepartmentId('');
        setBranchId('');
        setSearch('');
        setPage(1);
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // TODO: Implement actual export
            await new Promise(resolve => setTimeout(resolve, 2000));
            alert('Export functionality coming soon!');
        } finally {
            setIsExporting(false);
        }
    };

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatHours = (minutes: number) => {
        return (minutes / 60).toFixed(1);
    };

    if (kpisLoading && tableLoading) {
        return <AttendanceSkeleton type="overview" />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                    Monthly Summary
                </h2>
            </div>

            {/* Filters */}
            <SummaryFiltersBar
                month={month}
                onMonthChange={(newMonth) => {
                    setMonth(newMonth);
                    setPage(1);
                }}
                departmentId={departmentId}
                onDepartmentChange={(id) => {
                    setDepartmentId(id);
                    setPage(1);
                }}
                branchId={branchId}
                onBranchChange={(id) => {
                    setBranchId(id);
                    setPage(1);
                }}
                search={search}
                onSearchChange={(s) => {
                    setSearch(s);
                    setPage(1);
                }}
                onExport={handleExport}
                onClearFilters={handleClearFilters}
                departments={departments}
                branches={branches}
                isExporting={isExporting}
            />

            {/* KPI Cards */}
            {kpisError ? (
                <GlassCard>
                    <div className="text-center py-8">
                        <p className="text-red-500 font-medium mb-2">Failed to load KPIs</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                    </div>
                </GlassCard>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <SummaryKpiCard
                        label="Total Employees"
                        value={kpisData?.total_employees || 0}
                        icon={Users}
                        color="text-blue-600"
                        isLoading={kpisLoading}
                    />
                    <SummaryKpiCard
                        label="Present Days"
                        value={kpisData?.present_days_total || 0}
                        icon={UserCheck}
                        color="text-green-600"
                        isLoading={kpisLoading}
                    />
                    <SummaryKpiCard
                        label="Absent Days"
                        value={kpisData?.absent_days_total || 0}
                        icon={UserX}
                        color="text-red-600"
                        isLoading={kpisLoading}
                    />
                    <SummaryKpiCard
                        label="Late Minutes"
                        value={kpisData?.late_minutes_total || 0}
                        icon={Clock}
                        color="text-orange-600"
                        isLoading={kpisLoading}
                    />
                    <SummaryKpiCard
                        label="Overtime Hours"
                        value={kpisData ? formatHours(kpisData.overtime_minutes_total) : '0'}
                        icon={TrendingUp}
                        color="text-blue-600"
                        suffix="h"
                        isLoading={kpisLoading}
                    />
                    <SummaryKpiCard
                        label="Worked Hours"
                        value={kpisData ? formatHours(kpisData.worked_minutes_total) : '0'}
                        icon={Briefcase}
                        color="text-purple-600"
                        suffix="h"
                        isLoading={kpisLoading}
                    />
                </div>
            )}

            {/* Summary Table */}
            <GlassCard>
                {tableError ? (
                    <div className="text-center py-12">
                        <p className="text-red-500 font-medium mb-2">Failed to load summary table</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Please try again later</p>
                    </div>
                ) : tableLoading ? (
                    <div className="animate-pulse space-y-4">
                        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" />
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
                        ))}
                    </div>
                ) : !tableData?.data || tableData.data.length === 0 ? (
                    <div className="text-center py-12">
                        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Records Found
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {search ? 'Try adjusting your search or filters' : 'No attendance data for this period'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-white/10">
                                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Employee
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Department
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Working Days
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Present
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Absent
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Late (mins)
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            OT (mins)
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Worked (hrs)
                                        </th>
                                        <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Sources
                                        </th>
                                        <th className="text-center py-3 px-4 text-xs font-bold uppercase text-gray-600 dark:text-gray-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.data.map((row: any) => (
                                        <tr
                                            key={row.employee.id}
                                            className="border-b border-gray-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                        >
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {row.employee.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-gray-400">
                                                        {row.employee.staff_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-gray-400">
                                                <div>
                                                    <p>{row.employee.department}</p>
                                                    <p className="text-xs text-slate-500 dark:text-gray-500">
                                                        {row.employee.branch}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-slate-900 dark:text-white font-medium">
                                                {row.working_days}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-green-600 dark:text-green-400 font-medium">
                                                {row.present_days}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-red-600 dark:text-red-400 font-medium">
                                                {row.absent_days}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-orange-600 dark:text-orange-400 font-medium">
                                                {row.late_minutes}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-blue-600 dark:text-blue-400 font-medium">
                                                {row.overtime_minutes}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm text-purple-600 dark:text-purple-400 font-medium">
                                                {formatHours(row.worked_minutes)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <SourcesBadge sources={row.sources} compact />
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <button
                                                    onClick={() => setSelectedEmployee({
                                                        id: row.employee.id,
                                                        name: row.employee.name
                                                    })}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {tableData.meta && tableData.meta.lastPage > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                                <div className="text-sm text-slate-600 dark:text-gray-400">
                                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, tableData.meta.total)} of {tableData.meta.total} employees
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-slate-600 dark:text-gray-400">
                                        Page {page} of {tableData.meta.lastPage}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(tableData.meta.lastPage, p + 1))}
                                        disabled={page === tableData.meta.lastPage}
                                        className="p-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </GlassCard>

            {/* Employee Month Drawer */}
            {selectedEmployee && (
                <EmployeeMonthDrawer
                    employeeId={selectedEmployee.id}
                    employeeName={selectedEmployee.name}
                    month={month}
                    onClose={() => setSelectedEmployee(null)}
                />
            )}
        </div>
    );
};

export default AttendanceSummaryTab;
