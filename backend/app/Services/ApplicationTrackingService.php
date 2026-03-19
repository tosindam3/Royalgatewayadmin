<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Candidate;
use App\Models\JobOpening;
use App\Traits\CacheTagsHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ApplicationTrackingService
{
    use CacheTagsHelper;

    protected $scopeEngine;

    public function __construct(ScopeEngine $scopeEngine)
    {
        $this->scopeEngine = $scopeEngine;
    }

    public function applyForJob(int $jobId, array $data, $user)
    {
        DB::beginTransaction();
        try {
            $job = JobOpening::findOrFail($jobId);

            // Check if job is active
            if ($job->status !== 'active') {
                throw new \Exception('This job is no longer accepting applications');
            }

            // Find or create candidate
            $candidate = Candidate::firstOrCreate(
                ['email' => $user->email],
                [
                    'first_name' => $user->name ? explode(' ', $user->name)[0] : 'Unknown',
                    'last_name' => $user->name ? (explode(' ', $user->name)[1] ?? '') : '',
                    'user_id' => $user->id,
                    'source' => 'direct',
                ]
            );

            // Check for duplicate application
            $existing = Application::where('candidate_id', $candidate->id)
                ->where('job_opening_id', $jobId)
                ->whereIn('status', ['active'])
                ->first();

            if ($existing) {
                throw new \Exception('You have already applied for this position');
            }

            // Handle resume upload
            $resumePath = null;
            if (!empty($data['resume'])) {
                $resumePath = $this->uploadResume($data['resume'], $user);
                $candidate->update(['resume_path' => $resumePath]);
            }

            // Create application
            $application = Application::create([
                'candidate_id' => $candidate->id,
                'job_opening_id' => $jobId,
                'stage' => 'applied',
                'status' => 'active',
                'cover_letter' => $data['cover_letter'] ?? null,
                'referrer_employee_id' => $data['referrer_employee_id'] ?? null,
                'applied_date' => now(),
            ]);

            DB::commit();

            // Clear cache
            $this->flushCacheTags(['talent', 'applications']);

            return $application->load(['candidate', 'jobOpening']);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getMyApplications($user)
    {
        $candidate = Candidate::where('user_id', $user->id)->first();

        if (!$candidate) {
            return [];
        }

        return Application::where('candidate_id', $candidate->id)
            ->with(['jobOpening.department', 'jobOpening.branch'])
            ->orderBy('applied_date', 'desc')
            ->get();
    }

    public function getApplications(array $filters, $user, int $perPage = 20)
    {
        $query = Application::query()
            ->with([
                'candidate',
                'jobOpening.department',
                'jobOpening.branch',
            ]);

        // Apply scope through job openings
        $accessibleJobIds = JobOpening::query();
        $accessibleJobIds = $this->scopeEngine->applyScope($accessibleJobIds, $user, 'onboarding.view');
        $query->whereIn('job_opening_id', $accessibleJobIds->pluck('id'));

        // Filters
        if (!empty($filters['job_opening_id'])) {
            $query->where('job_opening_id', $filters['job_opening_id']);
        }

        if (!empty($filters['stage'])) {
            $query->where('stage', $filters['stage']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('applied_date', 'desc')->paginate(min($perPage, 100));
    }

    public function updateApplicationStage(int $id, string $stage, $user)
    {
        $application = Application::findOrFail($id);

        // Check permission
        if (!$this->scopeEngine->hasPermission($user, 'onboarding.update')) {
            abort(403, 'Unauthorized');
        }

        $application->update(['stage' => $stage]);

        // Auto-update status based on stage
        if ($stage === 'hired') {
            $application->update(['status' => 'hired']);
        } elseif ($stage === 'rejected') {
            $application->update(['status' => 'rejected']);
        }

        // Clear cache
        $this->flushCacheTags(['talent', 'applications']);

        return $application->fresh(['candidate', 'jobOpening']);
    }

    public function getPipelineStatistics($user)
    {
        $cacheKey = 'pipeline_stats_' . $user->id;

        return $this->cacheWithTags(['talent', 'applications'], $cacheKey, 300, function () use ($user) {
            $accessibleJobIds = JobOpening::query();
            $accessibleJobIds = $this->scopeEngine->applyScope($accessibleJobIds, $user, 'onboarding.view');
            $jobIds = $accessibleJobIds->pluck('id');

            $query = Application::whereIn('job_opening_id', $jobIds)->where('status', 'active');

            return [
                'applied' => (clone $query)->where('stage', 'applied')->count(),
                'screening' => (clone $query)->where('stage', 'screening')->count(),
                'technical' => (clone $query)->where('stage', 'technical')->count(),
                'interview' => (clone $query)->where('stage', 'interview')->count(),
                'offer' => (clone $query)->where('stage', 'offer')->count(),
                'hired' => Application::whereIn('job_opening_id', $jobIds)->where('status', 'hired')->count(),
            ];
        });
    }

    protected function uploadResume($file, $user)
    {
        // Sanitize filename
        $filename = Str::uuid() . '_' . Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))
                    . '.' . $file->getClientOriginalExtension();

        // Store in private storage
        $path = $file->storeAs('resumes', $filename, 'private');

        return $path;
    }
}
