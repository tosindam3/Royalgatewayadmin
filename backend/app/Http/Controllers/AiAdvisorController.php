<?php

namespace App\Http\Controllers;

use App\Services\AiAdvisorService;
use App\Jobs\GenerateAiBriefingJob;
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

        // If not enriched, dispatch background job to avoid blocking
        if (isset($data['is_enriched']) && $data['is_enriched'] === false) {
            GenerateAiBriefingJob::dispatch(
                $role,
                $user->id,
                $employee?->id,
                $data['org_context'] ?? [],
                $data['insights'] ?? []
            );
            
            // Mask org_context from external response
            unset($data['org_context']);
        }

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

    public function streamChat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'history' => 'array',
        ]);

        $user     = $request->user();
        $role     = $user->role ?? 'employee';
        $employee = $user->employeeProfile;

        $response = new \Symfony\Component\HttpFoundation\StreamedResponse(function() use ($request, $role, $employee) {
            foreach ($this->advisor->streamChat(
                $request->input('message'),
                $request->input('history', []),
                $role,
                $employee?->id
            ) as $chunk) {
                echo $chunk;
                ob_flush();
                flush();
            }
        });

        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no'); // Disable Nginx buffering

        return $response;
    }

    public function trends()
    {
        return $this->success($this->advisor->getTrends());
    }
}
