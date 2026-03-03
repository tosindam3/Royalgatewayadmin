import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../services/employeeService';
import { organizationService } from '../../services/organizationService';
import { rbacService } from '../../services/rbacService';
import { Employee } from '../../types';
import { toast } from 'sonner';
import Button from '../ui/Button';

interface AddEmployeeModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee?: Employee | null;
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, employee }) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const isEditMode = !!employee;
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        branch_id: '',
        department_id: '',
        designation_id: '',
        manager_id: '',
        employment_type: 'full-time' as const,
        work_mode: 'onsite' as const,
        status: 'active' as const,
        hire_date: '',
        dob: '',
        blood_group: '',
        genotype: '',
        academics: '',
        password: '',
        password_confirmation: '',
        create_user_account: true,
        role_ids: [] as number[],
        primary_role_id: null as number | null,
    });

    // Populate form when editing
    useEffect(() => {
        if (employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                branch_id: employee.branch_id?.toString() || '',
                department_id: employee.department_id?.toString() || '',
                designation_id: employee.designation_id?.toString() || '',
                manager_id: employee.manager_id?.toString() || '',
                employment_type: employee.employment_type || 'full-time',
                work_mode: employee.work_mode || 'onsite',
                status: employee.status || 'active',
                hire_date: employee.hire_date || '',
                dob: employee.dob || '',
                blood_group: employee.blood_group || '',
                genotype: employee.genotype || '',
                academics: employee.academics || '',
                password: '',
                password_confirmation: '',
                create_user_account: false,
                role_ids: [],
                primary_role_id: null,
            });
        } else {
            // Reset form for add mode
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                branch_id: '',
                department_id: '',
                designation_id: '',
                manager_id: '',
                employment_type: 'full-time',
                work_mode: 'onsite',
                status: 'active',
                hire_date: '',
                dob: '',
                blood_group: '',
                genotype: '',
                academics: '',
                password: '',
                password_confirmation: '',
                create_user_account: true,
                role_ids: [],
                primary_role_id: null,
            });
            setStep(1);
        }
    }, [employee, isOpen]);

    const { data: branchesResponse } = useQuery({
        queryKey: ['branches'],
        queryFn: () => organizationService.getBranches({ per_page: 'all' })
    });

    const { data: departmentsResponse } = useQuery({
        queryKey: ['departments'],
        queryFn: () => organizationService.getDepartments({ per_page: 'all' })
    });

    const { data: designationsResponse } = useQuery({
        queryKey: ['designations'],
        queryFn: () => organizationService.getDesignations({ per_page: 'all' })
    });

    const { data: rolesResponse } = useQuery({
        queryKey: ['roles'],
        queryFn: () => rbacService.getRoles({ is_active: true })
    });

    // Extract arrays from response (handle both array and paginated response)
    const branches = Array.isArray(branchesResponse) ? branchesResponse : branchesResponse?.data || [];
    const departments = Array.isArray(departmentsResponse) ? departmentsResponse : departmentsResponse?.data || [];
    const designations = Array.isArray(designationsResponse) ? designationsResponse : designationsResponse?.data || [];
    const roles = Array.isArray(rolesResponse) ? rolesResponse : rolesResponse?.data || [];

    const createMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            // Transform string IDs to numbers and clean up empty strings
            const cleanedData = {
                ...data,
                branch_id: data.branch_id ? parseInt(data.branch_id.toString()) : null,
                department_id: data.department_id ? parseInt(data.department_id.toString()) : null,
                designation_id: data.designation_id ? parseInt(data.designation_id.toString()) : null,
                manager_id: data.manager_id ? parseInt(data.manager_id.toString()) : null,
                primary_role_id: data.primary_role_id ? parseInt(data.primary_role_id.toString()) : null,
                // Clean up empty strings for nullable fields
                blood_group: data.blood_group || null,
                genotype: data.genotype || null,
                academics: data.academics || null,
                // Remove password fields for edit mode
                ...(isEditMode ? {
                    password: undefined,
                    password_confirmation: undefined,
                    create_user_account: undefined,
                    role_ids: undefined,
                    primary_role_id: undefined,
                } : {}),
            };

            // Debug logging
            console.log('Original form data:', data);
            console.log('Cleaned data being sent to API:', cleanedData);
            console.log('Is edit mode:', isEditMode);
            console.log('Employee ID:', employee?.id);

            if (isEditMode && employee) {
                // Update employee - remove undefined fields
                const updateData = Object.fromEntries(
                    Object.entries(cleanedData).filter(([_, value]) => value !== undefined)
                );
                
                console.log('Final update data:', updateData);
                
                const updatedEmployee = await employeeService.update(employee.id.toString(), updateData);
                
                // Update roles if user account exists
                if (employee.user_id && data.role_ids.length > 0) {
                    await rbacService.assignRolesToUser(
                        employee.user_id, 
                        data.role_ids,
                        data.primary_role_id || undefined
                    );
                }
                
                return updatedEmployee;
            }
            
            // Create new employee
            const newEmployee = await employeeService.hire(cleanedData);
            
            // Assign roles if user account was created
            if (data.create_user_account && newEmployee.user_id && data.role_ids.length > 0) {
                await rbacService.assignRolesToUser(
                    newEmployee.user_id,
                    data.role_ids,
                    data.primary_role_id || undefined
                );
            }
            
            return newEmployee;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employee-directory'] });
            queryClient.invalidateQueries({ queryKey: ['employee-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['employee'] });
            toast.success(
                isEditMode ? 'Employee Updated' : 'Employee Added', 
                { description: isEditMode ? 'Employee information has been successfully updated.' : 'New employee has been successfully onboarded.' }
            );
            onClose();
            if (!isEditMode) resetForm();
        },
        onError: (error: any) => {
            console.error('Employee creation error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error config:', error.config);
            
            let errorMessage = 'Failed to add employee';
            let validationErrors: Record<string, string[]> = {};
            
            if (error.response?.status === 422) {
                // Handle validation errors
                if (error.response.data?.errors) {
                    validationErrors = error.response.data.errors;
                    setErrors(Object.fromEntries(
                        Object.entries(validationErrors).map(([key, messages]) => [
                            key, 
                            Array.isArray(messages) ? messages[0] : messages
                        ])
                    ));
                    errorMessage = 'Please check the form for validation errors';
                } else if (error.response.data?.message) {
                    errorMessage = error.response.data.message;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.errors) {
                const allErrors = Object.values(error.response.data.errors).flat();
                errorMessage = allErrors.join(', ');
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(
                isEditMode ? 'Failed to update employee' : 'Failed to add employee', 
                { description: errorMessage }
            );
        }
    });

    const resetForm = () => {
        setStep(1);
        setErrors({});
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            branch_id: '',
            department_id: '',
            designation_id: '',
            manager_id: '',
            employment_type: 'full-time',
            work_mode: 'onsite',
            status: 'active',
            hire_date: '',
            dob: '',
            blood_group: '',
            genotype: '',
            academics: '',
            password: '',
            password_confirmation: '',
            create_user_account: true,
            role_ids: [],
            primary_role_id: null,
        });
    };

    const validateStep = (currentStep: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (currentStep === 1) {
            // Step 1: Identity validation
            if (!formData.first_name.trim()) {
                newErrors.first_name = 'First name is required';
            }
            if (!formData.last_name.trim()) {
                newErrors.last_name = 'Last name is required';
            }
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                newErrors.email = 'Invalid email format';
            }
            if (!formData.phone.trim()) {
                newErrors.phone = 'Phone number is required';
            }
        }

        if (currentStep === 2 && !isEditMode) {
            // Step 2: Access validation
            if (formData.create_user_account) {
                if (!formData.password) {
                    newErrors.password = 'Password is required';
                } else if (formData.password.length < 8) {
                    newErrors.password = 'Password must be at least 8 characters';
                } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
                    newErrors.password = 'Password must contain uppercase, lowercase, number, and special character';
                }
                
                if (!formData.password_confirmation) {
                    newErrors.password_confirmation = 'Please confirm your password';
                } else if (formData.password !== formData.password_confirmation) {
                    newErrors.password_confirmation = 'Passwords do not match';
                }

                if (formData.role_ids.length === 0) {
                    newErrors.roles = 'Please select at least one role';
                }
            }
        }

        if (currentStep === 3) {
            // Step 3: Placement validation
            if (!formData.branch_id) {
                newErrors.branch_id = 'Branch is required';
            }
            if (!formData.department_id) {
                newErrors.department_id = 'Department is required';
            }
            if (!formData.designation_id) {
                newErrors.designation_id = 'Designation is required';
            }
        }

        if (currentStep === 4) {
            // Step 4: Details validation
            if (!formData.hire_date) {
                newErrors.hire_date = 'Hire date is required';
            }
            if (!formData.dob) {
                newErrors.dob = 'Date of birth is required';
            } else {
                const birthDate = new Date(formData.dob);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                if (age < 18) {
                    newErrors.dob = 'Employee must be at least 18 years old';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep(step + 1);
        } else {
            toast.error('Validation Error', { description: 'Please fill in all required fields correctly' });
        }
    };

    const handlePrevious = () => {
        setStep(Math.max(1, step - 1));
        setErrors({});
    };

    const handleSubmit = () => {
        if (!validateStep(4)) {
            toast.error('Validation Error', { description: 'Please fill in all required fields correctly' });
            return;
        }
        createMutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300 p-6">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="w-full max-w-3xl bg-white dark:bg-[#0d0a1a] shadow-2xl rounded-[40px] border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-500 flex flex-col relative overflow-hidden max-h-[90vh]">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full -mr-40 -mt-40 pointer-events-none" />

                
                {/* Header */}
                <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02] relative z-10">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                            {isEditMode ? 'Update' : 'Provision'} <span className="text-purple-500">Identity</span>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-1">
                            {isEditMode ? 'Employee Information Update' : 'Employee Onboarding Protocol'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm border border-slate-200 dark:border-white/10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3" /></svg>
                    </button>
                </div>

                {/* Progress */}
                <div className="px-8 pt-6 relative z-10">
                    <div className="flex justify-between mb-4">
                        {[1, 2, 3, 4].map((s) => (
                            <div key={s} className="flex flex-col items-center gap-2 flex-1">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${step >= s ? 'bg-purple-500 text-white shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                    {s}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                    {s === 1 ? 'Identity' : s === 2 ? 'Access' : s === 3 ? 'Placement' : 'Details'}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 transition-all duration-700" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {isEditMode && employee?.employee_code && (
                                <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Employee ID</p>
                                            <p className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono">{employee.employee_code}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {!isEditMode && (
                                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-6">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Auto-Generated Employee ID</h4>
                                            <p className="text-xs text-slate-600 dark:text-slate-400">A unique 4-digit employee ID will be automatically generated (e.g., 1001, 1002). This format matches your biometric attendance device for seamless integration.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                        First Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, first_name: e.target.value });
                                            if (errors.first_name) setErrors({ ...errors, first_name: '' });
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.first_name ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                        placeholder="John"
                                    />
                                    {errors.first_name && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.first_name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                        Last Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => {
                                            setFormData({ ...formData, last_name: e.target.value });
                                            if (errors.last_name) setErrors({ ...errors, last_name: '' });
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.last_name ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                        placeholder="Doe"
                                    />
                                    {errors.last_name && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.last_name}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email) setErrors({ ...errors, email: '' });
                                    }}
                                    className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.email ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                    placeholder="john.doe@company.com"
                                />
                                {errors.email && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value });
                                        if (errors.phone) setErrors({ ...errors, phone: '' });
                                    }}
                                    className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                    placeholder="+1 (555) 000-0000"
                                />
                                {errors.phone && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}


                    {step === 2 && !isEditMode && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-6">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-purple-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Login Credentials & Access Control</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Create secure login credentials and assign roles for this employee. They will be required to change their password on first login.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 mb-4 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.create_user_account}
                                        onChange={(e) => setFormData({ ...formData, create_user_account: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-purple-500 focus:ring-purple-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Create user account with login access</span>
                                </label>
                            </div>

                            {formData.create_user_account && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={formData.password}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, password: e.target.value });
                                                    if (errors.password) setErrors({ ...errors, password: '' });
                                                }}
                                                className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.password ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 pr-12 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                                placeholder="Enter secure password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {errors.password ? (
                                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.password}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-slate-500 mt-2">Must be at least 8 characters with uppercase, lowercase, number, and special character</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                            Confirm Password <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={formData.password_confirmation}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, password_confirmation: e.target.value });
                                                    if (errors.password_confirmation) setErrors({ ...errors, password_confirmation: '' });
                                                }}
                                                className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.password_confirmation ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 pr-12 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                                placeholder="Re-enter password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        {errors.password_confirmation && (
                                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.password_confirmation}
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-3">
                                            Assign Roles <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {roles.map((role: any) => (
                                                <label key={role.id} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.role_ids.includes(role.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    role_ids: [...formData.role_ids, role.id],
                                                                    primary_role_id: formData.role_ids.length === 0 ? role.id : formData.primary_role_id
                                                                });
                                                                if (errors.roles) setErrors({ ...errors, roles: '' });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    role_ids: formData.role_ids.filter(id => id !== role.id),
                                                                    primary_role_id: formData.primary_role_id === role.id ? null : formData.primary_role_id
                                                                });
                                                            }
                                                        }}
                                                        className="w-4 h-4 rounded border-slate-300 text-purple-500 focus:ring-purple-500 mt-0.5"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{role.display_name}</p>
                                                            {role.is_system && (
                                                                <span className="text-[8px] font-black text-blue-500 border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase">System</span>
                                                            )}
                                                            {formData.primary_role_id === role.id && (
                                                                <span className="text-[8px] font-black text-purple-500 border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase">Primary</span>
                                                            )}
                                                        </div>
                                                        {role.description && (
                                                            <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                                                        )}
                                                        {formData.role_ids.includes(role.id) && formData.role_ids.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    setFormData({ ...formData, primary_role_id: role.id });
                                                                }}
                                                                className="text-xs text-purple-500 hover:text-purple-600 font-medium mt-2"
                                                            >
                                                                Set as Primary Role
                                                            </button>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.roles ? (
                                            <p className="text-xs text-red-500 mt-3 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {errors.roles}
                                            </p>
                                        ) : formData.role_ids.length === 0 ? (
                                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Select at least one role to grant system access
                                            </p>
                                        ) : null}
                                    </div>
                                </>
                            )}
                        </div>
                    )}


                    {step === 2 && isEditMode && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1">Password Management</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Password changes for existing employees should be done through the user management section for security reasons.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                        Branch <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.branch_id}
                                        onChange={(e) => {
                                            setFormData({ ...formData, branch_id: e.target.value });
                                            if (errors.branch_id) setErrors({ ...errors, branch_id: '' });
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.branch_id ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none appearance-none transition-all`}
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map((b: any) => (
                                            <option key={b.id} value={b.id}>{b.name}</option>
                                        ))}
                                    </select>
                                    {errors.branch_id && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.branch_id}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.department_id}
                                        onChange={(e) => {
                                            setFormData({ ...formData, department_id: e.target.value });
                                            if (errors.department_id) setErrors({ ...errors, department_id: '' });
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.department_id ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none appearance-none transition-all`}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    {errors.department_id && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.department_id}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    Designation <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.designation_id}
                                    onChange={(e) => {
                                        setFormData({ ...formData, designation_id: e.target.value });
                                        if (errors.designation_id) setErrors({ ...errors, designation_id: '' });
                                    }}
                                    className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.designation_id ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none appearance-none transition-all`}
                                >
                                    <option value="">Select Designation</option>
                                    {designations.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                {errors.designation_id && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.designation_id}
                                    </p>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Employment Type</label>
                                    <select
                                        value={formData.employment_type}
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none appearance-none transition-all"
                                    >
                                        <option value="full-time">Full-Time</option>
                                        <option value="part-time">Part-Time</option>
                                        <option value="contract">Contract</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Work Mode</label>
                                    <select
                                        value={formData.work_mode}
                                        onChange={(e) => setFormData({ ...formData, work_mode: e.target.value as any })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none appearance-none transition-all"
                                    >
                                        <option value="onsite">Onsite</option>
                                        <option value="remote">Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}


                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                        Hire Date <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.hire_date}
                                        onChange={(e) => {
                                            setFormData({ ...formData, hire_date: e.target.value });
                                            if (errors.hire_date) setErrors({ ...errors, hire_date: '' });
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.hire_date ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                    />
                                    {errors.hire_date && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.hire_date}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                                        Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.dob}
                                        onChange={(e) => {
                                            setFormData({ ...formData, dob: e.target.value });
                                            if (errors.dob) setErrors({ ...errors, dob: '' });
                                        }}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border ${errors.dob ? 'border-red-500' : 'border-slate-200 dark:border-white/10'} rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all`}
                                    />
                                    {errors.dob && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.dob}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Blood Group</label>
                                    <input
                                        type="text"
                                        value={formData.blood_group}
                                        onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all"
                                        placeholder="A+"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Genotype</label>
                                    <input
                                        type="text"
                                        value={formData.genotype}
                                        onChange={(e) => setFormData({ ...formData, genotype: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all"
                                        placeholder="AA"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Academic Background</label>
                                <textarea
                                    value={formData.academics}
                                    onChange={(e) => setFormData({ ...formData, academics: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-3.5 text-sm text-slate-900 dark:text-white focus:border-purple-500 outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="e.g., MBA Marketing, Yale University"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-black/40 backdrop-blur-md flex justify-between gap-4 relative z-10">
                    <Button
                        variant="ghost"
                        onClick={handlePrevious}
                        disabled={step === 1}
                        className={step === 1 ? 'opacity-0 pointer-events-none' : ''}
                    >
                        ← Previous
                    </Button>
                    <div className="flex gap-4">
                        {step < 4 ? (
                            <Button onClick={handleNext}>
                                Continue →
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                isLoading={createMutation.isPending}
                                className="bg-purple-500 hover:bg-purple-600"
                            >
                                {isEditMode ? 'Update Employee' : 'Create Employee'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddEmployeeModal;
