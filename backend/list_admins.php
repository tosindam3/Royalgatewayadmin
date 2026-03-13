<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Role;

$roles = Role::whereIn('name', ['super_admin', 'admin', 'hr_manager'])->with('users')->get();

foreach ($roles as $role) {
    echo "Role: " . $role->name . " (" . $role->display_name . ")\n";
    $users = $role->users;
    foreach ($users as $user) {
        echo " - " . $user->name . " (" . $user->email . ")\n";
    }
}
