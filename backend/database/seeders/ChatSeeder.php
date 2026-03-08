<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ChatChannel;
use App\Models\ChatMessage;
use App\Models\ChatBlockedKeyword;

class ChatSeeder extends Seeder
{
    public function run(): void
    {
        // Get existing users with employee profiles first, then other users
        $usersWithEmployees = User::whereHas('employeeProfile')->with('employeeProfile')->get();
        $otherUsers = User::whereDoesntHave('employeeProfile')->get();
        
        // Combine them, prioritizing employees
        $users = $usersWithEmployees->merge($otherUsers);
        
        if ($users->count() < 2) {
            $this->command->warn('Not enough users found. Please create users first.');
            return;
        }

        $this->command->info("Found {$users->count()} users ({$usersWithEmployees->count()} with employee profiles)");

        // Try to find an admin user, otherwise use first user
        $admin = User::whereHas('roles', function($q) {
            $q->whereIn('name', ['super_admin', 'ceo', 'hr_manager']);
        })->first() ?? $users->first();

        // Delete existing chat data to avoid duplicates
        $this->command->info('Cleaning up existing chat data...');
        \DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        ChatMessage::truncate();
        \DB::table('chat_channel_members')->truncate();
        \DB::table('chat_message_attachments')->truncate();
        \DB::table('chat_message_reactions')->truncate();
        \DB::table('chat_typing_indicators')->truncate();
        ChatChannel::truncate();
        ChatBlockedKeyword::truncate();
        \DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Create public channels
        $general = ChatChannel::create([
            'name' => 'General',
            'description' => 'Company-wide announcements and discussions',
            'type' => 'public',
            'created_by' => $admin->id,
        ]);

        $engineering = ChatChannel::create([
            'name' => 'Engineering',
            'description' => 'Technical discussions and code reviews',
            'type' => 'private',
            'created_by' => $admin->id,
        ]);

        $hr = ChatChannel::create([
            'name' => 'HR Team',
            'description' => 'Human resources team channel',
            'type' => 'private',
            'created_by' => $admin->id,
        ]);

        $random = ChatChannel::create([
            'name' => 'Random',
            'description' => 'Off-topic discussions and fun stuff',
            'type' => 'public',
            'created_by' => $admin->id,
        ]);

        // Add members to channels
        $this->command->info('Adding members to channels...');
        
        // General - all users
        foreach ($users as $user) {
            $general->members()->attach($user->id, [
                'role' => $user->id === $admin->id ? 'owner' : 'member',
                'is_pinned' => $user->id === $admin->id,
            ]);
        }

        // Random - all users
        foreach ($users as $user) {
            $random->members()->attach($user->id, [
                'role' => $user->id === $admin->id ? 'owner' : 'member',
            ]);
        }

        // Engineering - first 10 users or all if less
        foreach ($users->take(min(10, $users->count())) as $user) {
            $engineering->members()->attach($user->id, [
                'role' => $user->id === $admin->id ? 'owner' : 'member',
            ]);
        }

        // HR Team - admins and HR users
        $hrUsers = User::whereHas('roles', function($q) {
            $q->whereIn('name', ['super_admin', 'ceo', 'hr_manager']);
        })->limit(10)->get();
        
        if ($hrUsers->isEmpty()) {
            $hrUsers = $users->take(5);
        }
        
        foreach ($hrUsers as $user) {
            $hr->members()->attach($user->id, [
                'role' => $user->id === $admin->id ? 'owner' : 'admin',
            ]);
        }

        // Create sample messages
        $this->command->info('Creating sample messages...');
        
        $messagesByChannel = [
            'general' => [
                'Welcome to the team! 👋',
                'Has anyone seen the latest project updates?',
                'Great work on the presentation today!',
                'Don\'t forget about the meeting at 3 PM',
                'Happy Friday everyone! 🎉',
                'The new HR360 system is looking great!',
                'Thanks everyone for the warm welcome',
                'Looking forward to working with you all',
            ],
            'engineering' => [
                'I\'ve uploaded the documents to the shared drive',
                'Can someone review my pull request?',
                'The new feature is looking great',
                'Thanks for your help with that bug',
                'Let\'s schedule a sync-up call',
                'Code review meeting at 2 PM today',
                'Deployed the latest changes to staging',
                'Anyone available for pair programming?',
            ],
            'hr' => [
                'New employee onboarding starts Monday',
                'Please submit your timesheets by Friday',
                'Benefits enrollment deadline is next week',
                'Team building event scheduled for next month',
                'Performance reviews are due by end of quarter',
            ],
            'random' => [
                'Anyone up for lunch? 🍕',
                'Great weather today! ☀️',
                'Coffee break anyone? ☕',
                'Happy birthday to our team member! 🎂',
                'Weekend plans anyone?',
                'Check out this cool article I found',
            ],
        ];

        foreach ([
            ['channel' => $general, 'key' => 'general'],
            ['channel' => $engineering, 'key' => 'engineering'],
            ['channel' => $hr, 'key' => 'hr'],
            ['channel' => $random, 'key' => 'random'],
        ] as $item) {
            $channel = $item['channel'];
            $messages = $messagesByChannel[$item['key']];
            $channelMembers = $channel->members;
            
            if ($channelMembers->isEmpty()) continue;
            
            foreach ($messages as $index => $content) {
                $user = $channelMembers->random();
                
                ChatMessage::create([
                    'channel_id' => $channel->id,
                    'user_id' => $user->id,
                    'content' => $content,
                    'type' => 'text',
                    'created_at' => now()->subHours(rand(1, 72)),
                ]);

                // Add some reactions
                if ($index % 2 === 0 && $channelMembers->count() > 1) {
                    $message = ChatMessage::latest()->first();
                    $reactorCount = rand(1, min(3, $channelMembers->count()));
                    $reactors = $channelMembers->random($reactorCount);
                    $emojis = ['👍', '❤️', '😊', '🎉', '👏'];
                    
                    foreach ($reactors as $reactor) {
                        // Use firstOrCreate to prevent duplicates
                        $message->reactions()->firstOrCreate([
                            'user_id' => $reactor->id,
                            'emoji' => $emojis[array_rand($emojis)],
                        ]);
                    }
                }
            }
        }

        // Create some blocked keywords
        $keywords = [
            ['keyword' => 'confidential', 'action' => 'block'],
            ['keyword' => 'password', 'action' => 'flag'],
            ['keyword' => 'secret', 'action' => 'warn'],
        ];

        foreach ($keywords as $keyword) {
            ChatBlockedKeyword::create([
                'keyword' => $keyword['keyword'],
                'action' => $keyword['action'],
                'is_active' => true,
                'created_by' => $admin->id,
            ]);
        }

        $this->command->info('');
        $this->command->info('✅ Chat data seeded successfully!');
        $this->command->info('');
        $this->command->info("📊 Summary:");
        $this->command->info("  - Total Users: {$users->count()} ({$usersWithEmployees->count()} employees)");
        $this->command->info("  - Total Channels: 4");
        $this->command->info("  - General: {$general->messages()->count()} messages, {$general->members()->count()} members");
        $this->command->info("  - Engineering: {$engineering->messages()->count()} messages, {$engineering->members()->count()} members");
        $this->command->info("  - HR Team: {$hr->messages()->count()} messages, {$hr->members()->count()} members");
        $this->command->info("  - Random: {$random->messages()->count()} messages, {$random->members()->count()} members");
        $this->command->info("  - Total Messages: " . ChatMessage::count());
        $this->command->info("  - Total Reactions: " . \App\Models\ChatMessageReaction::count());
        $this->command->info("  - Blocked Keywords: " . ChatBlockedKeyword::count());
        $this->command->info('');
        $this->command->info('🎉 You can now test the chat at: http://localhost:3000/#/communication/chat');
        $this->command->info('');
        $this->command->info('💡 Tip: Log in with any user account to see the channels and messages');
    }
}
