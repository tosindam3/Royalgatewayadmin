<?php

namespace App\Jobs;

use App\Events\AiBriefingReady;
use App\Services\AiAdvisorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;

class GenerateAiBriefingJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    protected $role;
    protected $userId;
    protected $employeeId;
    protected $orgContext;
    protected $ruleBasedInsights;

    /**
     * Create a new job instance.
     */
    public function __construct(string $role, int $userId, ?int $employeeId, array $orgContext, array $ruleBasedInsights)
    {
        $this->role = $role;
        $this->userId = $userId;
        $this->employeeId = $employeeId;
        $this->orgContext = $orgContext;
        $this->ruleBasedInsights = $ruleBasedInsights;
    }

    /**
     * Execute the job.
     */
    public function handle(AiAdvisorService $advisor): void
    {
        // Enrich insights with Gemini
        $enrichedInsights = $advisor->enrichWithGeminiSafe($this->ruleBasedInsights, $this->role, $this->orgContext);

        $payload = [
            'insights'       => $enrichedInsights,
            'health_score'   => $advisor->computeHealthScorePub($this->orgContext),
            'gemini_enabled' => true,
            'generated_at'   => now()->toIso8601String(),
            'is_enriched'    => true,
        ];

        $cacheKey = "ai_briefing_v2_{$this->userId}_" . now()->format('Y-m-d');

        // Cache the enriched result
        Cache::put($cacheKey, $payload, now()->addHours(6));

        // Fire the WebSocket event so the frontend swaps the UI instantly
        try {
            event(new AiBriefingReady($this->userId, $payload));
        } catch (\Throwable $e) {
            \Log::warning("AI Advisor: WebSocket broadcast failed, but cache is updated.", [
                'error' => $e->getMessage()
            ]);
        }
    }
}
