import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import GlassCard from '../components/GlassCard';
import { payrollApi } from '../services/payrollService';
import Button from '../components/ui/Button';
import {
  PayrollPeriod,
  PayrollRun,
  PayrollRunEmployee,
  PayrollEmployeeBreakdown,
  PayrollRunStatus
} from '../types';
import PayrollDashboard from '../components/payroll/PayrollDashboard';
import SalaryManagementTab from '../components/payroll/SalaryManagementTab';

const Payroll: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Periods' | 'Approvals' | 'Settings' | 'Management'>('Dashboard');
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollRunEmployee | null>(null);
  const [employeeBreakdown, setEmployeeBreakdown] = useState<PayrollEmployeeBreakdown | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalToReject, setApprovalToReject] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const perPage = 50;

  // New state for settings
  const [settings, setSettings] = useState({
    taxRate: 10,
    pensionRate: 8,
    housingAllowance: 20,
    currency: 'USD',
    lockPeriod: true
  });

  const handleDownloadPayslip = (employee: PayrollRunEmployee) => {
    // Generate a simple text-based payslip and trigger download
    const payslipContent = `
      PAYSLIP - ${employee.employee.name}
      ID: ${employee.employee.staff_id}
      Department: ${employee.employee.department}
      
      Gross Pay: $${employee.gross_pay.toLocaleString()}
      Deductions: $${employee.total_deductions.toLocaleString()}
      Net Pay: $${employee.net_pay.toLocaleString()}
      
      Generated on ${new Date().toLocaleDateString()}
    `;
    const blob = new Blob([payslipContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip_${employee.employee.staff_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };


  // Queries
  const { data: globalSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['payroll-settings'],
    queryFn: () => payrollApi.getSettings(),
    enabled: activeTab === 'Settings'
  });

  const { data: periods = [] } = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => payrollApi.getPeriods()
  });

  const { data: runsData } = useQuery({
    queryKey: ['payroll-runs', selectedPeriodId, currentPage],
    queryFn: () => payrollApi.getRuns({
      period_id: selectedPeriodId || undefined,
      page: currentPage,
      per_page: perPage
    }),
    enabled: true
  });

  const { data: singleRunData } = useQuery({
    queryKey: ['payroll-run', selectedRunId],
    queryFn: () => payrollApi.getRun(selectedRunId!),
    enabled: !!selectedRunId
  });

  const { data: employeesData } = useQuery({
    queryKey: ['payroll-employees', selectedRunId, currentPage],
    queryFn: () => payrollApi.getRunEmployees(selectedRunId!, currentPage, perPage),
    enabled: !!selectedRunId
  });

  const { data: approvalInboxData } = useQuery({
    queryKey: ['approval-inbox', currentPage],
    queryFn: () => payrollApi.getApprovalInbox({
      entity_type: 'payroll_run',
      page: currentPage,
      per_page: perPage
    }),
    enabled: activeTab === 'Approvals'
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);


  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Record<string, any>) => payrollApi.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-settings'] });
      alert('Global payroll parameters updated successfully!');
    }
  });

  const recalculateMutation = useMutation({
    mutationFn: (runId: number) => payrollApi.recalculate(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs', 'payroll-run', 'payroll-employees'] });
    }
  });

  const submitMutation = useMutation({
    mutationFn: ({ runId, message }: { runId: number; message?: string }) =>
      payrollApi.submit(runId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs', 'payroll-run'] });
      setShowSubmitModal(false);
    }
  });

  const approveMutation = useMutation({
    mutationFn: ({ approvalId, comment }: { approvalId: number; comment?: string }) =>
      payrollApi.approve(approvalId, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox', 'payroll-runs', 'payroll-run'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ approvalId, reason }: { approvalId: number; reason: string }) =>
      payrollApi.reject(approvalId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox', 'payroll-runs', 'payroll-run'] });
      setShowRejectModal(false);
      setRejectionReason('');
      setApprovalToReject(null);
    }
  });



  // Helper functions
  const getStatusColor = (status: PayrollRunStatus) => {
    switch (status) {
      case 'draft': return 'text-slate-500';
      case 'submitted': return 'text-amber-500';
      case 'approved': return 'text-emerald-500';
      case 'rejected': return 'text-rose-500';
      default: return 'text-slate-500';
    }
  };

  const getStatusBadge = (status: PayrollRunStatus) => {
    const colors = {
      draft: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      submitted: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
      approved: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
      rejected: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const loadEmployeeBreakdown = async (runId: number, employeeId: number) => {
    const data = await payrollApi.getEmployeeBreakdown(runId, employeeId);
    setEmployeeBreakdown(data);
  };

  const runs = runsData?.data || [];
  const runsMeta = runsData?.meta;
  const employees = employeesData?.data || [];
  const employeesMeta = employeesData?.meta;
  const approvals = approvalInboxData?.data || [];
  const approvalsMeta = approvalInboxData?.meta;

  const selectedRun = singleRunData || runs.find(r => r.id === selectedRunId);
  const canEdit = selectedRun && (selectedRun.status === 'draft' || selectedRun.status === 'rejected');
  const canSubmit = selectedRun && (selectedRun.status === 'draft' || selectedRun.status === 'rejected');
  const canRecalculate = selectedRun && (selectedRun.status === 'draft' || selectedRun.status === 'rejected');


  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">
            Global <span className="text-[#8252e9]">Payroll</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1 italic">
            Enterprise Financial Governance
          </p>
        </div>
        <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar max-w-full">
          {(['Dashboard', 'Periods', 'Management', 'Approvals', 'Settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                ? 'bg-[#8252e9] text-white shadow-xl'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {/* Dashboard Tab */}
        {activeTab === 'Dashboard' && (
          <PayrollDashboard
            runs={runs}
            meta={runsMeta}
            onSendToFinance={() => setActiveTab('Approvals')}
            onCreatePayroll={() => setActiveTab('Periods')}
          />
        )}

        {/* Management Tab */}
        {activeTab === 'Management' && (
          <SalaryManagementTab />
        )}

        {/* Periods Tab */}
        {activeTab === 'Periods' && (
          <div className="space-y-6">
            {/* Period Selector */}
            <GlassCard className="!p-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase italic">
                Select Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {periods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => {
                      setSelectedPeriodId(period.id);
                      setCurrentPage(1);
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${selectedPeriodId === period.id
                      ? 'border-[#8252e9] bg-[#8252e9]/10'
                      : 'border-slate-200 dark:border-white/10 hover:border-[#8252e9]/50'
                      }`}
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {period.name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {period.working_days} working days • {period.status}
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>


            {/* Runs for Selected Period */}
            {selectedPeriodId && (
              <GlassCard className="!p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">
                    Payroll Runs
                  </h3>
                  <button className="px-4 py-2 bg-[#8252e9] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">
                    + New Run
                  </button>
                </div>
                <div className="space-y-3">
                  {runs.map((run) => (
                    <div
                      key={run.id}
                      onClick={() => {
                        setSelectedRunId(run.id);
                        setCurrentPage(1);
                      }}
                      className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              Run #{run.id}
                            </p>
                            {getStatusBadge(run.status)}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {run.employee_count} employees • Prepared by {run.prepared_by}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <div>
                              <p className="text-[9px] text-slate-500">Gross</p>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">
                                {formatCurrency(run.total_gross)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500">Deductions</p>
                              <p className="text-xs font-bold text-rose-500">
                                {formatCurrency(run.total_deductions)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] text-slate-500">Net</p>
                              <p className="text-xs font-bold text-emerald-500">
                                {formatCurrency(run.total_net)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {run.status === 'rejected' && run.rejection_comment && (
                        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl">
                          <p className="text-[9px] font-bold text-rose-900 dark:text-rose-300 mb-1">
                            REJECTION REASON:
                          </p>
                          <p className="text-xs text-rose-700 dark:text-rose-400">
                            {run.rejection_comment}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {runsMeta && runsMeta.last_page > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-slate-500 font-bold">
                      Page {currentPage} of {runsMeta.last_page}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === runsMeta.last_page}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </GlassCard>
            )}
          </div>
        )}


        {/* Approvals Tab */}
        {activeTab === 'Approvals' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase italic flex items-center gap-3">
              <div className="w-2 h-8 bg-amber-500 rounded-full" />
              Approval Inbox
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {approvals.length > 0 ? (
                approvals.map((approval) => (
                  <GlassCard key={approval.id} className="!p-0 overflow-hidden group hover:border-[#8252e9]/50 transition-all duration-500">
                    <div className="flex flex-col md:flex-row">
                      {/* Left: Metadata */}
                      <div className="p-8 flex-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="px-3 py-1 bg-[#8252e9]/10 text-[#8252e9] rounded-full text-[9px] font-black uppercase tracking-widest">
                              {approval.request_number}
                            </span>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white mt-3 uppercase tracking-tight italic">
                              {approval.entity_summary?.period_name || 'Payroll Run'}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                              Requested by {approval.requester} • {new Date(approval.submitted_at).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(approval.status as any)}
                        </div>
                        {approval.requester_comment && (
                          <div className="mt-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border-l-4 border-[#8252e9] italic text-xs text-slate-600 dark:text-slate-400">
                            "{approval.requester_comment}"
                          </div>
                        )}
                      </div>

                      {/* Middle: Snapshot */}
                      <div className="p-8 flex-1 bg-slate-50/50 dark:bg-black/20 flex flex-col justify-center">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Net Pay</p>
                            <p className="text-xl font-black text-emerald-500">
                              {approval.entity_summary ? formatCurrency(approval.entity_summary.total_net) : '---'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Employees</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">
                              {approval.entity_summary?.employee_count || '---'} 👤
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="p-8 flex flex-col justify-center gap-3 bg-white dark:bg-white/2 shrink-0 md:w-64">
                        <Button
                          variant="secondary"
                          className="w-full !text-[9px]"
                          onClick={() => setSelectedRunId(approval.entity_id)}
                        >
                          View Details
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1 !bg-rose-500 hover:!bg-rose-600 shadow-rose-500/20 !text-[9px]"
                            onClick={() => {
                              setApprovalToReject(approval.id);
                              setShowRejectModal(true);
                            }}
                            disabled={approval.status !== 'pending'}
                          >
                            Reject
                          </Button>
                          <Button
                            variant="primary"
                            className="flex-1 !bg-emerald-500 hover:!bg-emerald-600 shadow-emerald-500/20 !text-[9px]"
                            onClick={() => approveMutation.mutate({ approvalId: approval.id })}
                            isLoading={approveMutation.isPending && approveMutation.variables?.approvalId === approval.id}
                            disabled={approval.status !== 'pending'}
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))
              ) : (
                <div className="py-20 text-center text-slate-500 uppercase tracking-widest font-black italic opacity-50">
                  No pending approvals in your inbox
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'Settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassCard className="!p-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase italic flex items-center gap-3">
                <div className="w-2 h-8 bg-[#8252e9] rounded-full" />
                Global Parameters
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Income Tax Rate (%)</label>
                  <input
                    type="number"
                    value={globalSettings?.payroll_tax_rate ?? settings.taxRate}
                    onChange={(e) => updateSettingsMutation.mutate({ payroll_tax_rate: Number(e.target.value) })}
                    className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Pension Contribution (%)</label>
                  <input
                    type="number"
                    value={globalSettings?.payroll_pension_rate ?? settings.pensionRate}
                    onChange={(e) => updateSettingsMutation.mutate({ payroll_pension_rate: Number(e.target.value) })}
                    className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold"
                  />
                </div>
                <div className="pt-4">
                  <Button
                    variant="primary"
                    className="w-full"
                    isLoading={updateSettingsMutation.isPending}
                    onClick={() => updateSettingsMutation.mutate({
                      payroll_tax_rate: globalSettings?.payroll_tax_rate ?? settings.taxRate,
                      payroll_pension_rate: globalSettings?.payroll_pension_rate ?? settings.pensionRate
                    })}
                  >
                    Save Configuration
                  </Button>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="!p-8">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase italic flex items-center gap-3">
                <div className="w-2 h-8 bg-emerald-500 rounded-full" />
                System Controls
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Lock Past Periods</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Prevent edits to closed months</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.lockPeriod}
                    onChange={(e) => setSettings({ ...settings, lockPeriod: e.target.checked })}
                    className="w-6 h-6 rounded-lg accent-[#8252e9]"
                  />
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl opacity-50 cursor-not-allowed">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Auto-Generate Reports</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest text-[#8252e9] font-black">Coming Soon</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>


      {/* Employee Details Modal */}
      {selectedRunId && selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
          <div className="absolute inset-0" onClick={() => {
            setSelectedEmployee(null);
            setEmployeeBreakdown(null);
          }} />
          <div className="w-full max-w-2xl bg-white dark:bg-[#0d0a1a] shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-500 flex flex-col rounded-[40px] relative overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-10 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-gradient-to-br from-[#8252e9]/5 to-transparent dark:from-[#8252e9]/10">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                  {selectedEmployee.employee.name}
                </h3>
                <p className="text-[10px] text-[#8252e9] font-black uppercase tracking-widest mt-1">
                  {selectedEmployee.employee.staff_id} • {selectedEmployee.employee.department}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedEmployee(null);
                  setEmployeeBreakdown(null);
                }}
                className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeWidth="3" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-10 space-y-8">
              {/* Summary */}
              <section>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 border-l-2 border-[#8252e9] pl-3">
                  Compensation Summary
                </h4>
                <div className="grid grid-cols-3 gap-px bg-slate-200 dark:bg-white/10 rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/10">
                  <div className="bg-white dark:bg-[#0d0a1a] p-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Gross Pay</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">
                      {formatCurrency(selectedEmployee.gross_pay)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#0d0a1a] p-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Deductions</p>
                    <p className="text-lg font-black text-rose-500">
                      {formatCurrency(selectedEmployee.total_deductions)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#0d0a1a] p-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Net Pay</p>
                    <p className="text-lg font-black text-emerald-500">
                      {formatCurrency(selectedEmployee.net_pay)}
                    </p>
                  </div>
                </div>
              </section>

              {/* Attendance Snapshot */}
              <section>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 border-l-2 border-[#8252e9] pl-3">
                  Attendance Snapshot
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Absent Days</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedEmployee.absent_days}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Late Minutes</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedEmployee.late_minutes}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Overtime Hours</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedEmployee.overtime_hours}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Performance Score</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedEmployee.performance_score}
                    </p>
                  </div>
                </div>
              </section>


              {/* Breakdown (Lazy Loaded) */}
              {!employeeBreakdown && (
                <button
                  onClick={() => loadEmployeeBreakdown(selectedRunId, selectedEmployee.employee.id)}
                  className="w-full py-3 bg-[#8252e9]/10 border-2 border-[#8252e9] text-[#8252e9] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#8252e9] hover:text-white transition-all"
                >
                  Load Detailed Breakdown
                </button>
              )}

              {employeeBreakdown && (
                <>
                  <section>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 border-l-2 border-emerald-500 pl-3">
                      Earnings
                    </h4>
                    <div className="space-y-2">
                      {employeeBreakdown.earnings.map((item) => (
                        <div key={item.code} className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-[9px] text-slate-500">{item.code}</p>
                          </div>
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-4 border-l-2 border-rose-500 pl-3">
                      Deductions
                    </h4>
                    <div className="space-y-2">
                      {employeeBreakdown.deductions.map((item) => (
                        <div key={item.code} className="flex justify-between items-center p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-[9px] text-slate-500">{item.code}</p>
                          </div>
                          <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                            -{formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-10 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex gap-4">
              <Button variant="secondary" className="flex-1" onClick={() => alert('Audit logs coming soon')}>
                Audit Records
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => handleDownloadPayslip(selectedEmployee)}>
                Download Payslip
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Run Details Panel (Employees Table) */}
      {selectedRunId && selectedRun && !selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
          <div className="absolute inset-0" onClick={() => setSelectedRunId(null)} />
          <div className="w-full max-w-6xl bg-white dark:bg-[#0d0a1a] shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-500 flex flex-col rounded-[40px] relative overflow-hidden max-h-[90vh]">
            {/* Header */}
            <div className="p-10 border-b border-slate-100 dark:border-white/5 bg-gradient-to-br from-[#8252e9]/5 to-transparent dark:from-[#8252e9]/10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                    {selectedRun.period_name} - Run #{selectedRun.id}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">
                    {selectedRun.employee_count} employees • Prepared by {selectedRun.prepared_by}
                  </p>
                  <div className="flex gap-3 mt-3">
                    {getStatusBadge(selectedRun.status)}
                    {selectedRun.approver && (
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-[9px] font-black uppercase">
                        Approver: {selectedRun.approver}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRunId(null)}
                  className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeWidth="3" />
                  </svg>
                </button>
              </div>

              {/* Rejection Comment */}
              {selectedRun.status === 'rejected' && selectedRun.rejection_comment && (
                <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
                  <p className="text-[9px] font-bold text-rose-900 dark:text-rose-300 mb-2">
                    REJECTION REASON:
                  </p>
                  <p className="text-sm text-rose-700 dark:text-rose-400">
                    {selectedRun.rejection_comment}
                  </p>
                </div>
              )}

              {/* Totals */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Gross</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(selectedRun.total_gross)}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Deductions</p>
                  <p className="text-xl font-black text-rose-500">
                    {formatCurrency(selectedRun.total_deductions)}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Total Net</p>
                  <p className="text-xl font-black text-emerald-500">
                    {formatCurrency(selectedRun.total_net)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  isLoading={recalculateMutation.isPending}
                  disabled={!canRecalculate}
                  onClick={() => recalculateMutation.mutate(selectedRun.id)}
                  className="px-8"
                >
                  Recalculate
                </Button>
                <Button
                  variant="primary"
                  disabled={!canSubmit}
                  onClick={() => setShowSubmitModal(true)}
                  className="px-8"
                >
                  Send for Approval
                </Button>
              </div>
            </div>


            {/* Employees Table */}
            <div className="flex-1 overflow-y-auto p-10">
              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4 uppercase">
                Employee Breakdown
              </h4>
              <div className="space-y-2">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {emp.employee.name}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          {emp.employee.staff_id} • {emp.employee.department}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Net Pay</p>
                        <p className="text-sm font-black text-emerald-500">
                          {formatCurrency(emp.net_pay)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {employeesMeta && employeesMeta.last_page > 1 && (
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-slate-500">
                    Page {currentPage} of {employeesMeta.last_page}
                  </span>
                  <button
                    disabled={currentPage === employeesMeta.last_page}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {showSubmitModal && selectedRun && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
          <div className="absolute inset-0" onClick={() => setShowSubmitModal(false)} />
          <div className="w-full max-w-md bg-white dark:bg-[#0d0a1a] shadow-2xl border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-500 rounded-[32px] relative overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 uppercase italic">
                Send for Approval
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Submit this payroll run to {selectedRun.approver} for approval.
              </p>
              <textarea
                placeholder="Optional message..."
                className="w-full p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm resize-none"
                rows={4}
                id="submit-message"
              />
              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const message = (document.getElementById('submit-message') as HTMLTextAreaElement)?.value;
                    submitMutation.mutate({ runId: selectedRun.id, message: message || undefined });
                  }}
                  isLoading={submitMutation.isPending}
                  className="flex-1"
                >
                  Submit
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0" onClick={() => setShowRejectModal(false)} />
          <div className="w-full max-w-lg bg-white dark:bg-[#0d0a1a] border border-slate-200 dark:border-white/10 rounded-[40px] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🛑</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white italic mb-2 uppercase tracking-tight">Reject Payroll Run</h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8">Please provide a reason for rejection</p>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what needs to be fixed..."
                className="w-full h-32 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none placeholder:text-slate-400 font-bold"
              />

              <div className="flex gap-4 mt-10">
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 !bg-rose-500 hover:!bg-rose-600 shadow-rose-500/20"
                  onClick={() => approvalToReject && rejectMutation.mutate({ approvalId: approvalToReject, reason: rejectionReason })}
                  isLoading={rejectMutation.isPending}
                  disabled={!rejectionReason.trim()}
                >
                  Reject Run
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
