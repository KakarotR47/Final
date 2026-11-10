<?php
/**
 * SA BROTHERS VENDORS - PROFILES & ACCESS CONTROL REST API
 * Methods: GET (profiles list), POST (PIN verification), PUT (PIN change by owner)
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: List profiles
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT id, name, role, pin, title, avatar_color as avatarColor FROM profiles ORDER BY role ASC");
    $profiles = $stmt->fetchAll();
    jsonResponse(['success' => true, 'data' => $profiles]);
}

// POST: Verify PIN
if ($method === 'POST') {
    $input = getJsonInput();
    $profileId = $input['profileId'] ?? null;
    $enteredPin = trim($input['pin'] ?? '');

    if (!$profileId || empty($enteredPin)) {
        jsonResponse(['success' => false, 'error' => 'Profile ID and PIN are required'], 400);
    }

    $stmt = $pdo->prepare("SELECT * FROM profiles WHERE id = :id");
    $stmt->execute([':id' => $profileId]);
    $profile = $stmt->fetch();

    if (!$profile) {
        jsonResponse(['success' => false, 'error' => 'Profile not found'], 404);
    }

    if (trim($profile['pin']) === $enteredPin) {
        jsonResponse([
            'success' => true,
            'message' => 'PIN verified successfully',
            'profile' => [
                'id'          => $profile['id'],
                'name'        => $profile['name'],
                'role'        => $profile['role'],
                'title'       => $profile['title'],
                'avatarColor' => $profile['avatar_color'],
            ]
        ]);
    } else {
        jsonResponse(['success' => false, 'error' => 'Incorrect password / PIN code'], 401);
    }
}

// PUT: Owner updates PIN or profile name
if ($method === 'PUT') {
    $input = getJsonInput();
    $id = $_GET['id'] ?? ($input['id'] ?? null);

    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'Profile ID required'], 400);
    }

    $fields = [];
    $params = [':id' => $id];

    if (!empty($input['pin'])) {
        $pin = trim($input['pin']);
        if (strlen($pin) < 4) {
            jsonResponse(['success' => false, 'error' => 'PIN must be at least 4 characters'], 400);
        }
        $fields[] = "pin = :pin";
        $params[':pin'] = $pin;
    }

    if (!empty($input['name'])) {
        $fields[] = "name = :name";
        $params[':name'] = trim($input['name']);
    }

    if (empty($fields)) {
        jsonResponse(['success' => false, 'error' => 'No valid fields provided to update'], 400);
    }

    $sql = "UPDATE profiles SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse(['success' => true, 'message' => 'Profile credentials updated successfully']);
}

jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
?>
