<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.channel.{id}', function ($user, $id) {
    // Check if user is a member of the channel with caching
    $channel = \App\Models\ChatChannel::find($id);
    if (!$channel) {
        return false;
    }

    // Public channels are accessible to all authenticated users
    if ($channel->isPublic()) {
        return true;
    }
    
    return \Illuminate\Support\Facades\Cache::remember(
        "channel.{$id}.member.{$user->id}",
        300, // 5 minutes
        fn() => $channel->members()->where('user_id', $user->id)->exists()
    );
});

Broadcast::channel('chat.presence', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar' => $user->employee_profile->avatar ?? null,
        'status' => 'online'
    ];
});
