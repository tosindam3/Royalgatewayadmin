<?php

namespace App\Http\Controllers;

use App\Services\PerformanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceController extends Controller
{
    public function __construct(
        private PerformanceService $performanceService
    ) {}

    /**
     * Get dashboard statistics
     * 
     * @return JsonResponse
     */
    public function dashboard(): JsonResponse
    {
        try {
            $stats = $this->performanceService->getDashboardKpis();
            
            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get team performance data
     * 
     * @return JsonResponse
     */
    public function teamPerformance(): JsonResponse
    {
        try {
            $data = $this->performanceService->getTeamPerformance();
            
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch team performance',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get insights data for AI
     * 
     * @return JsonResponse
     */
    public function insights(): JsonResponse
    {
        try {
            $kpis = $this->performanceService->getDashboardKpis();
            $teamData = $this->performanceService->getTeamPerformance();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'kpis' => $kpis,
                    'team_performance' => $teamData,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch insights',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get employee evaluation statistics
     * 
     * @param int $employeeId
     * @return JsonResponse
     */
    public function employeeStats(int $employeeId): JsonResponse
    {
        try {
            // Get employee's recent evaluations and scores
            $evaluations = \App\Models\EvaluationResponse::where('employee_id', $employeeId)
                ->with('template:id,title')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();
            
            $scores = \App\Models\PerformanceMonthlyScore::where('employee_id', $employeeId)
                ->with('period:id,name,start_date,end_date')
                ->orderBy('created_at', 'desc')
                ->limit(6)
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'evaluations' => $evaluations,
                    'scores' => $scores,
                    'average_score' => $scores->avg('score') ?? 0,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch employee stats',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
