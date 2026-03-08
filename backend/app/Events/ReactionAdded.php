<?php

namespace App\Events;

use App\Models\ChatMessageReaction;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ReactionAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $reaction;

    public function __construct(ChatMessageReaction $reaction)
    {
        $this->reaction = $reaction;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.channel.' . $this->reaction->message->channel_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'reaction.added';
    }

    public function broadcastWith(): array
    {
        return [
            'message_id' => $this->reaction->message_id,
            'user_id' => $this->reaction->user_id,
            'emoji' => $this->reaction->emoji,
        ];
    }
}
