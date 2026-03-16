<?php
use App\Models\User;
use App\Services\ScopeEngine;

$user = User::with(['roles.permissions', 'primaryRole.permissions', 'employeeProfile'])
    ->where('email', 'like', '%alex%')->first();
if (!$user) {
    echo "User Alex not found!\n";
    exit(1);
}

$user->load(['roles.permissions', 'primaryRole.permissions', 'employeeProfile']);
$scopeEngine = app(ScopeEngine::class);

echo "User: {$user->name} (ID: {$user->id})\n";
echo "Roles: " . $user->all_roles->pluck('name')->implode(', ') . "\n";

$permissions = ['employees.view', 'dashboard.view', 'memo.view'];

foreach ($permissions as $p) {
    $has = $user->hasPermission($p) ? 'YES' : 'NO';
    $scope = $scopeEngine->getUserScope($user, $p);
    echo "Permission: $p, Has: $has, Scope: $scope\n";
}
