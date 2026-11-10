<?php
/**
 * SA BROTHERS VENDORS - DATABASE & API CONFIGURATION
 * Place this file inside your hosting public_html/api/ or backend directory.
 */

// 1. DATABASE CREDENTIALS (Edit these to match your cPanel / MySQL details)
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'sa_brothers_pos');
define('DB_USER', 'root');           // E.g. cPanel user: u123456_sabrothers
define('DB_PASS', '');               // E.g. Strong password set in MySQL Database Wizard
define('DB_CHARSET', 'utf8mb4');

// 2. CORS & HTTP HEADERS (Allows frontend on custom domain to query API)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. PDO DATABASE CONNECTION SINGLETON
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error'   => 'Database connection failed: ' . $e->getMessage(),
                'hint'    => 'Check DB_HOST, DB_NAME, DB_USER, and DB_PASS in config.php'
            ]);
            exit();
        }
    }
    return $pdo;
}

// 4. HELPER FUNCTIONS
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function getJsonInput() {
    $raw = file_get_contents('php://input');
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
?>
