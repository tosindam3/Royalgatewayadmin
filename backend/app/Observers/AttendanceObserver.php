<?php

namespace App\Observers;

use App\Models\AttendanceRecord;
use App\Traits\FlushesAiAdvisorCache;

class AttendanceObserver
{
    use FlushesAiAdvisorCache;

    public function saved(AttendanceRecord $record): void
    {
        $this->flushAiAdvisorCache();
    }

    public function deleted(AttendanceRecord $record): void
    {
        $this->flushAiAdvisorCache();
    }
}
