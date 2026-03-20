<?php

namespace App\Http\Controllers;

use App\Services\AiAdvisorService;
use Illuminate\Http\Request;
use App\Traits\ApiResponse;

class AiAdvisorController extends Controller
{
    use ApiResponse;

    public function __construct(private AiAdvisorService $advisor) {}

    public function briefing(Request $request)
    {
        $user     = $request->user();
        $role     = $user->role ?? 'employee';
        $employee = $user->employeeProfile;

        $data = $this->advisor->getBriefing($role, $user->id, $employee?->id);

        return $this->success($data);
    }

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'array',
            'history.*.role'    => 'required|string|in:user,model',
            'history.*.content' => 'required|string',
        ]);

        $user     = $request->user();
        $role     = $user->role ?? 'employee';
        $employee = $user->employeeProfile;

        $reply = $this->advisor->chat(
            $request->input('message'),
            $request->input('history', []),
            $role,
            $employee?->id
        );

        return $this->success(['reply' => $reply]);
    }

    public function trends()
    {
        return $this->success($this->advisor->getTrends());
    }
}
