<?php

namespace App\Jobs;

use App\Models\ReviewCycle;
use App\Models\Employee;
use App\Models\CycleParticipant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class LaunchReviewCycleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public ReviewCycle $cycle,
        public array $employeeIds
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info("Launching review cycle: {$this->cycle->name} for " . count($this->employeeIds) . " employees.");

            $participants = [];
            foreach ($this->employeeIds as $employeeId) {
                $participants[] = [
                    'cycle_id' => $this->cycle->id,
                    'employee_id' => $employeeId,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                // Batch insert every 200 participants
                if (count($participants) >= 200) {
                    CycleParticipant::insertOrIgnore($participants);
                    $participants = [];
                }
            }

            if (!empty($participants)) {
                CycleParticipant::insertOrIgnore($participants);
            }

            $this->cycle->update(['status' => 'active']);

            Log::info("Review cycle {$this->cycle->name} launched successfully.");

            // Future: Dispatch notifications to employees here

        } catch (\Exception $e) {
            Log::error("Failed to launch review cycle {$this->cycle->id}: " . $e->getMessage());
            $this->cycle->update(['status' => 'draft']); // Rollback status
            throw $e;
        }
    }
}
