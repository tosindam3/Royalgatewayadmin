
import { 
  PayrollPeriod, 
  PayrollRun, 
  PayrollLine, 
  ApprovalStep,
  PayrollRunStatus
} from '../types';

// Mock Data Generators
export const generateMockPeriods = (): PayrollPeriod[] => [
  { id: 'p-1', name: 'April 2024', startDate: '2024-04-01', endDate: '2024-04-30', status: 'PROCESSING' },
  { id: 'p-2', name: 'March 2024', startDate: '2024-03-01', endDate: '2024-03-31', status: 'CLOSED' },
  { id: 'p-3', name: 'May 2024', startDate: '2024-05-01', endDate: '2024-05-31', status: 'OPEN' },
];

export const generateMockRuns = (periodId: string): PayrollRun[] => [
  {
    id: 'run-101',
    periodId,
    periodName: 'April 2024',
    status: 'UNDER_REVIEW',
    branchScope: 'Main HQ',
    deptScope: 'All Departments',
    totalGross: 450200,
    totalNet: 412000,
    anomalyCount: 12,
    submittedBy: 'Emily Johnson',
    submittedAt: '2024-04-20T14:30:00Z',
    approvalChain: [
      { id: 's1', role: 'HR Director', approverName: 'Alex Rivera', status: 'APPROVED', updatedAt: '2024-04-21T09:00:00Z' },
      { id: 's2', role: 'Finance Head', approverName: 'Sarah Mitchell', status: 'PENDING' },
      { id: 's3', role: 'CEO', status: 'PENDING' },
    ]
  }
];

export const generateMockLines = (count: number = 20): PayrollLine[] => {
  const lines: PayrollLine[] = [];
  const names = ['Ethan Parker', 'Amanda Ward', 'Douglas Baker', 'Sarah Mitchell', 'Michael Carter', 'Robert Davis', 'John Smith', 'Kelly Robinson'];
  const depts = ['Engineering', 'Marketing', 'Sales', 'HR', 'IT', 'Product'];
  
  for (let i = 0; i < count; i++) {
    const base = 5000 + Math.random() * 5000;
    const allowances = 500 + Math.random() * 1000;
    const deductions = Math.random() * 300;
    const latePenalty = Math.random() > 0.7 ? 50 : 0;
    const otPay = Math.random() > 0.5 ? 200 + Math.random() * 500 : 0;
    const bonus = Math.random() > 0.8 ? 1000 : 0;
    const gross = base + allowances + otPay + bonus - deductions - latePenalty;
    const net = gross * 0.85; // Simple tax simulation

    lines.push({
      id: `line-${i}`,
      employeeId: `EMP-${100 + i}`,
      employeeName: names[i % names.length],
      avatar: `https://picsum.photos/40?sig=${i}`,
      department: depts[i % depts.length],
      branch: 'Main HQ',
      baseSalary: base,
      allowances,
      deductions,
      latePenalty,
      overtimePay: otPay,
      performanceBonus: bonus,
      grossPay: gross,
      netPay: net,
      variance: (Math.random() - 0.5) * 500,
      hasAnomalies: Math.random() > 0.9,
      isOnHold: false
    });
  }
  return lines;
};

// API Client Interface
export const payrollApi = {
  getPeriods: async (): Promise<PayrollPeriod[]> => {
    await new Promise(r => setTimeout(r, 600));
    return generateMockPeriods();
  },
  
  getRuns: async (periodId: string): Promise<PayrollRun[]> => {
    await new Promise(r => setTimeout(r, 800));
    return generateMockRuns(periodId);
  },

  getLines: async (runId: string): Promise<PayrollLine[]> => {
    await new Promise(r => setTimeout(r, 1000));
    return generateMockLines(50);
  },

  submitRun: async (runId: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1200));
    return true;
  },

  approveRun: async (runId: string, comment?: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    return true;
  }
};
