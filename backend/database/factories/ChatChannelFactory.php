<?php

namespace Database\Factories;

use App\Models\ChatChannel;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ChatChannelFactory extends Factory
{
    protected $model = ChatChannel::class;

    public function definition(): array
    {
        $name = $this->faker->words(2, true);
        
        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name) . '-' . Str::random(6),
            'description' => $this->faker->sentence(),
            'type' => $this->faker->randomElement(['public', 'private', 'direct']),
            'created_by' => User::factory(),
            'organization_id' => null,
            'is_archived' => false,
            'metadata' => null,
        ];
    }

    public function public(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'public',
        ]);
    }

    public function private(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'private',
        ]);
    }

    public function direct(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'direct',
        ]);
    }

    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_archived' => true,
        ]);
    }
}
