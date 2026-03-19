<?php

namespace App\Services;

use App\Models\JobOpening;
use App\Models\Application;
use App\Models\Candidate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class RecruitmentService
{
    protected $scopeEngine;

    public function __construct(ScopeEngine $scopeEngine)
    {
        $this->scopeEngine = $scopeEngine;
    }

    public function getJobs(array $filters, $user, int $perPage = 20)
    {
        $query = JobOpening::query()
            ->with(['department:id,name', 'branch:id,name'])
            ->withCount('applications');

        // Apply scope filtering
        $query = $this->scopeEngine->applyScope($query, $user, 'onboarding.view');

        // Filters
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        } else {
            $query->whereIn('status', ['active', 'draft']);
        }

        if (!empty($filters['department_id'])) {
            $query->where('department_id', $filters['department_id']);
        }

        if (!empty($filters['branch_id'])) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (!empty($filters['employment_type'])) {
            $query->where('employment_type', $filters['employment_type']);
        }

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', "%{$filters['search']}%")
                  ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        return $query->orderBy('posted_date', 'desc')
                     ->orderBy('created_at', 'desc')
                     ->paginate(min($perPage, 100));
    }

    public function getJobById(int $id, $user)
    {
        $job = JobOpening::with([
            'department:id,name',
            'branch:id,name',
            'creator:id,name',
        ])->withCount('applications')->findOrFail($id);

        // Check access
        $query = JobOpening::where('id', $id);
        $query = $this->scopeEngine->applyScope($query, $user, 'onboarding.view');
        
        if (!$query->exists()) {
            abort(403, 'Unauthorized access to this job opening');
        }

        return $job;
    }

    public function createJob(array $data, $user)
    {
        $data['created_by'] = $user->id;
        $data['status'] = $data['status'] ?? 'draft';

        $job = JobOpening::create($data);

        // Clear cache
        Cache::tags(['talent', 'jobs'])->flush();

        return $job->load(['department', 'branch']);
    }

    public function updateJob(int $id, array $data, $user)
    {
        $job = JobOpening::findOrFail($id);

        // Check permission
        if (!$this->scopeEngine->hasPermission($user, 'onboarding.update')) {
            abort(403, 'Unauthorized');
        }

        $job->update($data);

        // Clear cache
        Cache::tags(['talent', 'jobs'])->flush();

        return $job->fresh(['department', 'branch']);
    }

    public function deleteJob(int $id, $user)
    {
        $job = JobOpening::findOrFail($id);

        // Check permission
        if (!$this->scopeEngine->hasPermission($user, 'onboarding.update')) {
            abort(403, 'Unauthorized');
        }

        // Only allow deletion of draft jobs
        if ($job->status !== 'draft') {
            throw new \Exception('Only draft jobs can be deleted. Close active jobs instead.');
        }

        $job->delete();

        // Clear cache
        Cache::tags(['talent', 'jobs'])->flush();
    }

    public function getJobStatistics($user)
    {
        $cacheKey = 'job_stats_' . $user->id;

        return Cache::tags(['talent', 'jobs'])->remember($cacheKey, 300, function () use ($user) {
            $query = JobOpening::query();
            $query = $this->scopeEngine->applyScope($query, $user, 'onboarding.view');

            return [
                'total_active' => (clone $query)->where('status', 'active')->count(),
                'total_draft' => (clone $query)->where('status', 'draft')->count(),
                'total_closed' => (clone $query)->where('status', 'closed')->count(),
                'total_applications' => Application::whereIn(
                    'job_opening_id',
                    (clone $query)->pluck('id')
                )->count(),
            ];
        });
    }
}
