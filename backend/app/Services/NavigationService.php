<?php

namespace App\Services;

use App\Models\User;

class NavigationService
{
    /**
     * Generate navigation menu for the given user
     */
    public function getNavigation(User $user): array
    {
        $menu = [
            [
                'title' => 'Dashboard',
                'icon' => 'LayoutDashboard',
                'path' => '/dashboard',
                'permission' => 'dashboard.view',
            ],
            [
                'title' => 'Employees',
                'icon' => 'Users',
                'path' => '/employees',
                'permission' => 'employees.view',
            ],
            [
                'title' => 'Attendance',
                'icon' => 'Clock',
                'path' => '/attendance',
                'permission' => 'attendance.view',
            ],
            [
                'title' => 'Leave',
                'icon' => 'Calendar',
                'path' => '/leave',
                'permission' => 'leave.view',
            ],
            [
                'title' => 'Payroll',
                'icon' => 'DollarSign',
                'path' => '/payroll',
                'permission' => 'payroll.view',
            ],
            [
                'title' => 'Settings',
                'icon' => 'Settings',
                'path' => '/settings',
                'permission' => 'settings.view',
            ],
        ];

        return array_filter($menu, function ($item) use ($user) {
            return $user->can($item['permission']);
        });
    }
}
