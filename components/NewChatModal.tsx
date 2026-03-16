import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (data: CreateChannelData) => void;
}

interface CreateChannelData {
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct';
  member_ids: number[];
}

interface Employee {
  id: number;
  user_id: number;
  name: string;
  email: string;
  department?: { name: string };
  branch?: { name: string };
}

interface Department {
  id: number;
  name: string;
}

interface Branch {
  id: number;
  name: string;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onCreateChannel }) => {
  const [step, setStep] = useState<'type' | 'select' | 'details'>('type');
  const [chatType, setChatType] = useState<'direct' | 'group' | 'department' | 'branch'>('direct');
  const [channelType, setChannelType] = useState<'public' | 'private'>('private');
  const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiClient.get<Employee[]>('/hr-core/employees', { params: { per_page: 'all' } }) as any,
    enabled: isOpen && (chatType === 'direct' || chatType === 'group'),
  });

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.get<Department[]>('/hr-core/departments', { params: { per_page: 'all' } }) as any,
    enabled: isOpen && chatType === 'department',
  });

  // Fetch branches
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => apiClient.get<Branch[]>('/hr-core/branches', { params: { per_page: 'all' } }) as any,
    enabled: isOpen && chatType === 'branch',
  });

  // Fetch department employees
  const { data: deptEmployeesData } = useQuery({
    queryKey: ['department-employees', selectedDepartment],
    queryFn: () => apiClient.get<Employee[]>(`/hr-core/departments/${selectedDepartment}/employees`) as any,
    enabled: isOpen && chatType === 'department' && selectedDepartment !== null,
  });

  // Fetch branch employees
  const { data: branchEmployeesData } = useQuery({
    queryKey: ['branch-employees', selectedBranch],
    queryFn: () => apiClient.get<Employee[]>(`/hr-core/branches/${selectedBranch}/employees`) as any,
    enabled: isOpen && chatType === 'branch' && selectedBranch !== null,
  });

  const employees = (employeesData as Employee[]) || [];
  const departments = (departmentsData as Department[]) || [];
  const branches = (branchesData as Branch[]) || [];
  const deptEmployees = (deptEmployeesData as Employee[]) || [];
  const branchEmployees = (branchEmployeesData as Employee[]) || [];

  const filteredEmployees = employees.filter(emp =>
    emp.user_id && ( // Only show employees with a user account
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleReset = () => {
    setStep('type');
    setChatType('direct');
    setChannelType('private');
    setSelectedEmployees([]);
    setSelectedDepartment(null);
    setSelectedBranch(null);
    setChannelName('');
    setChannelDescription('');
    setSearchTerm('');
  };

  const handleCreate = () => {
    let memberIds: number[] = [];
    let name = channelName;

    if (chatType === 'direct') {
      memberIds = selectedEmployees;
      if (selectedEmployees.length === 1) {
        const employee = employees.find(e => e.user_id === selectedEmployees[0]);
        name = employee?.name || 'Direct Message';
      }
    } else if (chatType === 'group') {
      memberIds = selectedEmployees;
    } else if (chatType === 'department' && selectedDepartment) {
      memberIds = deptEmployees.map(e => e.user_id).filter(Boolean) as number[];
      if (!name) {
        const dept = departments.find(d => d.id === selectedDepartment);
        name = dept?.name || 'Department Chat';
      }
    } else if (chatType === 'branch' && selectedBranch) {
      memberIds = branchEmployees.map(e => e.user_id).filter(Boolean) as number[];
      if (!name) {
        const branch = branches.find(b => b.id === selectedBranch);
        name = branch?.name || 'Branch Chat';
      }
    }

    onCreateChannel({
      name,
      description: channelDescription,
      type: chatType === 'direct' ? 'direct' : channelType,
      member_ids: memberIds,
    });

    handleReset();
    onClose();
  };

  const canProceed = () => {
    if (step === 'type') return true;
    if (step === 'select') {
      if (chatType === 'direct' || chatType === 'group') return selectedEmployees.length > 0;
      if (chatType === 'department') return selectedDepartment !== null;
      if (chatType === 'branch') return selectedBranch !== null;
    }
    if (step === 'details') return channelName.trim().length > 0;
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white dark:bg-[#1c1633] border border-slate-200 dark:border-white/10 rounded-t-[32px] sm:rounded-[32px] w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">New Chat</h3>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {/* Step 1: Select Chat Type */}
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Choose the type of chat you want to create:</p>

              <button
                onClick={() => {
                  setChatType('direct');
                  setStep('select');
                }}
                className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-[#8252e9]/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">👤</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Direct Message</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chat with a specific employee</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#8252e9] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => {
                  setChatType('group');
                  setStep('select');
                }}
                className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-[#8252e9]/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl">👥</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Group Chat</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Create a group with multiple employees</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#8252e9] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => {
                  setChatType('department');
                  setStep('select');
                }}
                className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-[#8252e9]/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl">🏢</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Department Chat</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chat with an entire department</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#8252e9] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => {
                  setChatType('branch');
                  setStep('select');
                }}
                className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl hover:border-[#8252e9]/50 transition-all text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center text-2xl">🏪</div>
                  <div className="flex-1">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Branch Chat</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Chat with an entire branch</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-[#8252e9] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Select Members/Department/Branch */}
          {step === 'select' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('type')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {(chatType === 'direct' || chatType === 'group') && (
                <>
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#8252e9]/50 transition-all"
                  />

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredEmployees.map((employee) => (
                      <label
                        key={employee.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-[#8252e9]/50 transition-all cursor-pointer"
                      >
                        <input
                          type={chatType === 'direct' ? 'radio' : 'checkbox'}
                          name="employee"
                          checked={selectedEmployees.includes(employee.user_id)}
                          onChange={(e) => {
                            if (chatType === 'direct') {
                              setSelectedEmployees(e.target.checked ? [employee.user_id] : []);
                            } else {
                              setSelectedEmployees(prev =>
                                e.target.checked
                                  ? [...prev, employee.user_id]
                                  : prev.filter(id => id !== employee.user_id)
                              );
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{employee.name}</p>
                          <p className="text-xs text-slate-500">{employee.email}</p>
                          {employee.department && (
                            <p className="text-xs text-slate-400">{employee.department.name}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}

              {chatType === 'department' && (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <label
                      key={dept.id}
                      className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-[#8252e9]/50 transition-all cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="department"
                        checked={selectedDepartment === dept.id}
                        onChange={() => setSelectedDepartment(dept.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{dept.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {chatType === 'branch' && (
                <div className="space-y-2">
                  {branches.map((branch) => (
                    <label
                      key={branch.id}
                      className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:border-[#8252e9]/50 transition-all cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="branch"
                        checked={selectedBranch === branch.id}
                        onChange={() => setSelectedBranch(branch.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{branch.name}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Channel Details (for group/department/branch) */}
          {step === 'details' && chatType !== 'direct' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('select')}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Channel Name</label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="Enter channel name..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#8252e9]/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Description (Optional)</label>
                <textarea
                  value={channelDescription}
                  onChange={(e) => setChannelDescription(e.target.value)}
                  placeholder="Enter channel description..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#8252e9]/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Channel Type</label>
                <div className="flex gap-3">
                  <label className="flex-1 flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-[#8252e9]/50 transition-all">
                    <input
                      type="radio"
                      name="channelType"
                      value="public"
                      checked={channelType === 'public'}
                      onChange={() => setChannelType('public')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Public</p>
                      <p className="text-xs text-slate-500">Anyone can join</p>
                    </div>
                  </label>
                  <label className="flex-1 flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-[#8252e9]/50 transition-all">
                    <input
                      type="radio"
                      name="channelType"
                      value="private"
                      checked={channelType === 'private'}
                      onChange={() => setChannelType('private')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Private</p>
                      <p className="text-xs text-slate-500">Invite only</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-200 dark:border-white/5 flex flex-wrap justify-end gap-3">
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-xl text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          {step === 'select' && chatType === 'direct' && canProceed() && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 gradient-bg text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
            >
              Start Chat
            </button>
          )}
          {step === 'select' && chatType !== 'direct' && canProceed() && (
            <button
              onClick={() => setStep('details')}
              className="px-6 py-3 gradient-bg text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
            >
              Next
            </button>
          )}
          {step === 'details' && canProceed() && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 gradient-bg text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
            >
              Create Channel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
