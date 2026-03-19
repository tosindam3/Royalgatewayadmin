<?php

use Illuminate\Support\Facades\Route;
use App\Models\JobOpening;
use App\Models\Candidate;
use App\Models\Application;
use App\Models\Department;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Talent Management Diagnostic Routes
|--------------------------------------------------------------------------
|
| Quick diagnostic endpoints to verify Talent Management setup
| Access: http://localhost:8000/diagnostic/talent
|
*/

Route::prefix('diagnostic/talent')->group(function () {
    
    // Check database tables and counts
    Route::get('/status', function () {
        try {
            $status = [
                'database' => [
                    'job_openings' => [
                        'exists' => \Schema::hasTable('job_openings'),
                        'count' => JobOpening::count(),
                        'active' => JobOpening::where('status', 'active')->count(),
                    ],
                    'candidates' => [
                        'exists' => \Schema::hasTable('candidates'),
                        'count' => Candidate::count(),
                    ],
                    'applications' => [
                        'exists' => \Schema::hasTable('applications'),
                        'count' => Application::count(),
                        'by_stage' => Application::select('stage', \DB::raw('count(*) as count'))
                            ->groupBy('stage')
                            ->pluck('count', 'stage'),
                    ],
                ],
                'sample_data' => [
                    'jobs' => JobOpening::with('department')->limit(3)->get(['id', 'title', 'status', 'department_id']),
                    'applications' => Application::with(['candidate', 'jobOpening'])
                        ->limit(3)
                        ->get(['id', 'candidate_id', 'job_opening_id', 'stage', 'status']),
                ],
                'permissions' => [
                    'users_with_onboarding_view' => User::whereHas('roles.permissions', function ($q) {
                        $q->where('permissions.name', 'onboarding.view');
                    })->count(),
                ],
                'routes' => [
                    'talent_routes_registered' => collect(Route::getRoutes())
                        ->filter(fn($route) => str_contains($route->uri(), 'talent'))
                        ->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'message' => 'Talent Management diagnostic check',
                'data' => $status,
                'timestamp' => now()->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    });

    // Test job creation
    Route::get('/test-create-job', function () {
        try {
            $user = User::first();
            if (!$user) {
                return response()->json(['error' => 'No users found'], 404);
            }

            $department = Department::first();
            
            $job = JobOpening::create([
                'title' => 'Test Job - ' . now()->format('Y-m-d H:i:s'),
                'description' => 'This is a test job created by diagnostic script',
                'location' => 'Test Location',
                'employment_type' => 'full_time',
                'experience_level' => 'mid',
                'openings' => 1,
                'status' => 'draft',
                'created_by' => $user->id,
                'department_id' => $department?->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Test job created successfully',
                'job' => $job,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    });

    // Test application creation
    Route::get('/test-create-application', function () {
        try {
            $user = User::first();
            if (!$user) {
                return response()->json(['error' => 'No users found'], 404);
            }

            $job = JobOpening::where('status', 'active')->first();
            if (!$job) {
                return response()->json(['error' => 'No active jobs found'], 404);
            }

            // Create candidate
            $candidate = Candidate::firstOrCreate(
                ['email' => $user->email],
                [
                    'first_name' => 'Test',
                    'last_name' => 'User',
                    'user_id' => $user->id,
                    'source' => 'direct',
                ]
            );

            // Create application
            $application = Application::create([
                'candidate_id' => $candidate->id,
                'job_opening_id' => $job->id,
                'stage' => 'applied',
                'status' => 'active',
                'cover_letter' => 'This is a test application created by diagnostic script',
                'applied_date' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Test application created successfully',
                'application' => $application->load(['candidate', 'jobOpening']),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    });

    // Check API routes
    Route::get('/routes', function () {
        $routes = collect(Route::getRoutes())
            ->filter(fn($route) => str_contains($route->uri(), 'talent'))
            ->map(fn($route) => [
                'method' => implode('|', $route->methods()),
                'uri' => $route->uri(),
                'name' => $route->getName(),
                'action' => $route->getActionName(),
            ])
            ->values();

        return response()->json([
            'success' => true,
            'count' => $routes->count(),
            'routes' => $routes,
        ]);
    });

    // Clean up test data
    Route::get('/cleanup-test-data', function () {
        try {
            $deleted = [
                'jobs' => JobOpening::where('title', 'like', 'Test Job%')->delete(),
                'applications' => Application::where('cover_letter', 'like', '%diagnostic script%')->delete(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Test data cleaned up',
                'deleted' => $deleted,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    });
});
