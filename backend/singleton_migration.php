<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;

DB::transaction(function () {
    $superRole = Role::where('name', 'super_admin')->first();
    $adminRole = Role::where('name', 'admin')->first();

    if (!$superRole || !$adminRole) {
        echo "Roles not found.\n";
        exit(1);
    }

    // 1. Promote admin@hr360.com
    $targetUser = User::where('email', 'admin@hr360.com')->first();
    if ($targetUser) {
        $targetUser->roles()->sync([$superRole->id]);
        $targetUser->update(['primary_role_id' => $superRole->id]);
        echo "Promoted " . $targetUser->email . " to super_admin.\n";
    } else {
        echo "Target user admin@hr360.com not found.\n";
    }

    // 2. Demote others
    $others = User::whereHas('roles', function ($q) use ($superRole) {
        $q->where('roles.id', $superRole->id);
    })->where('email', '!=', 'admin@hr360.com')->get();

    foreach ($others as $other) {
        $other->roles()->sync([$adminRole->id]);
        $other->update(['primary_role_id' => $adminRole->id]);
        echo "Demoted " . $other->email . " to admin.\n";
    }
});
