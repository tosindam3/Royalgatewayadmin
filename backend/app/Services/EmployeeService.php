<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
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
        // NOTE: Always call this from within an outer DB::transaction (e.g. createEmployee).
        // Do NOT wrap in its own transaction — nested transactions with lockForUpdate
        // cause a PDO conflict on MySQL, which was causing the 500 error on employee creation.
        $lastEmployee = Employee::withTrashed()
            ->whereRaw("employee_code REGEXP '^[0-9]+'")
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
        return sprintf('%04d', $nextCode);
    }

    /**
     * Create employee with user account and login credentials
     */
    public function createEmployee(array $data): Employee
    {
        return DB::transaction(function () use ($data) {
            // Sanitize empty strings to null for nullable fields
            $nullableFields = ['manager_id', 'blood_group', 'genotype', 'academics'];
            foreach ($nullableFields as $field) {
                if (isset($data[$field]) && $data[$field] === '') {
                    $data[$field] = null;
                }
            }

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
                    'name'            => $data['first_name'] . ' ' . $data['last_name'],
                    'email'           => $data['email'],
                    'password'        => Hash::make($data['password']),
                    'status'          => 'active',
                    'branch_id'       => $data['branch_id'] ?? null,
                    'department_id'   => $data['department_id'] ?? null,
                    'manager_id'      => $data['manager_id'] ?? null,
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

            // Log audit trail (wrapped in try/catch so a logging failure never rolls back the creation)
            try {
                if (class_exists(\App\Services\AuditLogger::class)) {
                    \App\Services\AuditLogger::log(
                        'employee_created',
                        $employee,
                        null,
                        array_merge($employee->toArray(), [
                            'user_account_created' => $user !== null,
                            'employee_code'        => $employee->employee_code,
                        ])
                    );
                }
            } catch (\Exception $auditEx) {
                Log::error('Audit log failed for employee_created: ' . $auditEx->getMessage());
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

    public function updateAvatar(Employee $employee, $file): Employee
    {
        return DB::transaction(function () use ($employee, $file) {
            $oldData = $employee->toArray();

            // Delete old avatar if exists and not default
            if ($employee->avatar && !str_contains($employee->avatar, 'default')) {
                $oldPath = public_path($employee->avatar);
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            // Store new avatar
            $filename = time() . '_' . $employee->id . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('avatars'), $filename);
            $path = '/avatars/' . $filename;

            $employee->update(['avatar' => $path]);

            // Sync with User account if exists
            if ($employee->user) {
                $employee->user->update(['avatar' => $path]);
            }

            // Log audit trail
            if (class_exists(\App\Services\AuditLogger::class)) {
                app(\App\Services\AuditLogger::class)->log(
                    'employee_avatar_updated',
                    Employee::class,
                    $employee->id,
                    $oldData,
                    $employee->fresh()->toArray()
                );
            }

            return $employee->fresh(['branch', 'department', 'designation', 'manager', 'user']);
        });
    }

    /**
     * Soft-delete an employee while preserving all historical records.
     *
     * Enterprise approach:
     * - Employee row is soft-deleted (deleted_at set) — invisible to all active queries
     *   but retained for audit, payroll history, and performance records.
     * - Linked user account is disabled (status = 'inactive') and all active tokens
     *   are revoked so they cannot log in.
     * - Subordinates have their manager_id nullified so they are not orphaned.
     * - All historical data (attendance, payroll, performance) is intentionally kept.
     */
    public function deleteEmployee(Employee $employee): bool
    {
        // Service-level protection for Superadmin
        if ($employee->user && $employee->user->hasRole('super_admin')) {
            throw new \Exception('The Super Administrator profile is protected and cannot be deleted.');
        }

        return DB::transaction(function () use ($employee) {
            $employeeId = $employee->id;
            $userId     = $employee->user_id;
            $oldData    = $employee->toArray();

            // Nullify manager references so subordinates are not orphaned
            DB::table('employees')->where('manager_id', $employeeId)->update(['manager_id' => null]);
            DB::table('users')->where('manager_id', $employeeId)->update(['manager_id' => null]);

            // Soft-delete the employee — historical records remain intact and linked
            $employee->delete();

            // Disable the linked user account and revoke all active sessions
            if ($userId) {
                User::where('id', $userId)->update(['status' => 'inactive']);

                DB::table('personal_access_tokens')
                    ->where('tokenable_type', User::class)
                    ->where('tokenable_id', $userId)
                    ->delete();
            }

            // Log audit trail
            try {
                if (class_exists(\App\Services\AuditLogger::class)) {
                    app(\App\Services\AuditLogger::class)->log(
                        'employee_deleted',
                        Employee::class,
                        $employeeId,
                        $oldData,
                        null
                    );
                }
            } catch (\Exception $e) {
                Log::error('Audit log failed for employee_deleted: ' . $e->getMessage());
            }

            return true;
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
            'total_employees'      => (int) $stats->total_employees,
            'active_employees'     => (int) $stats->active_employees,
            'on_leave_today'       => 0,
            'new_hires_this_month' => (int) $stats->new_hires_this_month,
            'probation_count'      => (int) $stats->probation_count,
            'by_employment_type'   => Employee::select('employment_type', DB::raw('count(*) as count'))
                ->groupBy('employment_type')
                ->pluck('count', 'employment_type'),
            'by_work_mode'         => Employee::select('work_mode', DB::raw('count(*) as count'))
                ->groupBy('work_mode')
                ->pluck('count', 'work_mode'),
        ];
    }
}
