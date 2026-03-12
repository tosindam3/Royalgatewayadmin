<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Branch;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Role;

class AdminEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        echo "🔧 Creating admin employee profile...\n";

        // Find the admin user
        $user = User::where('email', 'admin@hr360.com')->first();
        if (!$user) {
            echo "❌ Admin user not found!\n";
            return;
        }

        echo "✅ Found user: " . $user->name . "\n";

        // Check if employee profile already exists
        $employee = Employee::where('email', 'admin@hr360.com')->first();
        if ($employee) {
            echo "ℹ️  Employee profile already exists: " . $employee->first_name . " " . $employee->last_name . "\n";
            
            // Link user to employee if not already linked
            if (!$employee->user_id) {
                $employee->update(['user_id' => $user->id]);
                echo "✅ Linked user to existing employee profile\n";
            }
        } else {
            // Get required references
            $branch = Branch::first();
            $department = Department::first();
            $designation = Designation::first();
            
            if (!$branch || !$department || !$designation) {
                echo "❌ Missing required data - Branch: " . ($branch ? 'OK' : 'MISSING') . 
                     ", Department: " . ($department ? 'OK' : 'MISSING') . 
                     ", Designation: " . ($designation ? 'OK' : 'MISSING') . "\n";
                return;
            }
            
            // Create employee profile
            $employee = Employee::create([
                'employee_code' => 'EMP-ADMIN',
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'email' => 'admin@hr360.com',
                'phone' => '+1-555-0001',
                'branch_id' => $branch->id,
                'department_id' => $department->id,
                'designation_id' => $designation->id,
                'employment_type' => 'full-time',
                'work_mode' => 'hybrid',
                'status' => 'active',
                'hire_date' => '2024-01-01',
                'dob' => '1985-01-01',
                'blood_group' => 'O+',
                'genotype' => 'AA',
                'academics' => 'MBA, Computer Science',
                'user_id' => $user->id
            ]);
            
            echo "✅ Employee profile created: " . $employee->first_name . " " . $employee->last_name . " (" . $employee->employee_code . ")\n";
        }

        // Assign super_admin role
        $role = Role::where('name', 'super_admin')->first();
        if (!$role) {
            echo "❌ Super admin role not found!\n";
            return;
        }

        if (!$user->hasRole('super_admin')) {
            $user->assignRole($role);
            echo "✅ Super admin role assigned to user\n";
        } else {
            echo "ℹ️  User already has super admin role\n";
        }

        echo "🎉 Admin setup completed successfully!\n";
        echo "👤 Admin User: admin@hr360.com is linked to Employee: " . $employee->first_name . " " . $employee->last_name . " (" . $employee->employee_code . ")\n";
    }
}