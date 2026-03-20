<?php

namespace App\Observers;

use App\Models\ApprovalRequest;
use App\Traits\FlushesAiAdvisorCache;

class ApprovalObserver
{
    use FlushesAiAdvisorCache;

    public function updated(ApprovalRequest $request): void
    {
        if ($request->isDirty('status')) {
            $this->flushAiAdvisorCache();
        }
    }

    public function deleted(ApprovalRequest $request): void
    {
        $this->flushAiAdvisorCache();
    }
}
