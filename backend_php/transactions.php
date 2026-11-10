<?php
/**
 * SA BROTHERS VENDORS - SALES TRANSACTIONS & CHECKOUT REST API
 * Handles:
 *  - GET: list completed / refunded transactions and line items
 *  - POST: atomic POS sale checkout (inserts transaction, items, decrements inventory, logs audit movement)
 *  - PUT: customer refund & stock restoration
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch transactions
if ($method === 'GET') {
    $txId = $_GET['id'] ?? null;
    $date = $_GET['date'] ?? null;

    if ($txId) {
        $stmt = $pdo->prepare("SELECT * FROM sale_transactions WHERE id = :id");
        $stmt->execute([':id' => $txId]);
        $tx = $stmt->fetch();

        if (!$tx) {
            jsonResponse(['success' => false, 'error' => 'Transaction not found'], 404);
        }

        $itemsStmt = $pdo->prepare("SELECT * FROM sale_items WHERE transaction_id = :tx_id");
        $itemsStmt->execute([':tx_id' => $txId]);
        $tx['items'] = $itemsStmt->fetchAll();

        jsonResponse(['success' => true, 'data' => $tx]);
    }

    $sql = "SELECT * FROM sale_transactions";
    $params = [];

    if ($date) {
        $sql .= " WHERE DATE(timestamp) = :date";
        $params[':date'] = $date;
    }
    $sql .= " ORDER BY timestamp DESC LIMIT 200";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $transactions = $stmt->fetchAll();

    // Fetch line items for each transaction
    foreach ($transactions as &$t) {
        $itemsStmt = $pdo->prepare("SELECT product_id as productId, name, sku, quantity, unit_price as unitPrice, cost_price as costPrice, total, profit FROM sale_items WHERE transaction_id = :tx_id");
        $itemsStmt->execute([':tx_id' => $t['id']]);
        $t['items'] = $itemsStmt->fetchAll();

        // Cast numerics
        $t['subtotal']       = (float)$t['subtotal'];
        $t['discountAmount'] = (float)$t['discount_amount'];
        $t['discountPercent']= (float)$t['discount_percent'];
        $t['taxRate']        = (float)$t['tax_rate'];
        $t['taxAmount']      = (float)$t['tax_amount'];
        $t['grandTotal']     = (float)$t['grand_total'];
        $t['totalCost']      = (float)$t['total_cost'];
        $t['grossProfit']    = (float)$t['gross_profit'];
        $t['amountTendered'] = (float)$t['amount_tendered'];
        $t['changeDue']      = (float)$t['change_due'];
        $t['receiptNumber']  = $t['receipt_number'];
        $t['paymentMethod']  = $t['payment_method'];
        $t['customerName']   = $t['customer_name'];
        $t['customerPhone']  = $t['customer_phone'];
        $t['cashierName']    = $t['cashier_name'];
    }

    jsonResponse(['success' => true, 'count' => count($transactions), 'data' => $transactions]);
}

// POST: Process POS Sale Checkout
if ($method === 'POST') {
    $input = getJsonInput();

    $items = $input['items'] ?? [];
    if (empty($items)) {
        jsonResponse(['success' => false, 'error' => 'Cart items are required for checkout'], 400);
    }

    $paymentMethod  = $input['paymentMethod'] ?? 'cash';
    $amountTendered = isset($input['amountTendered']) ? (float)$input['amountTendered'] : 0.0;
    $cartDiscount   = isset($input['discountPercent']) ? (float)$input['discountPercent'] : 0.0;
    $customerName   = !empty($input['customerName']) ? trim($input['customerName']) : null;
    $customerPhone  = !empty($input['customerPhone']) ? trim($input['customerPhone']) : null;
    $notes          = !empty($input['notes']) ? trim($input['notes']) : null;
    $cashierName    = $input['cashierName'] ?? 'Muhammad Ali (Counter 1)';

    try {
        $pdo->beginTransaction();

        $todayCode = date('Ymd');
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM sale_transactions WHERE DATE(timestamp) = CURDATE()");
        $countStmt->execute();
        $dailyCount = (int)$countStmt->fetchColumn() + 1;

        $receiptNumber = "RCP-{$todayCode}-" . str_pad($dailyCount, 4, '0', STR_PAD_LEFT);
        $txId = 'tx-' . round(microtime(true) * 1000);

        $subtotal = 0.0;
        $totalCost = 0.0;
        $processedItems = [];

        // Verify and calculate each line item
        foreach ($items as $item) {
            $pid = $item['productId'] ?? ($item['product']['id'] ?? null);
            $qty = isset($item['quantity']) ? (int)$item['quantity'] : 1;
            if (!$pid || $qty <= 0) continue;

            $prodStmt = $pdo->prepare("SELECT * FROM products WHERE id = :id FOR UPDATE");
            $prodStmt->execute([':id' => $pid]);
            $prod = $prodStmt->fetch();

            if (!$prod) {
                throw new Exception("Product ID {$pid} not found in database.");
            }

            $unitPrice = (float)$prod['selling_price'];
            $costPrice = (float)$prod['cost_price'];
            $lineTotal = $unitPrice * $qty;
            $lineCost = $costPrice * $qty;
            $lineProfit = $lineTotal - $lineCost;

            $subtotal += $lineTotal;
            $totalCost += $lineCost;

            $processedItems[] = [
                'productId' => $pid,
                'name'      => $prod['name'],
                'sku'       => $prod['sku'],
                'quantity'  => $qty,
                'unitPrice' => $unitPrice,
                'costPrice' => $costPrice,
                'total'     => $lineTotal,
                'profit'    => $lineProfit,
                'prevStock' => (int)$prod['current_stock'],
            ];
        }

        $discountAmount = round(($subtotal * $cartDiscount) / 100, 2);
        $grandTotal = round($subtotal - $discountAmount, 2);
        $grossProfit = round(($subtotal - $discountAmount) - $totalCost, 2);
        $finalTendered = ($paymentMethod === 'cash') ? max($amountTendered, $grandTotal) : $grandTotal;
        $changeDue = max(0.0, $finalTendered - $grandTotal);

        // 1. Insert Transaction Header
        $insertTx = $pdo->prepare("INSERT INTO sale_transactions 
            (id, receipt_number, timestamp, subtotal, discount_amount, discount_percent, tax_rate, tax_amount, grand_total, total_cost, gross_profit, payment_method, amount_tendered, change_due, customer_name, customer_phone, cashier_name, notes, status)
            VALUES
            (:id, :rcp, NOW(), :subtotal, :disc_amt, :disc_pct, 0.00, 0.00, :grand, :cost, :profit, :pay_method, :tendered, :change, :cname, :cphone, :cashier, :notes, 'completed')");

        $insertTx->execute([
            ':id'         => $txId,
            ':rcp'        => $receiptNumber,
            ':subtotal'   => $subtotal,
            ':disc_amt'   => $discountAmount,
            ':disc_pct'   => $cartDiscount,
            ':grand'      => $grandTotal,
            ':cost'       => $totalCost,
            ':profit'     => $grossProfit,
            ':pay_method' => $paymentMethod,
            ':tendered'   => $finalTendered,
            ':change'     => $changeDue,
            ':cname'      => $customerName,
            ':cphone'     => $customerPhone,
            ':cashier'    => $cashierName,
            ':notes'      => $notes,
        ]);

        // 2. Insert line items & decrement stock
        $insertItem = $pdo->prepare("INSERT INTO sale_items 
            (transaction_id, product_id, name, sku, quantity, unit_price, cost_price, total, profit)
            VALUES
            (:tx_id, :pid, :name, :sku, :qty, :unit_price, :cost_price, :total, :profit)");

        $updateStock = $pdo->prepare("UPDATE products SET current_stock = GREATEST(0, current_stock - :qty), total_sold = total_sold + :qty, updated_at = NOW() WHERE id = :pid");

        $insertMov = $pdo->prepare("INSERT INTO stock_movements 
            (id, product_id, product_name, type, quantity_delta, previous_stock, new_stock, reason, timestamp)
            VALUES
            (:id, :pid, :pname, 'sale', :delta, :prev, :new, :reason, NOW())");

        foreach ($processedItems as $item) {
            $insertItem->execute([
                ':tx_id'      => $txId,
                ':pid'        => $item['productId'],
                ':name'       => $item['name'],
                ':sku'        => $item['sku'],
                ':qty'        => $item['quantity'],
                ':unit_price' => $item['unitPrice'],
                ':cost_price' => $item['costPrice'],
                ':total'      => $item['total'],
                ':profit'     => $item['profit'],
            ]);

            $updateStock->execute([
                ':qty' => $item['quantity'],
                ':pid' => $item['productId'],
            ]);

            $newStock = max(0, $item['prevStock'] - $item['quantity']);
            $insertMov->execute([
                ':id'     => 'mov-' . microtime(true) . '-' . rand(10, 99),
                ':pid'    => $item['productId'],
                ':pname'  => $item['name'],
                ':delta'  => -$item['quantity'],
                ':prev'   => $item['prevStock'],
                ':new'    => $newStock,
                ':reason' => "Sale {$receiptNumber}",
            ]);
        }

        $pdo->commit();

        jsonResponse([
            'success' => true,
            'message' => 'Sale processed successfully',
            'transaction' => [
                'id'             => $txId,
                'receiptNumber'  => $receiptNumber,
                'timestamp'      => date('c'),
                'items'          => $processedItems,
                'subtotal'       => $subtotal,
                'discountAmount' => $discountAmount,
                'grandTotal'     => $grandTotal,
                'grossProfit'    => $grossProfit,
                'paymentMethod'  => $paymentMethod,
                'amountTendered' => $finalTendered,
                'changeDue'      => $changeDue,
                'customerName'   => $customerName,
                'status'         => 'completed',
            ]
        ], 201);

    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'error' => 'Checkout failed: ' . $e->getMessage()], 500);
    }
}

// PUT: Customer Refund & Restock
if ($method === 'PUT') {
    $txId = $_GET['id'] ?? null;
    $action = $_GET['action'] ?? 'refund';

    if (!$txId) {
        jsonResponse(['success' => false, 'error' => 'Transaction ID required for refund'], 400);
    }

    try {
        $pdo->beginTransaction();

        $txStmt = $pdo->prepare("SELECT * FROM sale_transactions WHERE id = :id FOR UPDATE");
        $txStmt->execute([':id' => $txId]);
        $tx = $txStmt->fetch();

        if (!$tx) {
            throw new Exception("Transaction not found.");
        }

        if ($tx['status'] === 'refunded') {
            throw new Exception("Transaction is already refunded.");
        }

        // Fetch items
        $itemsStmt = $pdo->prepare("SELECT * FROM sale_items WHERE transaction_id = :tx_id");
        $itemsStmt->execute([':tx_id' => $txId]);
        $items = $itemsStmt->fetchAll();

        // Restore stock
        $updateStock = $pdo->prepare("UPDATE products SET current_stock = current_stock + :qty, total_sold = GREATEST(0, total_sold - :qty), updated_at = NOW() WHERE id = :pid");
        $getProd = $pdo->prepare("SELECT current_stock, name FROM products WHERE id = :pid");
        $insertMov = $pdo->prepare("INSERT INTO stock_movements (id, product_id, product_name, type, quantity_delta, previous_stock, new_stock, reason, timestamp) VALUES (:id, :pid, :pname, 'refund', :delta, :prev, :new, :reason, NOW())");

        foreach ($items as $item) {
            $getProd->execute([':pid' => $item['product_id']]);
            $p = $getProd->fetch();
            $prevStock = (int)$p['current_stock'];
            $newStock = $prevStock + (int)$item['quantity'];

            $updateStock->execute([':qty' => $item['quantity'], ':pid' => $item['product_id']]);

            $insertMov->execute([
                ':id'     => 'mov-' . microtime(true) . '-' . rand(10, 99),
                ':pid'    => $item['product_id'],
                ':pname'  => $item['name'],
                ':delta'  => (int)$item['quantity'],
                ':prev'   => $prevStock,
                ':new'    => $newStock,
                ':reason' => "Refund for {$tx['receipt_number']}",
            ]);
        }

        // Mark refunded
        $updateTx = $pdo->prepare("UPDATE sale_transactions SET status = 'refunded' WHERE id = :id");
        $updateTx->execute([':id' => $txId]);

        $pdo->commit();
        jsonResponse(['success' => true, 'message' => "Receipt {$tx['receipt_number']} refunded and stock restored"]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'error' => 'Refund failed: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
?>
