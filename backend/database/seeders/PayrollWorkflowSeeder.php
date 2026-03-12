<?php

namespace Database\Seeders;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use Illuminate\Database\Seeder;

class PayrollWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        // Create or update payroll approval workflow
        $workflow = ApprovalWorkflow::updateOrCreate(
            ['code' => 'payroll_run_approval'],
            [
                'name' => 'Payroll Run Approval',
                'code' => 'payroll_run_approval',
                'module' => 'payroll',
                'trigger_event' => 'submitted',
                'description' => 'Single-step approval workflow for payroll runs',
                'is_active' => true,
                'is_system' => true,
                'priority' => 1,
            ]
        );

        // Create or update single approval step
        ApprovalStep::updateOrCreate(
            [
                'workflow_id' => $workflow->id,
                'step_order' => 1
            ],
            [
                'workflow_id' => $workflow->id,
                'step_order' => 1,
                'name' => 'Payroll Approval',
                'approver_type' => 'user', // Approver is specified per run
                'scope_level' => 'all',
                'is_required' => true,
                'allow_parallel' => false,
            ]
        );

        $this->command->info('Seeded payroll approval workflow (created or updated)');
    }
}
