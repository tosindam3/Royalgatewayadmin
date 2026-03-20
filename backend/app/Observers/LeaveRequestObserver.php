<?php

namespace App\Observers;

use App\Models\LeaveRequest;
use App\Traits\FlushesAiAdvisorCache;

class LeaveRequestObserver
{
    use FlushesAiAdvisorCache;

    public function updated(LeaveRequest $request): void
    {
        if ($request->isDirty('status')) {
            $this->flushAiAdvisorCache();
        }
    }

    public function deleted(LeaveRequest $request): void
    {
        $this->flushAiAdvisorCache();
    }
}
