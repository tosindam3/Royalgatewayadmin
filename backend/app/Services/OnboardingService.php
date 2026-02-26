<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\OnboardingCase;
use App\Models\OnboardingTemplate;
use App\Models\OnboardingTask;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class OnboardingService
{
    public function getCases(array $filters, int $perPage = 20)
    {
        $query = OnboardingCase::query()
            ->with([
                'employee:id,employee_code,first_name,last_name,designation_id,department_id,branch_id',
                'employee.designation:id,name',
                'employee.department:id,name',
                'employee.branch:id,name',
                'template:id,name',
            ]);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['branch_id'])) {
            $query->whereHas('employee', function ($q) use ($filters) {
                $q->where('branch_id', $filters['branch_id']);
            });
        }

        if (!empty($filters['department_id'])) {
            $query->whereHas('employee', function ($q) use ($filters) {
                $q->where('department_id', $filters['department_id']);
            });
        }

        return $query->orderBy('created_at', 'desc')->paginate(min($perPage, 100));
    }

    public function getCaseById(int $id)
    {
        return OnboardingCase::with([
            'employee',
            'template',
            'tasks.owner:id,name',
            'tasks.comments.user:id,name',
            'tasks.attachments',
        ])->findOrFail($id);
    }

    public function autoCreateCase(Employee $employee)
    {
        // Find matching template
        $template = OnboardingTemplate::active()
            ->where(function ($q) use ($employee) {
                $q->where('department_id', $employee->department_id)
                  ->orWhere('designation_id', $employee->designation_id)
                  ->orWhereNull('department_id');
            })
            ->first();

        if (!$template) {
            $template = OnboardingTemplate::active()->whereNull('department_id')->first();
        }

        return $this->createCase($employee->id, $template?->id, $employee->hire_date);
    }

    public function createCase(int $employeeId, ?int $templateId, $startDate)
    {
        DB::beginTransaction();
        try {
            $case = OnboardingCase::create([
                'employee_id' => $employeeId,
                'template_id' => $templateId,
                'start_date' => $startDate,
                'status' => 'ongoing',
                'completion_percent' => 0,
                'created_by' => auth()->id(),
            ]);

            // Create tasks from template
            if ($templateId) {
                $template = OnboardingTemplate::with('tasks')->find($templateId);
                foreach ($template->tasks as $templateTask) {
                    OnboardingTask::create([
                        'case_id' => $case->id,
                        'title' => $templateTask->title,
                        'description' => $templateTask->description,
                        'owner_role' => $templateTask->default_owner_role,
                        'due_date' => now()->addDays($templateTask->offset_days),
                        'status' => 'todo',
                        'priority' => 'medium',
                        'required' => $templateTask->required,
                    ]);
                }
            }

            DB::commit();
            return $case->load('tasks');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateTask(int $taskId, array $data)
    {
        $task = OnboardingTask::findOrFail($taskId);
        $task->update($data);

        // Update case completion percentage
        $task->case->updateCompletionPercent();

        return $task;
    }

    public function completeCase(int $caseId)
    {
        $case = OnboardingCase::findOrFail($caseId);
        $case->update([
            'status' => 'completed',
            'completion_percent' => 100,
        ]);

        return $case;
    }

    public function getTemplates()
    {
        return Cache::remember('onboarding_templates', 86400, function () {
            return OnboardingTemplate::active()
                ->with(['department:id,name', 'designation:id,name'])
                ->get();
        });
    }

    public function createTemplate(array $data)
    {
        DB::beginTransaction();
        try {
            $template = OnboardingTemplate::create([
                'name' => $data['name'],
                'department_id' => $data['department_id'] ?? null,
                'designation_id' => $data['designation_id'] ?? null,
                'is_active' => true,
            ]);

            if (!empty($data['tasks'])) {
                foreach ($data['tasks'] as $index => $taskData) {
                    $template->tasks()->create([
                        'title' => $taskData['title'],
                        'description' => $taskData['description'] ?? null,
                        'default_owner_role' => $taskData['default_owner_role'] ?? null,
                        'offset_days' => $taskData['offset_days'] ?? 0,
                        'required' => $taskData['required'] ?? true,
                        'sort_order' => $index,
                    ]);
                }
            }

            DB::commit();
            Cache::forget('onboarding_templates');
            
            return $template->load('tasks');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
