<?php

namespace App\Traits;

use Illuminate\Support\Facades\Cache;

trait FlushesAiAdvisorCache
{
    /**
     * Flush the AI Advisor cache for a specific user or globally.
     */
    public function flushAiAdvisorCache(): void
    {
        // Since the AI Advisor briefing depends on global metrics 
        // (attendance rate, headcount, etc.), we flush the entire cache 
        // to ensure all users get fresh insights when data changes.
        Cache::flush();
    }
}
