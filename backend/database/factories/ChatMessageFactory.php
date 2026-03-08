<?php

namespace Database\Factories;

use App\Models\ChatMessage;
use App\Models\ChatChannel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ChatMessageFactory extends Factory
{
    protected $model = ChatMessage::class;

    public function definition(): array
    {
        return [
            'channel_id' => ChatChannel::factory(),
            'user_id' => User::factory(),
            'parent_message_id' => null,
            'content' => $this->faker->sentence(),
            'type' => 'text',
            'is_edited' => false,
            'is_deleted' => false,
            'edited_at' => null,
            'metadata' => null,
        ];
    }

    public function text(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'text',
            'content' => $this->faker->paragraph(),
        ]);
    }

    public function file(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'file',
            'content' => 'File attachment',
        ]);
    }

    public function audio(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'audio',
            'content' => 'Audio message',
        ]);
    }

    public function system(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'system',
            'content' => $this->faker->randomElement([
                'User joined the channel',
                'User left the channel',
                'Channel name changed',
            ]),
        ]);
    }

    public function edited(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    public function deleted(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_deleted' => true,
            'content' => '[Message deleted]',
        ]);
    }

    public function reply(): static
    {
        return $this->state(fn (array $attributes) => [
            'parent_message_id' => ChatMessage::factory(),
        ]);
    }
}
