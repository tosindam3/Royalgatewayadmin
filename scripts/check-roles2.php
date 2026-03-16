<?php
// Direct DB query without Laravel bootstrap
$pdo = new PDO('mysql:host=127.0.0.1;dbname=u237094395_royalgateway', 'u237094395_admin', 'Solotech@123');

echo "=== Users ===\n";
$stmt = $pdo->query("SELECT id, email, primary_role_id FROM users");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "id={$row['id']} email={$row['email']} primary_role_id={$row['primary_role_id']}\n";
}

echo "\n=== Roles ===\n";
$stmt = $pdo->query("SELECT id, name, display_name FROM roles");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "id={$row['id']} name={$row['name']} display={$row['display_name']}\n";
}

echo "\n=== user_roles ===\n";
$stmt = $pdo->query("SELECT ur.user_id, u.email, r.name as role_name FROM user_roles ur JOIN users u ON u.id=ur.user_id JOIN roles r ON r.id=ur.role_id");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "user={$row['email']} role={$row['role_name']}\n";
}

echo "\n=== dashboard.management permission ===\n";
$stmt = $pdo->query("SELECT id, name FROM permissions WHERE name='dashboard.management'");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "id={$row['id']} name={$row['name']}\n";
}

echo "\n=== super_admin role permissions (dashboard.*) ===\n";
$stmt = $pdo->query("SELECT r.name as role, p.name as perm FROM role_permissions rp JOIN roles r ON r.id=rp.role_id JOIN permissions p ON p.id=rp.permission_id WHERE r.name='super_admin' AND p.name LIKE 'dashboard%'");
foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo "role={$row['role']} perm={$row['perm']}\n";
}
