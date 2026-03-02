<?php

namespace App\Services;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Support\Facades\DB;

class PerformanceAccessService
{
    /**
     * Get users that can receive evaluation submissions from the given employee
     */
    public function getSubmissionTargets(int $employeeId): array
    {
        $employee = Employee::with(['user.roles', 'department', 'branch'])->findOrFail($employeeId);
        
        $targets = [];
        
        // 1. Direct Manager (if exists)
        if ($employee->manager_id) {
            $manager = User::with(['employee', 'roles'])->find($employee->manager_id);
            if ($manager) {
                $targets[] = [
                    'id' => $manager->id,
                    'name' => $manager->name,
                    'designation' => $this->getUserDesignation($manager),
                    'type' => 'manager',
                    'priority' => 1,
                ];
            }
        }
        
        // 2. Department Head (if different from manager)
        if ($employee->department_id) {
            $deptHeads = User::whereHas('roles', function ($q) {
                $q->where('name', 'department_head');
            })->whereHas('employee', function ($q) use ($employee) {
                $q->where('department_id', $employee->department_id);
            })->with(['employee', 'roles'])->get();
            
            foreach ($deptHeads as $head) {
                if ($head->id !== $employee->manager_id) {
                    $targets[] = [
                        'id' => $head->id,
                        'name' => $head->name,
                        'designation' => $this->getUserDesignation($head),
                        'type' => 'department_head',
                        'priority' => 2,
                    ];
                }
            }
        }
        
        // 3. Branch Manager (if different from above)
        if ($employee->branch_id) {
            $branchManagers = User::whereHas('roles', function ($q) {
                $q->where('name', 'branch_manager');
            })->whereHas('employee', function ($q) use ($employee) {
                $q->where('branch_id', $employee->branch_id);
            })->with(['employee', 'roles'])->get();
            
            foreach ($branchManagers as $manager) {
                if (!in_array($manager->id, array_column($targets, 'id'))) {
                    $targets[] = [
                        'id' => $manager->id,
                        'name' => $manager->name,
                        'designation' => $this->getUserDesignation($manager),
                        'type' => 'branch_manager',
                        'priority' => 3,
                    ];
                }
            }
        }
        
        // 4. HR Admins
        $hrAdmins = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['hr_admin', 'super_admin']);
        })->with(['employee', 'roles'])->get();
        
        foreach ($hrAdmins as $admin) {
            if (!in_array($admin->id, array_column($targets, 'id'))) {
                $targets[] = [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'designation' => $this->getUserDesignation($admin),
                    'type' => 'hr_admin',
                    'priority' => 4,
                ];
            }
        }
        
        // Sort by priority
        usort($targets, fn($a, $b) => $a['priority'] <=> $b['priority']);
        
        return $targets;
    }
    
    /**
     * Check if user can view employee's performance data
     */
    public function canViewEmployeeData(User $user, int $employeeId): bool
    {
        $userRoles = $user->roles->pluck('name')->toArray();
        
        // HR Admins can view all
        if (in_array('hr_admin', $userRoles) || in_array('super_admin', $userRoles)) {
            return true;
        }
        
        // Users can view their own data
        if ($user->employee_id === $employeeId) {
            return true;
        }
        
        $employee = Employee::find($employeeId);
        if (!$employee) {
            return false;
        }
        
        // Managers can view their department's employees
        if (in_array('manager', $userRoles) || in_array('department_head', $userRoles)) {
            return $user->employee->department_id === $employee->department_id;
        }
        
        // Branch managers can view their branch's employees
        if (in_array('branch_manager', $userRoles)) {
            return $user->employee->branch_id === $employee->branch_id;
        }
        
        return false;
    }
    
    /**
     * Get employees that the user can manage/view
     */
    public function getAccessibleEmployees(User $user): array
    {
        $userRoles = $user->roles->pluck('name')->toArray();
        
        // HR Admins can access all employees
        if (in_array('hr_admin', $userRoles) || in_array('super_admin', $userRoles)) {
            return Employee::with(['user', 'department', 'designation'])
                ->where('status', 'active')
                ->get()
                ->toArray();
        }
        
        $query = Employee::with(['user', 'department', 'designation'])
            ->where('status', 'active');
        
        // Managers can access their department
        if (in_array('manager', $userRoles) || in_array('department_head', $userRoles)) {
            $query->where('department_id', $user->employee->department_id);
        }
        // Branch managers can access their branch
        elseif (in_array('branch_manager', $userRoles)) {
            $query->where('branch_id', $user->employee->branch_id);
        }
        // Regular employees can only access themselves
        else {
            $query->where('id', $user->employee_id);
        }
        
        return $query->get()->toArray();
    }
    
    /**
     * Get user's designation for display
     */
    private function getUserDesignation(User $user): string
    {
        $roles = $user->roles->pluck('name')->toArray();
        
        if (in_array('super_admin', $roles)) return 'Super Administrator';
        if (in_array('hr_admin', $roles)) return 'HR Administrator';
        if (in_array('branch_manager', $roles)) return 'Branch Manager';
        if (in_array('department_head', $roles)) return 'Department Head';
        if (in_array('manager', $roles)) return 'Manager';
        
        return $user->employee->designation->name ?? 'Employee';
    }
    
    /**
     * Check if user can approve evaluations
     */
    public function canApproveEvaluations(User $user): bool
    {
        $userRoles = $user->roles->pluck('name')->toArray();
        
        return !empty(array_intersect($userRoles, [
            'hr_admin', 'super_admin', 'manager', 'department_head', 'branch_manager'
        ]));
    }
    
    /**
     * Get pending evaluations for user to review
     */
    public function getPendingEvaluationsForReview(User $user): array
    {
        if (!$this->canApproveEvaluations($user)) {
            return [];
        }
        
        return DB::table('evaluation_responses')
            ->join('employees', 'evaluation_responses.employee_id', '=', 'employees.id')
            ->join('evaluation_templates', 'evaluation_responses.template_id', '=', 'evaluation_templates.id')
            ->leftJoin('departments', 'employees.department_id', '=', 'departments.id')
            ->where('evaluation_responses.submitted_to', $user->id)
            ->whereIn('evaluation_responses.status', ['submitted_to_manager', 'submitted_to_admin'])
            ->select(
                'evaluation_responses.*',
                'employees.first_name',
                'employees.last_name',
                'employees.employee_code',
                'evaluation_templates.title as template_title',
                'departments.name as department_name'
            )
            ->orderBy('evaluation_responses.submitted_at', 'desc')
            ->get()
            ->toArray();
    }
}