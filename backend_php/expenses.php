<?php
/**
 * SA BROTHERS VENDORS - EXPENSES REST API
 * Methods: GET (list), POST (add), DELETE (remove)
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $date = $_GET['date'] ?? null;
    $sql = "SELECT * FROM expenses";
    $params = [];

    if ($date) {
        $sql .= " WHERE date = :date";
        $params[':date'] = $date;
    }
    $sql .= " ORDER BY timestamp DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $expenses = $stmt->fetchAll();

    $data = array_map(function($e) {
        return [
            'id'            => $e['id'],
            'title'         => $e['title'],
            'amount'        => (float)$e['amount'],
            'category'      => $e['category'],
            'paymentMethod' => $e['payment_method'],
            'notes'         => $e['notes'],
            'date'          => $e['date'],
            'timestamp'     => $e['timestamp'],
        ];
    }, $expenses);

    jsonResponse(['success' => true, 'count' => count($data), 'data' => $data]);
}

if ($method === 'POST') {
    $input = getJsonInput();

    if (empty($input['title']) || !isset($input['amount']) || (float)$input['amount'] <= 0) {
        jsonResponse(['success' => false, 'error' => 'Title and positive amount are required'], 400);
    }

    $id = !empty($input['id']) ? $input['id'] : 'exp-' . round(microtime(true) * 1000);
    $title = trim($input['title']);
    $amount = (float)$input['amount'];
    $category = !empty($input['category']) ? $input['category'] : 'Supplies';
    $paymentMethod = !empty($input['paymentMethod']) ? $input['paymentMethod'] : 'cash';
    $notes = !empty($input['notes']) ? trim($input['notes']) : null;
    $date = !empty($input['date']) ? $input['date'] : date('Y-m-d');

    $stmt = $pdo->prepare("INSERT INTO expenses 
        (id, title, amount, category, payment_method, notes, date, timestamp)
        VALUES
        (:id, :title, :amount, :category, :pay_method, :notes, :date, NOW())");

    $stmt->execute([
        ':id'         => $id,
        ':title'      => $title,
        ':amount'     => $amount,
        ':category'   => $category,
        ':pay_method' => $paymentMethod,
        ':notes'      => $notes,
        ':date'       => $date,
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Expense recorded successfully',
        'expense' => [
            'id'            => $id,
            'title'         => $title,
            'amount'        => $amount,
            'category'      => $category,
            'paymentMethod' => $paymentMethod,
            'notes'         => $notes,
            'date'          => $date,
            'timestamp'     => date('c'),
        ]
    ], 201);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'Expense ID required'], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM expenses WHERE id = :id");
    $stmt->execute([':id' => $id]);
    jsonResponse(['success' => true, 'message' => 'Expense removed successfully']);
}

jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
?>
