<?php

namespace App\Http\Controllers;

use App\Services\OnboardingService;
use App\Http\Resources\OnboardingCaseResource;
use App\Http\Resources\OnboardingTemplateResource;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class OnboardingController extends Controller
{
    use ApiResponse;

    protected $onboardingService;

    public function __construct(OnboardingService $onboardingService)
    {
        $this->onboardingService = $onboardingService;
    }

    // Cases
    public function cases(Request $request)
    {
        $filters = $request->only(['status', 'branch_id', 'department_id']);
        $perPage = $request->get('per_page', 20);

        $cases = $this->onboardingService->getCases($filters, $perPage);

        return $this->success([
            'data' => OnboardingCaseResource::collection($cases->items()),
            'meta' => [
                'current_page' => $cases->currentPage(),
                'last_page' => $cases->lastPage(),
                'per_page' => $cases->perPage(),
                'total' => $cases->total(),
            ]
        ]);
    }

    public function showCase($id)
    {
        $case = $this->onboardingService->getCaseById($id);
        return $this->success(new OnboardingCaseResource($case));
    }

    public function createCase(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'template_id' => 'nullable|exists:onboarding_templates,id',
            'start_date' => 'required|date',
        ]);

        $case = $this->onboardingService->createCase(
            $validated['employee_id'],
            $validated['template_id'] ?? null,
            $validated['start_date']
        );

        return $this->success(new OnboardingCaseResource($case), 'Onboarding case created', 201);
    }

    public function updateTask(Request $request, $taskId)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:todo,in_progress,blocked,done',
            'owner_user_id' => 'sometimes|nullable|exists:users,id',
            'due_date' => 'sometimes|nullable|date',
            'priority' => 'sometimes|in:low,medium,high',
        ]);

        $task = $this->onboardingService->updateTask($taskId, $validated);
        return $this->success($task, 'Task updated successfully');
    }

    public function completeCase($id)
    {
        $case = $this->onboardingService->completeCase($id);
        return $this->success(new OnboardingCaseResource($case), 'Onboarding completed');
    }

    // Templates
    public function templates()
    {
        $templates = $this->onboardingService->getTemplates();
        return $this->success(OnboardingTemplateResource::collection($templates));
    }

    public function createTemplate(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'tasks' => 'required|array',
            'tasks.*.title' => 'required|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.default_owner_role' => 'nullable|string',
            'tasks.*.offset_days' => 'nullable|integer',
            'tasks.*.required' => 'nullable|boolean',
        ]);

        $template = $this->onboardingService->createTemplate($validated);
        return $this->success(new OnboardingTemplateResource($template), 'Template created', 201);
    }

    // Employee onboarding tab
    public function employeeOnboarding($employeeId)
    {
        $case = \App\Models\OnboardingCase::with(['tasks', 'template'])
            ->where('employee_id', $employeeId)
            ->first();

        if (!$case) {
            return $this->success(null);
        }

        return $this->success(new OnboardingCaseResource($case));
    }
}
