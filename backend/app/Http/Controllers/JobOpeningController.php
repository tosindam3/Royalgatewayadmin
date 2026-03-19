<?php

namespace App\Http\Controllers;

use App\Services\RecruitmentService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class JobOpeningController extends Controller
{
    use ApiResponse;

    protected $recruitmentService;

    public function __construct(RecruitmentService $recruitmentService)
    {
        $this->recruitmentService = $recruitmentService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['status', 'department_id', 'branch_id', 'employment_type', 'search']);
        $perPage = $request->get('per_page', 20);

        $jobs = $this->recruitmentService->getJobs($filters, $request->user(), $perPage);

        return $this->success($jobs);
    }

    public function show(Request $request, $id)
    {
        $job = $this->recruitmentService->getJobById($id, $request->user());
        return $this->success($job);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'branch_id' => 'nullable|exists:branches,id',
            'location' => 'required|string|max:255',
            'employment_type' => 'required|in:full_time,part_time,contract,intern',
            'experience_level' => 'required|in:entry,mid,senior,lead,executive',
            'openings' => 'required|integer|min:1',
            'status' => 'nullable|in:draft,active',
            'posted_date' => 'nullable|date',
            'closing_date' => 'nullable|date|after:posted_date',
        ]);

        $job = $this->recruitmentService->createJob($validated, $request->user());

        return $this->success($job, 'Job opening created successfully', 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'responsibilities' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'branch_id' => 'nullable|exists:branches,id',
            'location' => 'sometimes|string|max:255',
            'employment_type' => 'sometimes|in:full_time,part_time,contract,intern',
            'experience_level' => 'sometimes|in:entry,mid,senior,lead,executive',
            'openings' => 'sometimes|integer|min:1',
            'status' => 'sometimes|in:draft,active,on_hold,closed',
            'posted_date' => 'nullable|date',
            'closing_date' => 'nullable|date',
        ]);

        $job = $this->recruitmentService->updateJob($id, $validated, $request->user());

        return $this->success($job, 'Job opening updated successfully');
    }

    public function destroy(Request $request, $id)
    {
        $this->recruitmentService->deleteJob($id, $request->user());
        return $this->success(null, 'Job opening deleted successfully');
    }

    public function statistics(Request $request)
    {
        $stats = $this->recruitmentService->getJobStatistics($request->user());
        return $this->success($stats);
    }
}
