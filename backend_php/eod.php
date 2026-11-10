<?php
/**
 * SA BROTHERS VENDORS - END-OF-DAY (EOD) CLOSING Z-REPORT API
 * Computes daily gross sales, discounts, refunds, COGS, gross margin, expenses, net profit, drawer balancing
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

$date = $_GET['date'] ?? date('Y-m-d');

// 1. Settings for cash float
$setStmt = $pdo->query("SELECT default_cash_float, currency FROM settings WHERE id = 1");
$settingsRow = $setStmt->fetch();
$openingCashFloat = $settingsRow ? (float)$settingsRow['default_cash_float'] : 10000.0;
$currency = $settingsRow ? $settingsRow['currency'] : 'PKR';

// 2. Completed sales for date
$salesStmt = $pdo->prepare("SELECT * FROM sale_transactions WHERE DATE(timestamp) = :date AND status = 'completed'");
$salesStmt->execute([':date' => $date]);
$completedSales = $salesStmt->fetchAll();

// 3. Refunded sales for date
$refundStmt = $pdo->prepare("SELECT * FROM sale_transactions WHERE DATE(timestamp) = :date AND status = 'refunded'");
$refundStmt->execute([':date' => $date]);
$refundedSales = $refundStmt->fetchAll();

// 4. Expenses for date
$expStmt = $pdo->prepare("SELECT * FROM expenses WHERE date = :date");
$expStmt->execute([':date' => $date]);
$expenses = $expStmt->fetchAll();

$grossSales = 0.0;
$discountsGiven = 0.0;
$refundsGiven = 0.0;
$netSales = 0.0;
$totalCostOfGoods = 0.0;
$itemsSoldCount = 0;
$cashSales = 0.0;
$cardSales = 0.0;
$mobileSales = 0.0;

foreach ($completedSales as $s) {
    $grossSales += (float)$s['subtotal'];
    $discountsGiven += (float)$s['discount_amount'];
    $netSales += ((float)$s['subtotal'] - (float)$s['discount_amount']);
    $totalCostOfGoods += (float)$s['total_cost'];

    if ($s['payment_method'] === 'cash') $cashSales += (float)$s['grand_total'];
    elseif ($s['payment_method'] === 'card') $cardSales += (float)$s['grand_total'];
    elseif ($s['payment_method'] === 'mobile_qr') $mobileSales += (float)$s['grand_total'];

    // Item count
    $cntStmt = $pdo->prepare("SELECT SUM(quantity) as qty FROM sale_items WHERE transaction_id = :tx_id");
    $cntStmt->execute([':tx_id' => $s['id']]);
    $itemsSoldCount += (int)$cntStmt->fetchColumn();
}

foreach ($refundedSales as $r) {
    $refundsGiven += (float)$r['grand_total'];
}

$totalExpenses = 0.0;
$cashExpenses = 0.0;
foreach ($expenses as $e) {
    $totalExpenses += (float)$e['amount'];
    if ($e['payment_method'] === 'cash') {
        $cashExpenses += (float)$e['amount'];
    }
}

$grossProfit = $netSales - $totalCostOfGoods;
$netDailyProfit = $grossProfit - $totalExpenses;
$grossMarginPercent = $netSales > 0 ? round(($grossProfit / $netSales) * 100, 1) : 0.0;
$expectedCashInDrawer = $openingCashFloat + $cashSales - $cashExpenses;

// Low stock items count
$lowStockStmt = $pdo->query("SELECT COUNT(*) FROM products WHERE current_stock <= min_stock_threshold");
$lowStockAlertCount = (int)$lowStockStmt->fetchColumn();

// Top selling products for date
$topStmt = $pdo->prepare("SELECT si.name, SUM(si.quantity) as quantity, SUM(si.total) as revenue, SUM(si.profit) as profit 
    FROM sale_items si 
    JOIN sale_transactions st ON si.transaction_id = st.id 
    WHERE DATE(st.timestamp) = :date AND st.status = 'completed' 
    GROUP BY si.product_id, si.name 
    ORDER BY revenue DESC LIMIT 5");
$topStmt->execute([':date' => $date]);
$topSellingProducts = $topStmt->fetchAll();

jsonResponse([
    'success' => true,
    'data' => [
        'date'                 => $date,
        'generatedAt'          => date('c'),
        'currency'             => $currency,
        'openingCashFloat'     => $openingCashFloat,
        'cashSales'            => round($cashSales, 2),
        'cardSales'            => round($cardSales, 2),
        'mobileSales'          => round($mobileSales, 2),
        'grossSales'           => round($grossSales, 2),
        'discountsGiven'       => round($discountsGiven, 2),
        'refundsGiven'         => round($refundsGiven, 2),
        'netSales'             => round($netSales, 2),
        'totalCostOfGoods'     => round($totalCostOfGoods, 2),
        'grossProfit'          => round($grossProfit, 2),
        'grossMarginPercent'   => $grossMarginPercent,
        'totalExpenses'        => round($totalExpenses, 2),
        'cashExpenses'         => round($cashExpenses, 2),
        'netDailyProfit'       => round($netDailyProfit, 2),
        'expectedCashInDrawer' => round($expectedCashInDrawer, 2),
        'transactionCount'     => count($completedSales),
        'itemsSoldCount'       => $itemsSoldCount,
        'lowStockAlertCount'   => $lowStockAlertCount,
        'topSellingProducts'   => $topSellingProducts,
    ]
]);
?>
