<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.channel.{id}', function ($user, $id) {
    // Check if user is a member of the channel
    return \App\Models\ChatChannel::find($id)->members()->where('user_id', $user->id)->exists();
});

Broadcast::channel('chat.presence', function ($user) {
    return ['id' => $user->id, 'name' => $user->name, 'email' => $user->email];
});
