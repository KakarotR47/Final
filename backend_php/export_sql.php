<?php
/**
 * SA BROTHERS VENDORS - EXPORT LIVE SQL DATABASE DUMP
 * Streams a .sql file with CREATE TABLE and INSERT statements directly to browser.
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();

header('Content-Type: text/plain; charset=utf-8');
header('Content-Disposition: attachment; filename="sa_brothers_pos_' . date('Y-m-d_His') . '.sql"');

echo "-- ====================================================================\n";
echo "-- SA BROTHERS VENDORS - LIVE SQL DATABASE EXPORT\n";
echo "-- Generated: " . date('Y-m-d H:i:s') . "\n";
echo "-- ====================================================================\n\n";
echo "SET FOREIGN_KEY_CHECKS = 0;\n";
echo "SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n\n";

$tables = ['profiles', 'settings', 'categories', 'products', 'sale_transactions', 'sale_items', 'expenses', 'stock_movements', 'held_orders'];

foreach ($tables as $table) {
    // 1. Table structure
    $stmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
    $row = $stmt->fetch(PDO::FETCH_NUM);
    echo "DROP TABLE IF EXISTS `{$table}`;\n";
    echo $row[1] . ";\n\n";

    // 2. Data
    $dataStmt = $pdo->query("SELECT * FROM `{$table}`");
    $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($rows) > 0) {
        $columns = array_keys($rows[0]);
        $escapedColumns = array_map(function($c) { return "`{$c}`"; }, $columns);
        $colList = implode(', ', $escapedColumns);

        echo "INSERT INTO `{$table}` ({$colList}) VALUES\n";
        $valStrings = [];

        foreach ($rows as $r) {
            $vals = [];
            foreach ($r as $val) {
                if ($val === null) {
                    $vals[] = 'NULL';
                } elseif (is_numeric($val) && !is_string($val)) {
                    $vals[] = $val;
                } else {
                    $vals[] = $pdo->quote($val);
                }
            }
            $valStrings[] = '(' . implode(', ', $vals) . ')';
        }

        echo implode(",\n", $valStrings) . ";\n\n";
    }
}

echo "SET FOREIGN_KEY_CHECKS = 1;\n";
echo "-- END OF DUMP\n";
exit();
?>
