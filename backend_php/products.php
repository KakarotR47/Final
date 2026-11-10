<?php
/**
 * SA BROTHERS VENDORS - PRODUCTS REST API
 * Methods: GET (all), POST (add), PUT (update/restock), DELETE
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch all products
if ($method === 'GET') {
    $category = $_GET['category'] ?? null;
    $query = "SELECT * FROM products";
    $params = [];

    if ($category && $category !== 'All') {
        $query .= " WHERE category = :category";
        $params[':category'] = $category;
    }
    $query .= " ORDER BY category ASC, name ASC";

    $stmt = $pdo->prepare($query);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    // Cast numeric fields properly
    $products = array_map(function($p) {
        return [
            'id'                => $p['id'],
            'name'              => $p['name'],
            'sku'               => $p['sku'],
            'barcode'           => $p['barcode'],
            'category'          => $p['category'],
            'unit'              => $p['unit'],
            'costPrice'         => (float)$p['cost_price'],
            'sellingPrice'      => (float)$p['selling_price'],
            'currentStock'      => (int)$p['current_stock'],
            'initialStock'      => (int)$p['initial_stock'],
            'minStockThreshold' => (int)$p['min_stock_threshold'],
            'totalSold'         => (int)$p['total_sold'],
            'description'       => $p['description'],
            'updatedAt'         => $p['updated_at'],
        ];
    }, $rows);

    jsonResponse(['success' => true, 'count' => count($products), 'data' => $products]);
}

// POST: Add new product to catalog (Owner access)
if ($method === 'POST') {
    $input = getJsonInput();

    if (empty($input['name']) || !isset($input['sellingPrice'])) {
        jsonResponse(['success' => false, 'error' => 'Product name and selling price are required'], 400);
    }

    $id = !empty($input['id']) ? $input['id'] : 'prod-' . time() . '-' . rand(100, 999);
    $sku = !empty($input['sku']) ? $input['sku'] : 'SKU-' . strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $input['name']), 0, 4)) . '-' . rand(100, 999);
    $barcode = !empty($input['barcode']) ? $input['barcode'] : '890' . rand(1000000, 9999999);
    $category = !empty($input['category']) ? $input['category'] : 'Court Items';
    $unit = !empty($input['unit']) ? $input['unit'] : 'sheet';
    $costPrice = isset($input['costPrice']) ? (float)$input['costPrice'] : 0.0;
    $sellingPrice = (float)$input['sellingPrice'];
    $currentStock = isset($input['currentStock']) ? (int)$input['currentStock'] : 0;
    $minStock = isset($input['minStockThreshold']) ? (int)$input['minStockThreshold'] : 10;
    $description = $input['description'] ?? null;

    $stmt = $pdo->prepare("INSERT INTO products 
        (id, name, sku, barcode, category, unit, cost_price, selling_price, current_stock, initial_stock, min_stock_threshold, total_sold, description)
        VALUES 
        (:id, :name, :sku, :barcode, :category, :unit, :cost, :price, :stock, :initial, :min, 0, :desc)");

    $stmt->execute([
        ':id'       => $id,
        ':name'     => $input['name'],
        ':sku'      => $sku,
        ':barcode'  => $barcode,
        ':category' => $category,
        ':unit'     => $unit,
        ':cost'     => $costPrice,
        ':price'    => $sellingPrice,
        ':stock'    => $currentStock,
        ':initial'  => $currentStock,
        ':min'      => $minStock,
        ':desc'     => $description,
    ]);

    // Record stock movement if stock > 0
    if ($currentStock > 0) {
        $movStmt = $pdo->prepare("INSERT INTO stock_movements (id, product_id, product_name, type, quantity_delta, previous_stock, new_stock, reason, timestamp)
            VALUES (:id, :pid, :pname, 'restock', :delta, 0, :new, 'Initial catalog stock intake', NOW())");
        $movStmt->execute([
            ':id'    => 'mov-' . time() . '-' . rand(100, 999),
            ':pid'   => $id,
            ':pname' => $input['name'],
            ':delta' => $currentStock,
            ':new'   => $currentStock,
        ]);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Product created successfully',
        'product' => [
            'id'                => $id,
            'name'              => $input['name'],
            'sku'               => $sku,
            'barcode'           => $barcode,
            'category'          => $category,
            'unit'              => $unit,
            'costPrice'         => $costPrice,
            'sellingPrice'      => $sellingPrice,
            'currentStock'      => $currentStock,
            'minStockThreshold' => $minStock,
        ]
    ], 201);
}

// PUT: Update product, restock, or adjust stock
if ($method === 'PUT') {
    $id = $_GET['id'] ?? null;
    $input = getJsonInput();

    if (!$id && !empty($input['id'])) {
        $id = $input['id'];
    }

    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'Product ID is required for update'], 400);
    }

    // Check if product exists
    $checkStmt = $pdo->prepare("SELECT * FROM products WHERE id = :id");
    $checkStmt->execute([':id' => $id]);
    $existing = $checkStmt->fetch();

    if (!$existing) {
        jsonResponse(['success' => false, 'error' => 'Product not found'], 404);
    }

    // Restock operation
    if (isset($input['restockQuantity']) && (int)$input['restockQuantity'] > 0) {
        $qty = (int)$input['restockQuantity'];
        $newCost = isset($input['costPrice']) && (float)$input['costPrice'] > 0 ? (float)$input['costPrice'] : (float)$existing['cost_price'];
        $newStock = (int)$existing['current_stock'] + $qty;

        $updateStmt = $pdo->prepare("UPDATE products SET current_stock = :new_stock, cost_price = :cost, updated_at = NOW() WHERE id = :id");
        $updateStmt->execute([':new_stock' => $newStock, ':cost' => $newCost, ':id' => $id]);

        // Log movement
        $movStmt = $pdo->prepare("INSERT INTO stock_movements (id, product_id, product_name, type, quantity_delta, previous_stock, new_stock, reason, timestamp)
            VALUES (:id, :pid, :pname, 'restock', :delta, :prev, :new, :reason, NOW())");
        $movStmt->execute([
            ':id'     => 'mov-' . time() . '-' . rand(100, 999),
            ':pid'    => $id,
            ':pname'  => $existing['name'],
            ':delta'  => $qty,
            ':prev'   => (int)$existing['current_stock'],
            ':new'    => $newStock,
            ':reason' => $input['note'] ?? 'Supplier stock replenishment',
        ]);

        jsonResponse(['success' => true, 'message' => 'Product restocked successfully', 'newStock' => $newStock]);
    }

    // General update
    $fields = [];
    $params = [':id' => $id];

    if (isset($input['name'])) { $fields[] = "name = :name"; $params[':name'] = $input['name']; }
    if (isset($input['sellingPrice'])) { $fields[] = "selling_price = :price"; $params[':price'] = (float)$input['sellingPrice']; }
    if (isset($input['costPrice'])) { $fields[] = "cost_price = :cost"; $params[':cost'] = (float)$input['costPrice']; }
    if (isset($input['currentStock'])) { $fields[] = "current_stock = :stock"; $params[':stock'] = (int)$input['currentStock']; }
    if (isset($input['minStockThreshold'])) { $fields[] = "min_stock_threshold = :min"; $params[':min'] = (int)$input['minStockThreshold']; }
    if (isset($input['category'])) { $fields[] = "category = :cat"; $params[':cat'] = $input['category']; }
    if (isset($input['unit'])) { $fields[] = "unit = :unit"; $params[':unit'] = $input['unit']; }

    if (empty($fields)) {
        jsonResponse(['success' => false, 'error' => 'No valid fields provided to update'], 400);
    }

    $sql = "UPDATE products SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";
    $updateStmt = $pdo->prepare($sql);
    $updateStmt->execute($params);

    jsonResponse(['success' => true, 'message' => 'Product updated successfully']);
}

// DELETE: Remove product
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        jsonResponse(['success' => false, 'error' => 'Product ID is required for deletion'], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM products WHERE id = :id");
    $stmt->execute([':id' => $id]);
    jsonResponse(['success' => true, 'message' => 'Product deleted successfully']);
}

jsonResponse(['success' => false, 'error' => 'Invalid HTTP method'], 405);
?>
