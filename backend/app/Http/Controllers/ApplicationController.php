<?php

namespace App\Http\Controllers;

use App\Services\ApplicationTrackingService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    use ApiResponse;

    protected $applicationService;

    public function __construct(ApplicationTrackingService $applicationService)
    {
        $this->applicationService = $applicationService;
    }

    public function apply(Request $request, $jobId)
    {
        $validated = $request->validate([
            'cover_letter' => 'required|string|max:5000',
            'resume' => 'nullable|file|mimes:pdf,doc,docx|max:5120',
            'referrer_employee_id' => 'nullable|exists:employees,id',
        ]);

        try {
            $application = $this->applicationService->applyForJob(
                $jobId,
                $validated,
                $request->user()
            );

            return $this->success($application, 'Application submitted successfully', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function myApplications(Request $request)
    {
        $applications = $this->applicationService->getMyApplications($request->user());
        return $this->success($applications);
    }

    public function index(Request $request)
    {
        $filters = $request->only(['job_opening_id', 'stage', 'status']);
        $perPage = $request->get('per_page', 20);

        $applications = $this->applicationService->getApplications(
            $filters,
            $request->user(),
            $perPage
        );

        return $this->success($applications);
    }

    public function updateStage(Request $request, $id)
    {
        $validated = $request->validate([
            'stage' => 'required|in:applied,screening,technical,interview,offer,hired,rejected',
        ]);

        $application = $this->applicationService->updateApplicationStage(
            $id,
            $validated['stage'],
            $request->user()
        );

        return $this->success($application, 'Application stage updated successfully');
    }

    public function statistics(Request $request)
    {
        $stats = $this->applicationService->getPipelineStatistics($request->user());
        return $this->success($stats);
    }
}
