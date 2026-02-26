<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class EmployeeService
{
    /**
     * Generate unique employee code with format: 4-digit numeric code
     * Example: 1001, 1002, 1003, etc.
     * This format matches biometric device employee ID format
     */
    public function generateEmployeeCode(int $branchId): string
    {
        return DB::transaction(function () use ($branchId) {
            // Get the last employee code (numeric only)
            $lastEmployee = Employee::withTrashed()
                ->whereRaw('employee_code REGEXP \'^[0-9]+$\'')
                ->orderByRaw('CAST(employee_code AS UNSIGNED) DESC')
                ->lockForUpdate()
                ->first();

            if ($lastEmployee) {
                $lastCode = (int) $lastEmployee->employee_code;
                $nextCode = $lastCode + 1;
            } else {
                // Start from 1001 for first employee
                $nextCode = 1001;
            }

            // Format as 4-digit zero-padded number
            $employeeCode = sprintf('%04d', $nextCode);

            return $employeeCode;
        });
    }

    /**
     * Create employee with user account and login credentials
     */
    public function createEmployee(array $data): Employee
    {
        return DB::transaction(function () use ($data) {
            // Generate employee code if not provided
            if (!isset($data['employee_code'])) {
                $data['employee_code'] = $this->generateEmployeeCode($data['branch_id']);
            }

            // Extract role assignment data
            $roleIds = $data['role_ids'] ?? [];
            $primaryRoleId = $data['primary_role_id'] ?? null;
            unset($data['role_ids'], $data['primary_role_id']);

            // Create user account if password is provided
            $user = null;
            if (isset($data['password']) && !empty($data['password'])) {
                $user = User::create([
                    'name' => $data['first_name'] . ' ' . $data['last_name'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'status' => 'active',
                    'branch_id' => $data['branch_id'] ?? null,
                    'department_id' => $data['department_id'] ?? null,
                    'manager_id' => $data['manager_id'] ?? null,
                    'primary_role_id' => $primaryRoleId,
                ]);

                // Assign roles if provided
                if (!empty($roleIds)) {
                    $user->syncRoles($roleIds);
                } else {
                    // Assign default employee role if no roles specified
                    $employeeRole = \App\Models\Role::where('name', 'employee')->first();
                    if ($employeeRole) {
                        $user->assignRole($employeeRole);
                    }
                }

                $data['user_id'] = $user->id;
            }

            // Remove password and confirmation from employee data
            unset($data['password'], $data['password_confirmation'], $data['create_user_account']);

            // Set password change requirement
            if (!isset($data['password_change_required'])) {
                $data['password_change_required'] = true;
            }

            $employee = Employee::create($data);

            // Log audit trail
            if (class_exists(\App\Services\AuditLogger::class)) {
                app(\App\Services\AuditLogger::class)->log(
                    'employee_created',
                    $employee,
                    null,
                    array_merge($employee->toArray(), [
                        'user_account_created' => $user !== null,
                        'employee_code' => $employee->employee_code,
                    ])
                );
            }

            return $employee->load(['branch', 'department', 'designation', 'manager', 'user']);
        });
    }

    public function updateEmployee(Employee $employee, array $data): Employee
    {
        return DB::transaction(function () use ($employee, $data) {
            $oldData = $employee->toArray();
            $employee->update($data);

            // Log audit trail
            if (class_exists(\App\Services\AuditLogger::class)) {
                app(\App\Services\AuditLogger::class)->log(
                    'employee_updated',
                    Employee::class,
                    $employee->id,
                    $oldData,
                    $employee->fresh()->toArray()
                );
            }

            return $employee->fresh(['branch', 'department', 'designation', 'manager']);
        });
    }

    public function deleteEmployee(Employee $employee): bool
    {
        return DB::transaction(function () use ($employee) {
            $oldData = $employee->toArray();
            $result = $employee->delete();

            // Log audit trail
            if (class_exists(\App\Services\AuditLogger::class)) {
                app(\App\Services\AuditLogger::class)->log(
                    'employee_deleted',
                    Employee::class,
                    $employee->id,
                    $oldData,
                    null
                );
            }

            return $result;
        });
    }

    public function getMetrics(): array
    {
        $stats = Employee::selectRaw("
            COUNT(*) as total_employees,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
            SUM(CASE WHEN status = 'probation' THEN 1 ELSE 0 END) as probation_count,
            SUM(CASE WHEN hire_date >= ? AND hire_date <= ? THEN 1 ELSE 0 END) as new_hires_this_month
        ", [now()->startOfMonth(), now()->endOfMonth()])->first();

        return [
            'total_employees' => (int) $stats->total_employees,
            'active_employees' => (int) $stats->active_employees,
            'on_leave_today' => 0, // This would integrate with leave management
            'new_hires_this_month' => (int) $stats->new_hires_this_month,
            'probation_count' => (int) $stats->probation_count,
            'by_employment_type' => Employee::select('employment_type', DB::raw('count(*) as count'))
                ->groupBy('employment_type')
                ->pluck('count', 'employment_type'),
            'by_work_mode' => Employee::select('work_mode', DB::raw('count(*) as count'))
                ->groupBy('work_mode')
                ->pluck('count', 'work_mode'),
        ];
    }
}
