<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChatTypingIndicator;

class CleanupTypingIndicators extends Command
{
    protected $signature = 'chat:cleanup-typing';
    protected $description = 'Clean up expired typing indicators';

    public function handle()
    {
        $deleted = ChatTypingIndicator::where('expires_at', '<', now())->delete();
        
        $this->info("Cleaned up {$deleted} expired typing indicators");
        
        return 0;
    }
}
