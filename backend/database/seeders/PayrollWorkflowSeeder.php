<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use App\Models\Role;

class PayrollWorkflowSeeder extends Seeder
{
    /**
     * Seed payroll approval workflows
     * 
     * Creates multiple workflows for different scenarios:
     * 1. Department payroll (< $50k) - 2 steps
     * 2. Branch payroll (< $100k) - 3 steps
     * 3. Company-wide payroll (any amount) - 4 steps
     * 
     * Uses actual roles from RolePermissionSeeder:
     * - super_admin, ceo, hr_manager, branch_manager, department_head
     */
    public function run(): void
    {
        // Get roles - use actual role names from RolePermissionSeeder
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $ceoRole = Role::where('name', 'ceo')->first();
        $hrManagerRole = Role::where('name', 'hr_manager')->first();
        $branchManagerRole = Role::where('name', 'branch_manager')->first();
        $deptHeadRole = Role::where('name', 'department_head')->first();

        if (!$hrManagerRole) {
            $this->command->warn('⚠️  HR Manager role not found. Please run RolePermissionSeeder first.');
            return;
        }

        // Workflow 1: Department Payroll (Simple - 2 steps)
        $deptWorkflow = ApprovalWorkflow::updateOrCreate(
            ['code' => 'payroll_dept_simple'],
            [
                'name' => 'Department Payroll Approval',
                'module' => 'payroll',
                'trigger_event' => 'payroll_run_submit',
                'description' => 'Approval workflow for department-level payroll runs under $50,000',
                'conditions' => [
                    'scope_type' => ['equals' => 'department'],
                    'total_net' => ['max' => 50000],
                ],
                'is_active' => true,
                'is_system' => true,
                'priority' => 10,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $deptWorkflow->id,
                'step_order' => 1,
            ],
            [
                'name' => 'Department Head Review',
                'approver_type' => 'department_head',
                'approver_role_id' => $deptHeadRole?->id,
                'scope_level' => 'department',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 24,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $deptWorkflow->id,
                'step_order' => 2,
            ],
            [
                'name' => 'HR Manager Final Approval',
                'approver_type' => 'role',
                'approver_role_id' => $hrManagerRole?->id,
                'scope_level' => 'all',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 48,
            ]
        );

        // Workflow 2: Branch Payroll (Medium - 3 steps)
        $branchWorkflow = ApprovalWorkflow::updateOrCreate(
            ['code' => 'payroll_branch_standard'],
            [
                'name' => 'Branch Payroll Approval',
                'module' => 'payroll',
                'trigger_event' => 'payroll_run_submit',
                'description' => 'Approval workflow for branch-level payroll runs under $100,000',
                'conditions' => [
                    'scope_type' => ['equals' => 'branch'],
                    'total_net' => ['max' => 100000],
                ],
                'is_active' => true,
                'is_system' => true,
                'priority' => 20,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $branchWorkflow->id,
                'step_order' => 1,
            ],
            [
                'name' => 'Branch Manager Review',
                'approver_type' => 'branch_head',
                'approver_role_id' => $branchManagerRole?->id,
                'scope_level' => 'branch',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 24,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $branchWorkflow->id,
                'step_order' => 2,
            ],
            [
                'name' => 'HR Manager Review',
                'approver_type' => 'role',
                'approver_role_id' => $hrManagerRole?->id,
                'scope_level' => 'all',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 48,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $branchWorkflow->id,
                'step_order' => 3,
            ],
            [
                'name' => 'CEO Final Approval',
                'approver_type' => 'role',
                'approver_role_id' => $ceoRole?->id ?? $superAdminRole?->id,
                'scope_level' => 'all',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 72,
            ]
        );

        // Workflow 3: Company-Wide Payroll (Complex - 4 steps)
        $companyWorkflow = ApprovalWorkflow::updateOrCreate(
            ['code' => 'payroll_run_approval'], // Default workflow code
            [
                'name' => 'Company-Wide Payroll Approval',
                'module' => 'payroll',
                'trigger_event' => 'payroll_run_submit',
                'description' => 'Approval workflow for company-wide payroll runs (all amounts)',
                'conditions' => [], // No conditions - catches all
                'is_active' => true,
                'is_system' => true,
                'priority' => 5, // Lower priority - fallback
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $companyWorkflow->id,
                'step_order' => 1,
            ],
            [
                'name' => 'Manager Review',
                'approver_type' => 'manager',
                'scope_level' => 'team',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 24,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $companyWorkflow->id,
                'step_order' => 2,
            ],
            [
                'name' => 'HR Manager Review',
                'approver_type' => 'role',
                'approver_role_id' => $hrManagerRole?->id,
                'scope_level' => 'all',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 48,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $companyWorkflow->id,
                'step_order' => 3,
            ],
            [
                'name' => 'CEO Review',
                'approver_type' => 'role',
                'approver_role_id' => $ceoRole?->id ?? $superAdminRole?->id,
                'scope_level' => 'all',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 72,
            ]
        );

        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $companyWorkflow->id,
                'step_order' => 4,
            ],
            [
                'name' => 'Super Admin Final Approval',
                'approver_type' => 'role',
                'approver_role_id' => $superAdminRole?->id,
                'scope_level' => 'all',
                'is_required' => true,
                'allow_parallel' => false,
                'timeout_hours' => 96,
            ]
        );

        $this->command->info('✓ Payroll approval workflows created successfully');
        $this->command->info("  - Department Payroll: 2 steps (Dept Head → HR Manager)");
        $this->command->info("  - Branch Payroll: 3 steps (Branch Mgr → HR Manager → CEO)");
        $this->command->info("  - Company-Wide: 4 steps (Manager → HR Manager → CEO → Super Admin)");
    }
}
