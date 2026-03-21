<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class WipeApplicationData extends Command
{
    protected $signature = 'app:wipe
                            {--preserve-admin : Keep the super_admin account}
                            {--force : Skip confirmation prompt (use in scripts)}';

    protected $description = 'Wipe all transactional/employee data for a clean client handover. Preserves schema, roles, permissions, and optionally the super_admin account.';

    // Tables wiped in dependency order (children before parents)
    private array $wipeOrder = [
        'personal_access_tokens',
        'notifications',
        'approval_actions',
        'approval_requests',
        'approval_steps',
        'approval_workflows',
        'payroll_run_employees',
        'payroll_items',
        'payroll_runs',
        'payroll_periods',
        'performance_submissions',
        'performance_configs',
        'attendance_corrections',
        'attendance_records',
        'attendance_logs',
        'leave_requests',
        'leave_balances',
        'leave_types',
        'employee_salaries',
        'salary_structures',
        'onboarding_cases',
        'chat_messages',
        'chat_channel_members',
        'chat_channels',
        'memo_signatures',
        'memo_attachments',
        'memo_folders',
        'memos',
        'interviews',
        'applications',
        'candidates',
        'job_openings',
        'biometric_devices',
        'model_has_roles',       // role assignments
        'employees',
        'users',
        'departments',
        'designations',
        'branches',
        'workplaces',
    ];

    // Tables that hold config/reference data — never wiped
    private array $preservedTables = [
        'roles',
        'permissions',
        'role_has_permissions',
        'organization_settings',
        'migrations',
    ];

    public function handle(): int
    {
        $this->warn('');
        $this->warn('  ██╗    ██╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗ ');
        $this->warn('  ██║    ██║██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝ ');
        $this->warn('  ██║ █╗ ██║███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗');
        $this->warn('  ██║███╗██║██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║');
        $this->warn('  ╚███╔███╔╝██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝');
        $this->warn('   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ');
        $this->warn('');
        $this->error('  This will permanently delete ALL employee, payroll, attendance,');
        $this->error('  performance, and user data. This action CANNOT be undone.');
        $this->warn('');

        if (!$this->option('force')) {
            if (!$this->confirm('Are you absolutely sure you want to wipe all application data?')) {
                $this->info('Aborted. No data was changed.');
                return self::SUCCESS;
            }

            $confirm = $this->ask('Type "WIPE EVERYTHING" to confirm');
            if ($confirm !== 'WIPE EVERYTHING') {
                $this->error('Confirmation text did not match. Aborted.');
                return self::FAILURE;
            }
        }

        $preserveAdmin = $this->option('preserve-admin');
        $adminData     = null;

        // Capture super_admin credentials before wiping
        if ($preserveAdmin) {
            $adminUser = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))
                ->orWhere('role', 'super_admin')
                ->first();

            if ($adminUser) {
                $adminData = $adminUser->toArray();
                $this->info("Super admin account ({$adminUser->email}) will be preserved.");
            } else {
                $this->warn('No super_admin account found — one will be created after wipe.');
            }
        }

        $this->info('Starting data wipe...');
        $bar = $this->output->createProgressBar(count($this->wipeOrder));
        $bar->start();

        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        foreach ($this->wipeOrder as $table) {
            try {
                if (DB::getSchemaBuilder()->hasTable($table)) {
                    DB::table($table)->truncate();
                }
            } catch (\Exception $e) {
                $this->newLine();
                $this->warn("  Could not truncate {$table}: {$e->getMessage()}");
            }
            $bar->advance();
        }

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
        $bar->finish();
        $this->newLine(2);

        // Restore or create super_admin
        if ($preserveAdmin && $adminData) {
            $admin = User::create([
                'name'     => $adminData['name'],
                'email'    => $adminData['email'],
                'password' => $adminData['password'], // already hashed
                'role'     => 'super_admin',
                'status'   => 'active',
            ]);

            // Re-assign super_admin role
            $superAdminRole = \App\Models\Role::where('name', 'super_admin')->first();
            if ($superAdminRole) {
                $admin->assignRole($superAdminRole);
                $admin->update(['primary_role_id' => $superAdminRole->id]);
            }

            $this->info("Super admin account restored: {$admin->email}");
        } elseif (!$preserveAdmin) {
            // Create a fresh default super_admin
            $defaultPassword = 'Admin@' . rand(1000, 9999);
            $admin = User::create([
                'name'     => 'Super Admin',
                'email'    => 'admin@' . parse_url(config('app.url'), PHP_URL_HOST),
                'password' => Hash::make($defaultPassword),
                'role'     => 'super_admin',
                'status'   => 'active',
            ]);

            $superAdminRole = \App\Models\Role::where('name', 'super_admin')->first();
            if ($superAdminRole) {
                $admin->assignRole($superAdminRole);
                $admin->update(['primary_role_id' => $superAdminRole->id]);
            }

            $this->newLine();
            $this->info('Fresh super_admin created:');
            $this->table(['Field', 'Value'], [
                ['Email',    $admin->email],
                ['Password', $defaultPassword],
            ]);
            $this->warn('Save these credentials — the password is not stored in plain text.');
        }

        // Flush all caches
        try {
            Cache::flush();
        } catch (\Exception $e) {
            $this->warn('Cache flush failed: ' . $e->getMessage());
        }

        $this->newLine();
        $this->info('✓ Application data wiped successfully. The system is ready for client use.');

        return self::SUCCESS;
    }
}
