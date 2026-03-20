<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class SystemNotification extends Notification implements ShouldBroadcastNow
{
    use Queueable;

    public string $typeKey;
    public string $title;
    public string $message;
    public ?string $actionUrl;
    public string $priority;
    public array $meta;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $typeKey, string $title, string $message, ?string $actionUrl = null, string $priority = 'MEDIUM', array $meta = [])
    {
        $this->typeKey = $typeKey;
        $this->title = $title;
        $this->message = $message;
        $this->actionUrl = $actionUrl;
        $this->priority = $priority;
        $this->meta = $meta;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification for the database.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => $this->typeKey,
            'title' => $this->title,
            'message' => $this->message,
            'actionUrl' => $this->actionUrl,
            'priority' => $this->priority,
            'meta' => $this->meta,
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => $this->typeKey,
            'title' => $this->title,
            'message' => $this->message,
            'actionUrl' => $this->actionUrl,
            'priority' => $this->priority,
            'meta' => $this->meta,
            'read_at' => null,
            'created_at' => now()->toIso8601String(),
        ]);
    }
}
