<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Designation;
use App\Models\Role;
use App\Models\Branch;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

class SuperAdminHardenSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            echo "🛡️ Starting Superadmin Hardening...\n";

            // 1. Ensure "System Administrator" designation exists
            $designation = Designation::firstOrCreate(
                ['code' => 'DES-SYS-ADMIN'],
                ['name' => 'System Administrator']
            );
            echo "✅ Designation: System Administrator ensured.\n";

            // 2. Identify target developer account
            $developerEmail = 'admin@hr360.com';
            $user = User::where('email', $developerEmail)->first();

            if (!$user) {
                echo "❌ Developer account not found: $developerEmail\n";
                return;
            }

            // 3. Ensure super_admin role exists
            $superRole = Role::where('name', 'super_admin')->first();
            if (!$superRole) {
                echo "❌ super_admin role not found! Please run RolePermissionSeeder first.\n";
                return;
            }

            // 4. Set developer as the SOLE superadmin
            // Use primary_role_id for the developer
            $user->update(['primary_role_id' => $superRole->id]);
            
            // Remove super_admin role from ALL other users (pivot AND primary_role_id)
            User::where('id', '!=', $user->id)
                ->where('primary_role_id', $superRole->id)
                ->update(['primary_role_id' => null]);
            
            DB::table('user_roles')
                ->where('role_id', $superRole->id)
                ->where('user_id', '!=', $user->id)
                ->delete();

            echo "✅ Developer set as the sole superadmin.\n";

            // 5. Ensure Employee Profile for developer as "System Administrator"
            $employee = Employee::where('email', $developerEmail)->first();
            
            $branch = Branch::first();
            $department = Department::first();

            if ($employee) {
                $employee->update([
                    'first_name' => 'System',
                    'last_name' => 'Administrator',
                    'designation_id' => $designation->id,
                    'user_id' => $user->id,
                ]);
                echo "✅ Existing employee profile updated to System Administrator.\n";
            } else {
                Employee::create([
                    'employee_code' => 'ADMIN-001',
                    'first_name' => 'System',
                    'last_name' => 'Administrator',
                    'email' => $developerEmail,
                    'phone' => '+1-000-000-0000',
                    'branch_id' => $branch?->id ?? 1,
                    'department_id' => $department?->id ?? 1,
                    'designation_id' => $designation->id,
                    'employment_type' => 'full-time',
                    'work_mode' => 'onsite',
                    'status' => 'active',
                    'hire_date' => now()->toDateString(),
                    'dob' => '1980-01-01',
                    'user_id' => $user->id,
                ]);
                echo "✅ New employee profile created as System Administrator.\n";
            }

            echo "🎉 Superadmin Hardening Completed.\n";
        });
    }
}
