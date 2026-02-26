<?php

namespace App\Http\Controllers;

use App\Models\ApprovalWorkflow;
use App\Models\ApprovalStep;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkflowController extends Controller
{
    use ApiResponse;

    /**
     * Get all workflows
     */
    public function index(Request $request)
    {
        $query = ApprovalWorkflow::with(['steps']);

        if ($request->has('module')) {
            $query->where('module', $request->module);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $workflows = $query->orderBy('priority', 'desc')
            ->paginate($request->get('per_page', 20));

        return $this->success($workflows);
    }

    /**
     * Get single workflow
     */
    public function show($id)
    {
        $workflow = ApprovalWorkflow::with(['steps.approverRole', 'steps.approverUser'])
            ->findOrFail($id);
        return $this->success($workflow);
    }

    /**
     * Create workflow
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:approval_workflows,code|max:255',
            'module' => 'required|string|max:255',
            'trigger_event' => 'required|string|max:255',
            'description' => 'nullable|string',
            'conditions' => 'nullable|array',
            'is_active' => 'boolean',
            'priority' => 'integer',
            'steps' => 'required|array|min:1',
            'steps.*.step_order' => 'required|integer',
            'steps.*.name' => 'required|string|max:255',
            'steps.*.approver_type' => 'required|in:role,user,manager,department_head,branch_head',
            'steps.*.approver_role_id' => 'nullable|exists:roles,id',
            'steps.*.approver_user_id' => 'nullable|exists:users,id',
            'steps.*.scope_level' => 'required|in:all,branch,department,team,self',
            'steps.*.is_required' => 'boolean',
            'steps.*.allow_parallel' => 'boolean',
            'steps.*.timeout_hours' => 'nullable|integer',
            'steps.*.conditions' => 'nullable|array',
        ]);

        try {
            $workflow = DB::transaction(function () use ($validated) {
                $steps = $validated['steps'];
                unset($validated['steps']);

                $workflow = ApprovalWorkflow::create($validated);

                foreach ($steps as $stepData) {
                    $stepData['workflow_id'] = $workflow->id;
                    ApprovalStep::create($stepData);
                }

                return $workflow->load(['steps']);
            });

            return $this->success($workflow, 'Workflow created successfully', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to create workflow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update workflow
     */
    public function update(Request $request, $id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);

        if ($workflow->is_system) {
            return $this->error('System workflows cannot be modified', 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'sometimes|string|unique:approval_workflows,code,' . $id . '|max:255',
            'module' => 'sometimes|string|max:255',
            'trigger_event' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'conditions' => 'nullable|array',
            'is_active' => 'boolean',
            'priority' => 'integer',
        ]);

        try {
            $workflow->update($validated);
            return $this->success($workflow->fresh(['steps']), 'Workflow updated successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to update workflow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Delete workflow
     */
    public function destroy($id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);

        if ($workflow->is_system) {
            return $this->error('System workflows cannot be deleted', 403);
        }

        if ($workflow->requests()->where('status', 'pending')->count() > 0) {
            return $this->error('Cannot delete workflow with pending requests', 400);
        }

        try {
            $workflow->delete();
            return $this->success(null, 'Workflow deleted successfully');
        } catch (\Exception $e) {
            return $this->error('Failed to delete workflow: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update workflow steps
     */
    public function updateSteps(Request $request, $id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);

        $validated = $request->validate([
            'steps' => 'required|array|min:1',
            'steps.*.id' => 'nullable|exists:approval_steps,id',
            'steps.*.step_order' => 'required|integer',
            'steps.*.name' => 'required|string|max:255',
            'steps.*.approver_type' => 'required|in:role,user,manager,department_head,branch_head',
            'steps.*.approver_role_id' => 'nullable|exists:roles,id',
            'steps.*.approver_user_id' => 'nullable|exists:users,id',
            'steps.*.scope_level' => 'required|in:all,branch,department,team,self',
            'steps.*.is_required' => 'boolean',
            'steps.*.allow_parallel' => 'boolean',
            'steps.*.timeout_hours' => 'nullable|integer',
            'steps.*.conditions' => 'nullable|array',
        ]);

        try {
            DB::transaction(function () use ($workflow, $validated) {
                // Delete existing steps
                $workflow->steps()->delete();

                // Create new steps
                foreach ($validated['steps'] as $stepData) {
                    unset($stepData['id']);
                    $stepData['workflow_id'] = $workflow->id;
                    ApprovalStep::create($stepData);
                }
            });

            return $this->success(
                $workflow->fresh(['steps']),
                'Workflow steps updated successfully'
            );
        } catch (\Exception $e) {
            return $this->error('Failed to update steps: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Toggle workflow active status
     */
    public function toggleActive($id)
    {
        $workflow = ApprovalWorkflow::findOrFail($id);
        $workflow->update(['is_active' => !$workflow->is_active]);

        return $this->success(
            $workflow,
            'Workflow ' . ($workflow->is_active ? 'activated' : 'deactivated')
        );
    }
}
