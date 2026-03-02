<?php

namespace App\Http\Controllers;

use App\Services\PerformanceService;
use Illuminate\Http\Request;

class PerformanceDashboardController extends Controller
{
    protected $performanceService;

    public function __construct(PerformanceService $performanceService)
    {
        $this->performanceService = $performanceService;
    }

    /**
     * Get dashboard KPIs
     */
    public function kpis()
    {
        $kpis = $this->performanceService->getDashboardKpis();
        
        return response()->json([
            'success' => true,
            'data' => $kpis,
        ]);
    }

    /**
     * Get team performance data
     */
    public function teamPerformance()
    {
        $data = $this->performanceService->getTeamPerformance();
        
        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Get AI insights (placeholder for frontend AI generation)
     */
    public function insights()
    {
        // This endpoint returns basic data that the frontend AI will analyze
        $kpis = $this->performanceService->getDashboardKpis();
        $teamData = $this->performanceService->getTeamPerformance();
        
        return response()->json([
            'success' => true,
            'data' => [
                'kpis' => $kpis,
                'team_performance' => $teamData,
                'summary' => 'Data ready for AI analysis',
            ],
        ]);
    }
}
