<?php

namespace App\Services;

use App\Models\ApprovalWorkflow;
use App\Models\PayrollRun;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

/**
 * PayrollWorkflowResolver - Automatically determines approval workflow
 * 
 * Resolves which workflow and approvers to use based on:
 * - Payroll run scope (all/branch/department)
 * - Total amount thresholds
 * - Organizational hierarchy
 */
class PayrollWorkflowResolver
{
    /**
     * Resolve the appropriate workflow for a payroll run
     * 
     * @param PayrollRun $run
     * @return ApprovalWorkflow
     * @throws \Exception if no workflow found
     */
    public function resolveWorkflow(PayrollRun $run): ApprovalWorkflow
    {
        // Try to find workflow based on scope and amount
        $workflow = ApprovalWorkflow::where('module', 'payroll')
            ->where('trigger_event', 'payroll_run_submit')
            ->where('is_active', true)
            ->orderBy('priority', 'desc')
            ->get()
            ->first(function ($wf) use ($run) {
                return $wf->conditionsMet($run);
            });

        if (!$workflow) {
            // Fallback to default payroll workflow
            $workflow = ApprovalWorkflow::where('code', 'payroll_run_approval')
                ->where('is_active', true)
                ->first();
        }

        if (!$workflow) {
            throw new \Exception('No active payroll approval workflow found. Please configure workflows.');
        }

        return $workflow;
    }

    /**
     * Resolve approvers for a specific step
     * 
     * @param PayrollRun $run
     * @param \App\Models\ApprovalStep $step
     * @return array Array of User IDs
     */
    public function resolveApproversForStep(PayrollRun $run, $step): array
    {
        $preparer = $run->preparedBy;
        $preparerEmployee = $preparer->employeeProfile;

        switch ($step->approver_type) {
            case 'user':
                return $step->approver_user_id ? [$step->approver_user_id] : [];

            case 'role':
                return $this->getUsersByRole($step->approver_role_id, $run, $step->scope_level);

            case 'manager':
                return $this->getManagerApprovers($run, $preparerEmployee);

            case 'department_head':
                return $this->getDepartmentHeadApprovers($run, $preparerEmployee);

            case 'branch_head':
                return $this->getBranchHeadApprovers($run, $preparerEmployee);

            default:
                Log::warning("Unknown approver type: {$step->approver_type}");
                return [];
        }
    }

    /**
     * Get users by role with scope filtering
     */
    private function getUsersByRole(int $roleId, PayrollRun $run, string $scopeLevel): array
    {
        $query = User::whereHas('roles', function ($q) use ($roleId) {
            $q->where('roles.id', $roleId);
        });

        // Apply scope filtering based on run scope
        if ($scopeLevel !== 'all' && $run->scope_type !== 'all') {
            $query->whereHas('employeeProfile', function ($q) use ($run) {
                if ($run->scope_type === 'branch') {
                    $q->where('branch_id', $run->scope_ref_id);
                } elseif ($run->scope_type === 'department') {
                    $q->where('department_id', $run->scope_ref_id);
                }
            });
        }

        return $query->pluck('id')->toArray();
    }

    /**
     * Get manager approvers based on organizational hierarchy
     */
    private function getManagerApprovers(PayrollRun $run, ?Employee $preparerEmployee): array
    {
        if (!$preparerEmployee || !$preparerEmployee->manager_id) {
            // Fallback: get department head
            return $this->getDepartmentHeadApprovers($run, $preparerEmployee);
        }

        $manager = Employee::find($preparerEmployee->manager_id);
        return $manager && $manager->user_id ? [$manager->user_id] : [];
    }

    /**
     * Get department head approvers
     */
    private function getDepartmentHeadApprovers(PayrollRun $run, ?Employee $preparerEmployee): array
    {
        $departmentId = null;

        if ($run->scope_type === 'department') {
            $departmentId = $run->scope_ref_id;
        } elseif ($preparerEmployee) {
            $departmentId = $preparerEmployee->department_id;
        }

        if (!$departmentId) {
            return [];
        }

        return User::whereHas('roles', function ($q) {
            $q->where('name', 'Department Head');
        })
        ->whereHas('employeeProfile', function ($q) use ($departmentId) {
            $q->where('department_id', $departmentId);
        })
        ->pluck('id')
        ->toArray();
    }

    /**
     * Get branch head approvers
     */
    private function getBranchHeadApprovers(PayrollRun $run, ?Employee $preparerEmployee): array
    {
        $branchId = null;

        if ($run->scope_type === 'branch') {
            $branchId = $run->scope_ref_id;
        } elseif ($run->scope_type === 'department' && $run->scope_ref_id) {
            $dept = \App\Models\Department::find($run->scope_ref_id);
            $branchId = $dept?->branch_id;
        } elseif ($preparerEmployee) {
            $branchId = $preparerEmployee->branch_id;
        }

        if (!$branchId) {
            return [];
        }

        return User::whereHas('roles', function ($q) {
            $q->where('name', 'Branch Manager');
        })
        ->whereHas('employeeProfile', function ($q) use ($branchId) {
            $q->where('branch_id', $branchId);
        })
        ->pluck('id')
        ->toArray();
    }

    /**
     * Get the first approver for a workflow
     * 
     * @param ApprovalWorkflow $workflow
     * @param PayrollRun $run
     * @return int|null User ID of first approver
     */
    public function getFirstApprover(ApprovalWorkflow $workflow, PayrollRun $run): ?int
    {
        $firstStep = $workflow->steps()->where('step_order', 1)->first();
        
        if (!$firstStep) {
            return null;
        }

        $approvers = $this->resolveApproversForStep($run, $firstStep);
        
        return !empty($approvers) ? $approvers[0] : null;
    }
}
