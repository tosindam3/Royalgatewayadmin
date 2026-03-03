<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\MemoFolder;
use App\Models\MemoSignature;

class MemoSystemSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::with('employee.designation', 'employee.department')->get();
        
        foreach ($users as $user) {
            $this->createSystemFolders($user);
            $this->createDefaultSignature($user);
        }
        
        $this->command->info('Memo system initialized for ' . $users->count() . ' users');
    }

    protected function createSystemFolders(User $user): void
    {
        $systemFolders = config('memo.system_folders');
        
        foreach ($systemFolders as $slug => $config) {
            MemoFolder::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'slug' => $slug,
                ],
                [
                    'name' => $config['name'],
                    'icon' => $config['icon'],
                    'sort_order' => $config['sort'],
                    'is_system' => true,
                    'is_visible' => true,
                ]
            );
        }
    }

    protected function createDefaultSignature(User $user): void
    {
        $employee = $user->employee;
        
        if (!$employee) {
            return;
        }
        
        $designationName = $employee->designation ? $employee->designation->name : 'Employee';
        $departmentName = $employee->department ? $employee->department->name : '';
        
        $signatureContent = "
            <div style='font-family: Arial, sans-serif; color: #334155;'>
                <p style='margin: 0; font-weight: bold; font-size: 14px;'>{$employee->first_name} {$employee->last_name}</p>
                <p style='margin: 4px 0 0 0; font-size: 12px; color: #64748b;'>{$designationName}</p>
                <p style='margin: 4px 0 0 0; font-size: 12px; color: #64748b;'>{$departmentName} Department</p>
                <p style='margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;'>
                    <a href='mailto:{$user->email}' style='color: #8252e9; text-decoration: none;'>{$user->email}</a>
                </p>
            </div>
        ";
        
        MemoSignature::firstOrCreate(
            [
                'user_id' => $user->id,
                'name' => 'Default Signature',
            ],
            [
                'content' => trim($signatureContent),
                'is_default' => true,
                'is_active' => true,
            ]
        );
    }
}
