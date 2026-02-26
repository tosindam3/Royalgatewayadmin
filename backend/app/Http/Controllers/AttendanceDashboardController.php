<?php

namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Services\AttendanceService;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceDashboardController extends Controller
{
    public function index(AttendanceService $svc): Response
    {
        $emp = auth()->user()->load('workplace');

        return Inertia::render('Attendance/Dashboard', [
            // Critical data: sent with first render (no loading state)
            'today'    => $svc->todayStatus($emp->id),
            'employee' => $emp->only('id', 'name', 'allow_mobile_checkin', 'workplace'),

            // Deferred: loaded after first paint (React 19 use())
            'recentLogs' => Inertia::defer(fn() =>
                AttendanceLog::where('employee_id', $emp->id)
                    ->latest('timestamp')
                    ->limit(30)
                    ->get(['id', 'check_type', 'timestamp', 'source', 'status'])
            ),
        ]);
    }
}
