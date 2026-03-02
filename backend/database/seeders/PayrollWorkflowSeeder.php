<?php

namespace Database\Seeders;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use Illuminate\Database\Seeder;

class PayrollWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        // Create payroll approval workflow
        $workflow = ApprovalWorkflow::create([
            'name' => 'Payroll Run Approval',
            'code' => 'payroll_run_approval',
            'module' => 'payroll',
            'trigger_event' => 'submitted',
            'description' => 'Single-step approval workflow for payroll runs',
            'is_active' => true,
            'is_system' => true,
            'priority' => 1,
        ]);

        // Create single approval step
        ApprovalStep::create([
            'workflow_id' => $workflow->id,
            'step_order' => 1,
            'name' => 'Payroll Approval',
            'approver_type' => 'user', // Approver is specified per run
            'scope_level' => 'all',
            'is_required' => true,
            'allow_parallel' => false,
        ]);

        $this->command->info('Created payroll approval workflow');
    }
}
