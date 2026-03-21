<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Traits\ApiResponse;

class SystemResetController extends Controller
{
    use ApiResponse;

    /**
     * Wipe all transactional data and return the system to a clean state.
     * Restricted to super_admin only. Requires typed confirmation.
     */
    public function wipe(Request $request)
    {
        $user = $request->user();

        // Double-check: must be super_admin
        if (!$user->hasRole('super_admin') && $user->role !== 'super_admin') {
            return $this->error('Only the Super Administrator can perform a system reset.', 403);
        }

        $request->validate([
            'confirmation' => 'required|string',
        ]);

        if ($request->confirmation !== 'WIPE EVERYTHING') {
            return $this->error('Confirmation text did not match. Reset aborted.', 422);
        }

        $adminId = $user->id;
        $adminData = [
            'name'     => $user->name,
            'email'    => $user->email,
            'password' => $user->password,
            'role'     => 'super_admin',
            'status'   => 'active',
        ];

        $wipeOrder = [
            'personal_access_tokens',
            'notifications',
            'approval_actions',
            'approval_requests',
            'approval_steps',
            'approval_workflows',
            'payroll_run_employees',
            'payroll_items',
            'payroll_runs',
            'payroll_periods',
            'performance_submissions',
            'performance_configs',
            'attendance_corrections',
            'attendance_records',
            'attendance_logs',
            'leave_requests',
            'leave_balances',
            'leave_types',
            'employee_salaries',
            'salary_structures',
            'onboarding_cases',
            'chat_messages',
            'chat_channel_members',
            'chat_channels',
            'memo_signatures',
            'memo_attachments',
            'memo_folders',
            'memos',
            'interviews',
            'applications',
            'candidates',
            'job_openings',
            'biometric_devices',
            'model_has_roles',
            'employees',
            'users',
            'departments',
            'designations',
            'branches',
            'workplaces',
        ];

        try {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');

            foreach ($wipeOrder as $table) {
                if (DB::getSchemaBuilder()->hasTable($table)) {
                    DB::table($table)->truncate();
                }
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            // Restore the super_admin account
            $admin = User::create($adminData);
            $superAdminRole = \App\Models\Role::where('name', 'super_admin')->first();
            if ($superAdminRole) {
                $admin->assignRole($superAdminRole);
                $admin->update(['primary_role_id' => $superAdminRole->id]);
            }

            // Flush all caches
            try { Cache::flush(); } catch (\Exception $e) {}

            Log::warning('System reset performed', [
                'performed_by' => $adminData['email'],
                'at'           => now()->toIso8601String(),
            ]);

            // Issue a fresh token for the restored admin so they stay logged in
            $newToken = $admin->createToken('post-reset-session')->plainTextToken;

            return $this->success([
                'token' => $newToken,
            ], 'System reset complete. All data has been wiped. You have been re-authenticated.');

        } catch (\Exception $e) {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
            Log::error('System reset failed: ' . $e->getMessage());
            return $this->error('Reset failed: ' . $e->getMessage(), 500);
        }
    }
}
