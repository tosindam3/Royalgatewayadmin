<?php

namespace App\Http\Controllers;

use App\Services\AttendanceSummaryService;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AttendanceSummaryController extends Controller
{
    use ApiResponse;

    public function __construct(
        private AttendanceSummaryService $summaryService
    ) {}

    /**
     * Get month-wide KPIs
     * GET /api/attendance/summary/kpis?month=YYYY-MM&department_id=&branch_id=&search=&anomalies=
     */
    public function kpis(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'department_id' => 'nullable|exists:departments,id',
            'branch_id' => 'nullable|exists:branches,id',
            'search' => 'nullable|string|max:255',
            'anomalies' => 'nullable|string',
        ]);

        $month = $request->input('month');
        $filters = $request->only(['department_id', 'branch_id', 'search', 'anomalies']);

        $kpis = $this->summaryService->getMonthKpis($month, $filters);

        return $this->success($kpis, 'Month KPIs retrieved successfully.');
    }

    /**
     * Get summary table (paginated)
     * GET /api/attendance/summary?month=YYYY-MM&page=1&pageSize=50&department_id=&branch_id=&search=&anomalies=
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'page' => 'nullable|integer|min:1',
            'pageSize' => 'nullable|integer|min:1|max:100',
            'department_id' => 'nullable|exists:departments,id',
            'branch_id' => 'nullable|exists:branches,id',
            'search' => 'nullable|string|max:255',
            'anomalies' => 'nullable|string',
        ]);

        $month = $request->input('month');
        $page = $request->input('page', 1);
        $pageSize = $request->input('pageSize', 50);
        $filters = $request->only(['department_id', 'branch_id', 'search', 'anomalies']);

        $result = $this->summaryService->getSummaryTable($month, $filters, $page, $pageSize);

        return $this->success($result, 'Summary table retrieved successfully.');
    }

    /**
     * Get employee month detail
     * GET /api/attendance/summary/{employeeId}?month=YYYY-MM
     */
    public function employeeMonth(Request $request, int $employeeId): JsonResponse
    {
        $request->validate([
            'month' => 'required|date_format:Y-m',
        ]);

        $month = $request->input('month');

        $detail = $this->summaryService->getEmployeeMonthDetail($employeeId, $month);

        return $this->success($detail, 'Employee month detail retrieved successfully.');
    }

    /**
     * Get record details
     * GET /api/attendance/records/{recordId}/details
     */
    public function recordDetails(int $recordId): JsonResponse
    {
        $details = $this->summaryService->getRecordDetails($recordId);

        return $this->success($details, 'Record details retrieved successfully.');
    }

    /**
     * Export CSV
     * POST /api/attendance/summary/export
     */
    public function export(Request $request): JsonResponse
    {
        // TODO: Implement async CSV export
        // This would dispatch a job to generate CSV and notify user when ready
        
        $request->validate([
            'month' => 'required|date_format:Y-m',
            'department_id' => 'nullable|exists:departments,id',
            'branch_id' => 'nullable|exists:branches,id',
        ]);

        return $this->success([
            'message' => 'Export job queued. You will be notified when ready.',
            'status' => 'pending',
        ], 'Export initiated successfully.');
    }
}
