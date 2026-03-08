<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReactionRemoved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $channelId;
    public $messageId;
    public $userId;
    public $emoji;

    public function __construct($channelId, $messageId, $userId, $emoji)
    {
        $this->channelId = $channelId;
        $this->messageId = $messageId;
        $this->userId = $userId;
        $this->emoji = $emoji;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.channel.' . $this->channelId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reaction.removed';
    }
}
