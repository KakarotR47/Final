-- ====================================================================
-- SA BROTHERS VENDORS - POINT OF SALE (POS) & INVENTORY DATABASE
-- System: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+
-- Generated for cPanel / phpMyAdmin / Apache / PHP Web Hosting
-- Currency: PKR (Rs.) | Tax: 0% | Encoding: utf8mb4
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `sa_brothers_pos` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sa_brothers_pos`;

-- --------------------------------------------------------
-- Table structure for table `profiles`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `profiles`;
CREATE TABLE `profiles` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('owner','staff') NOT NULL DEFAULT 'staff',
  `pin` varchar(20) NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `avatar_color` varchar(50) DEFAULT 'from-amber-500 to-amber-700',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default profiles (Owner PIN: 1234, Staff PIN: 0000)
INSERT INTO `profiles` (`id`, `name`, `role`, `pin`, `title`, `avatar_color`) VALUES
('prof-owner', 'Shop Owner (Admin)', 'owner', '1234', 'Owner - Full Administrative Access', 'from-amber-500 to-amber-700'),
('prof-staff', 'Staff Cashier', 'staff', '0000', 'Staff - Sales & Expenses', 'from-blue-500 to-indigo-600');

-- --------------------------------------------------------
-- Table structure for table `settings`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL DEFAULT 1,
  `shop_name` varchar(150) NOT NULL DEFAULT 'SA Brothers Vendors',
  `tagline` varchar(255) DEFAULT 'Court Stamp Vendors & Legal Paper',
  `address` text DEFAULT 'Shop #14, District Court Complex, Main Law Bazaar',
  `phone` varchar(50) DEFAULT '+92 (300) 582-9011',
  `email` varchar(100) DEFAULT 'contact@sabrothersvendors.com',
  `tax_number` varchar(50) DEFAULT 'PK-NTN-8924018',
  `currency` varchar(10) NOT NULL DEFAULT 'PKR',
  `tax_rate_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `receipt_header` text DEFAULT 'Thank you for choosing SA Brothers Vendors!',
  `receipt_footer` text DEFAULT 'Court stamp papers & legal forms verified authentic. Shukriya!',
  `default_cash_float` decimal(10,2) NOT NULL DEFAULT 10000.00,
  `cashier_name` varchar(100) DEFAULT 'Muhammad Ali (Counter 1)',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `settings` (`id`, `shop_name`, `tagline`, `address`, `phone`, `email`, `tax_number`, `currency`, `tax_rate_percent`, `receipt_header`, `receipt_footer`, `default_cash_float`, `cashier_name`) VALUES
(1, 'SA Brothers Vendors', 'Court Stamp Vendors & Legal Paper', 'Shop #14, District Court Complex, Main Law Bazaar', '+92 (300) 582-9011', 'contact@sabrothersvendors.com', 'PK-NTN-8924018', 'PKR', 0.00, 'Thank you for choosing SA Brothers Vendors!', 'Court stamp papers & legal forms verified authentic. Shukriya!', 10000.00, 'Muhammad Ali (Counter 1)');

-- --------------------------------------------------------
-- Table structure for table `categories`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Court Items'),
(2, 'Office Paper'),
(3, 'Stationery');

-- --------------------------------------------------------
-- Table structure for table `products`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'Court Items',
  `unit` varchar(50) NOT NULL DEFAULT 'sheet',
  `cost_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `selling_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `current_stock` int(11) NOT NULL DEFAULT 0,
  `initial_stock` int(11) NOT NULL DEFAULT 0,
  `min_stock_threshold` int(11) NOT NULL DEFAULT 10,
  `total_sold` int(11) NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_category` (`category`),
  KEY `idx_barcode` (`barcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`id`, `name`, `sku`, `barcode`, `category`, `unit`, `cost_price`, `selling_price`, `current_stock`, `initial_stock`, `min_stock_threshold`, `total_sold`, `description`) VALUES
('court-v5-001', 'Rs50 Stamp', 'CRT-STP-50', '8901001001', 'Court Items', 'sheet', 48.00, 50.00, 400, 500, 50, 100, 'Rs. 50 Judicial Stamp Paper Sheet'),
('court-v5-002', 'Rs100 Stamp', 'CRT-STP-100', '8901001002', 'Court Items', 'sheet', 96.00, 100.00, 350, 500, 50, 150, 'Rs. 100 Judicial Stamp Paper Sheet'),
('court-v5-003', 'Rs200 Stamp', 'CRT-STP-200', '8901001003', 'Court Items', 'sheet', 190.00, 200.00, 250, 300, 30, 50, 'Rs. 200 Judicial Stamp Paper Sheet'),
('court-v5-004', 'Rs500 Stamp', 'CRT-STP-500', '8901001004', 'Court Items', 'sheet', 480.00, 500.00, 120, 150, 20, 30, 'Rs. 500 Legal Deed & Stamp Paper Sheet'),
('court-v5-005', 'Rs1000 Stamp', 'CRT-STP-1000', '8901001005', 'Court Items', 'sheet', 960.00, 1000.00, 65, 80, 10, 15, 'Rs. 1000 High-Denomination Stamp Paper Sheet'),
('court-v5-006', 'Backdate Stamp', 'CRT-STP-BKD', '8901001006', 'Court Items', 'sheet', 800.00, 1200.00, 35, 40, 5, 5, 'Backdated verification & issued legal stamp paper'),
('court-v5-007', 'Rs50-Agreements', 'CRT-AGR-50', '8901001007', 'Court Items', 'sheet', 45.00, 70.00, 280, 350, 35, 70, 'Rs. 50 Legal Agreement & Contract Paper Form'),
('court-v5-008', 'Rs100-Agreements', 'CRT-AGR-100', '8901001008', 'Court Items', 'sheet', 90.00, 130.00, 220, 300, 30, 80, 'Rs. 100 Legal Agreement & Tenancy Deed Form'),
('court-v5-009', 'Rs200-Agreements', 'CRT-AGR-200', '8901001009', 'Court Items', 'sheet', 180.00, 250.00, 180, 220, 20, 40, 'Rs. 200 Legal Agreement & Commercial Contract Form'),
('court-v5-010', 'Notry/Auth Stamp', 'CRT-NTR-AUTH', '8901001010', 'Court Items', 'pcs', 150.00, 300.00, 90, 100, 15, 10, 'Notary Public & Official Attestation Legal Seal Stamp'),
('paper-v6-001', 'A4 Rim', 'PPR-A4-RIM', '8902001001', 'Office Paper', 'ream', 950.00, 1250.00, 45, 60, 10, 35, 'A4 Size Paper Ream (500 Sheets)'),
('paper-v6-002', 'Legal Rim', 'PPR-LGL-RIM', '8902001002', 'Office Paper', 'ream', 1200.00, 1550.00, 30, 45, 8, 25, 'Legal Size Paper Ream (500 Sheets)'),
('paper-v6-003', 'A4-100p', 'PPR-A4-100P', '8902001003', 'Office Paper', 'pack', 200.00, 300.00, 60, 80, 15, 40, 'A4 Paper Pack of 100 Pages / Loose Sheets'),
('paper-v6-004', 'Legal-100p', 'PPR-LGL-100P', '8902001004', 'Office Paper', 'pack', 250.00, 380.00, 40, 60, 10, 28, 'Legal Size Paper Pack of 100 Pages / Loose Sheets'),
('paper-v6-005', 'Ledger-70g', 'PPR-LDG-70G', '8902001005', 'Office Paper', 'sheet', 6.00, 12.00, 400, 500, 50, 120, 'Green Ledger Paper 70 GSM Legal Sheet'),
('paper-v6-006', 'Ledger-80g', 'PPR-LDG-80G', '8902001006', 'Office Paper', 'sheet', 8.00, 15.00, 350, 450, 40, 110, 'Green Ledger Paper 80 GSM Legal Sheet'),
('paper-v6-007', 'Ledger-90g', 'PPR-LDG-90G', '8902001007', 'Office Paper', 'sheet', 10.00, 20.00, 300, 400, 30, 90, 'Heavy Green Ledger Paper 90 GSM Legal Sheet'),
('paper-v6-008', 'Domicile-PRC', 'PPR-DOM-PRC', '8902001008', 'Office Paper', 'pcs', 20.00, 50.00, 150, 200, 25, 65, 'Domicile & PRC Legal Verification Form'),
('paper-v6-009', 'Nikah-Form', 'PPR-NKH-FRM', '8902001009', 'Office Paper', 'set', 80.00, 150.00, 80, 100, 15, 30, 'Government Official Nikahnama Form Set'),
('paper-v6-010', 'KMC-Form', 'PPR-KMC-FRM', '8902001010', 'Office Paper', 'pcs', 15.00, 40.00, 120, 150, 20, 45, 'Karachi Metropolitan Corporation Official Form'),
('paper-v6-011', 'Sale/transfer/Delievry recpit', 'PPR-SL-RCP', '8902001011', 'Office Paper', 'pcs', 15.00, 35.00, 200, 250, 30, 75, 'Vehicle & Property Sale Transfer Delivery Receipt Slip'),
('paper-v6-012', 'Sale/Transfer Delievery Book', 'PPR-SL-BK', '8902001012', 'Office Paper', 'book', 180.00, 320.00, 45, 60, 10, 20, 'Sale / Transfer Delivery Receipt Book (Carbon Copies)'),
('paper-v6-013', 'Arm-Licence', 'PPR-ARM-LIC', '8902001013', 'Office Paper', 'pcs', 25.00, 60.00, 100, 120, 20, 35, 'Arms License Application & Verification Form'),
('stat-v7-001', 'Ballpoint Pen Box (Piano 10pcs)', 'STN-PEN-BX', '8903001001', 'Stationery', 'box', 200.00, 280.00, 40, 50, 8, 18, 'Blue/Black Smooth Ballpoint Pens (Box of 10)'),
('stat-v7-002', 'Legal File Cover (Hardboard / Tag File)', 'STN-FL-CVR', '8903001002', 'Stationery', 'pcs', 25.00, 50.00, 150, 200, 25, 60, 'Standard Green Legal Case File Cover with Tag Lace'),
('stat-v7-003', 'Stamp Pad (Shiny / Blue Ink)', 'STN-STP-PAD', '8903001003', 'Stationery', 'pcs', 120.00, 200.00, 50, 65, 10, 22, 'Self-Inking Felt Stamp Pad for Official Seal Attestation'),
('stat-v7-004', 'Stamp Pad Ink Refill (Blue 30ml)', 'STN-INK-RFL', '8903001004', 'Stationery', 'pcs', 70.00, 120.00, 60, 75, 12, 25, 'Quick-Drying Attestation Stamp Pad Ink Bottle'),
('stat-v7-005', 'Correction Pen / Fluid (Whitener)', 'STN-COR-PEN', '8903001005', 'Stationery', 'pcs', 60.00, 100.00, 45, 60, 10, 30, 'Fine Metal Tip Whitener Correction Pen for Legal Drafting'),
('stat-v7-006', 'Stapler Machine No. 10 (Deli/Kangaro)', 'STN-STP-MCH', '8903001006', 'Stationery', 'pcs', 220.00, 350.00, 30, 40, 5, 14, 'Durable Metal Desktop Stapler for Legal Case Filings'),
('stat-v7-007', 'Stapler Pins Pack No. 10 (1000s)', 'STN-STP-PNS', '8903001007', 'Stationery', 'pack', 40.00, 70.00, 80, 100, 15, 42, 'Standard No. 10 Chisel Point Staple Wire Pins'),
('stat-v7-008', 'Heavy Duty 2-Hole Paper Punch', 'STN-PPR-PNCH', '8903001008', 'Stationery', 'pcs', 380.00, 550.00, 20, 25, 5, 8, 'Two-Hole Punch Machine for Court Filing Folders'),
('stat-v7-009', 'Paper Clips Box (Gem Clips 100s)', 'STN-GEM-CLP', '8903001009', 'Stationery', 'box', 50.00, 90.00, 70, 85, 15, 35, 'Rust-Resistant Steel Paper Clips (Box of 100)'),
('stat-v7-010', 'Highlighter Marker (Yellow/Green)', 'STN-HGH-LGT', '8903001010', 'Stationery', 'pcs', 45.00, 80.00, 50, 65, 10, 28, 'Fluorescent Document Chisel Tip Highlighter'),
('stat-v7-011', 'Brown Envelopes (Legal Size / Pack 25)', 'STN-ENV-LGL', '8903001011', 'Stationery', 'pack', 180.00, 280.00, 35, 50, 8, 20, 'Heavy Duty Kraft Brown Legal Document Mailing Envelopes'),
('stat-v7-012', 'Register Binding Tape (Green 2-inch)', 'STN-REG-TPE', '8903001012', 'Stationery', 'roll', 90.00, 150.00, 40, 55, 10, 18, 'Cloth Spine Binding Tape for Legal Records & Ledgers');

-- --------------------------------------------------------
-- Table structure for table `sale_transactions`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sale_transactions`;
CREATE TABLE `sale_transactions` (
  `id` varchar(50) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `timestamp` datetime NOT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(5,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `gross_profit` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_method` enum('cash','card','mobile_qr') NOT NULL DEFAULT 'cash',
  `amount_tendered` decimal(10,2) NOT NULL DEFAULT 0.00,
  `change_due` decimal(10,2) NOT NULL DEFAULT 0.00,
  `customer_name` varchar(150) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `cashier_name` varchar(100) DEFAULT 'Muhammad Ali',
  `notes` text DEFAULT NULL,
  `status` enum('completed','refunded') NOT NULL DEFAULT 'completed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_number` (`receipt_number`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `sale_items`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `sale_items`;
CREATE TABLE `sale_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cost_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `profit` decimal(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_sale_transaction_db` FOREIGN KEY (`transaction_id`) REFERENCES `sale_transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `expenses`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `expenses`;
CREATE TABLE `expenses` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `category` varchar(100) NOT NULL DEFAULT 'Supplies',
  `payment_method` enum('cash','card','bank_transfer') NOT NULL DEFAULT 'cash',
  `notes` text DEFAULT NULL,
  `date` date NOT NULL,
  `timestamp` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `expenses` (`id`, `title`, `amount`, `category`, `payment_method`, `notes`, `date`, `timestamp`) VALUES
('exp-101', 'Staff Daily Tea & Refreshments', 350.00, 'Refreshments', 'cash', 'Morning & evening court canteen tea for 3 staff members', CURDATE(), NOW()),
('exp-102', 'Shop Cleaning Supplies & Dusters', 250.00, 'Maintenance', 'cash', 'Counters and glass display dusting supplies', CURDATE(), NOW()),
('exp-103', 'Motorcycle Delivery Fuel', 500.00, 'Travel / Transport', 'cash', 'Collecting stamp papers from District Treasury', CURDATE(), NOW());

-- --------------------------------------------------------
-- Table structure for table `stock_movements`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `stock_movements`;
CREATE TABLE `stock_movements` (
  `id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `type` enum('restock','sale','refund','audit_adjustment','damage_waste') NOT NULL,
  `quantity_delta` int(11) NOT NULL,
  `previous_stock` int(11) NOT NULL,
  `new_stock` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `held_orders`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `held_orders`;
CREATE TABLE `held_orders` (
  `id` varchar(50) NOT NULL,
  `customer_name` varchar(150) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `items_json` longtext NOT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
