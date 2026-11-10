<?php
/**
 * SA BROTHERS VENDORS - STORE SETTINGS REST API
 * Methods: GET (load), POST (update)
 */

require_once __DIR__ . '/config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
    $settings = $stmt->fetch();

    if (!$settings) {
        // Fallback default
        $settings = [
            'shopName'         => 'SA Brothers Vendors',
            'tagline'          => 'Court Stamp Vendors & Legal Paper',
            'address'          => 'Shop #14, District Court Complex, Main Law Bazaar',
            'phone'            => '+92 (300) 582-9011',
            'email'            => 'contact@sabrothersvendors.com',
            'taxNumber'        => 'PK-NTN-8924018',
            'currency'         => 'PKR',
            'taxRatePercent'   => 0.0,
            'receiptHeader'    => 'Thank you for choosing SA Brothers Vendors!',
            'receiptFooter'    => 'Court stamp papers & legal forms verified authentic. Shukriya!',
            'defaultCashFloat' => 10000.0,
            'cashierName'      => 'Muhammad Ali (Counter 1)',
        ];
    } else {
        $settings = [
            'shopName'         => $settings['shop_name'],
            'tagline'          => $settings['tagline'],
            'address'          => $settings['address'],
            'phone'            => $settings['phone'],
            'email'            => $settings['email'],
            'taxNumber'        => $settings['tax_number'],
            'currency'         => $settings['currency'],
            'taxRatePercent'   => (float)$settings['tax_rate_percent'],
            'receiptHeader'    => $settings['receipt_header'],
            'receiptFooter'    => $settings['receipt_footer'],
            'defaultCashFloat' => (float)$settings['default_cash_float'],
            'cashierName'      => $settings['cashier_name'],
        ];
    }

    jsonResponse(['success' => true, 'data' => $settings]);
}

if ($method === 'POST') {
    $input = getJsonInput();

    $stmt = $pdo->prepare("UPDATE settings SET 
        shop_name = :shop_name,
        tagline = :tagline,
        address = :address,
        phone = :phone,
        email = :email,
        tax_number = :tax_number,
        currency = :currency,
        tax_rate_percent = :tax_rate,
        receipt_header = :header,
        receipt_footer = :footer,
        default_cash_float = :float_amt,
        cashier_name = :cashier
        WHERE id = 1");

    $stmt->execute([
        ':shop_name' => $input['shopName'] ?? 'SA Brothers Vendors',
        ':tagline'   => $input['tagline'] ?? 'Court Stamp Vendors & Legal Paper',
        ':address'   => $input['address'] ?? '',
        ':phone'     => $input['phone'] ?? '',
        ':email'     => $input['email'] ?? '',
        ':tax_number'=> $input['taxNumber'] ?? '',
        ':currency'  => $input['currency'] ?? 'PKR',
        ':tax_rate'  => (float)($input['taxRatePercent'] ?? 0.0),
        ':header'    => $input['receiptHeader'] ?? '',
        ':footer'    => $input['receiptFooter'] ?? '',
        ':float_amt' => (float)($input['defaultCashFloat'] ?? 10000.0),
        ':cashier'   => $input['cashierName'] ?? 'Muhammad Ali (Counter 1)',
    ]);

    jsonResponse(['success' => true, 'message' => 'Store settings saved successfully']);
}

jsonResponse(['success' => false, 'error' => 'Method not allowed'], 405);
?>
