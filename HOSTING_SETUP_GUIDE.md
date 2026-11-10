# Complete Hosting & Domain Deployment Guide (MySQL + PHP)
## SA Brothers Vendors — Point of Sale (POS) & Inventory System

This guide provides step-by-step instructions to set up your POS system, MySQL database, and PHP backend on your own web hosting (cPanel, Hostinger, Namecheap, GoDaddy, Bluehost, VPS, or local XAMPP/WAMP) and connect your custom domain name.

---

### Included Database & Backend Files in this Project

| File / Folder | Purpose |
|---|---|
| `sa_brothers_pos.sql` (or `database.sql`) | Full MySQL / MariaDB database dump containing all 9 tables and 35 pre-seeded products (Court Items, Office Paper, Stationery), user profiles (Owner PIN: `1234`, Staff PIN: `0000`), settings, and sample expenses. |
| `/backend_php/config.php` | MySQL PDO database connection file, credentials, and CORS headers. |
| `/backend_php/products.php` | REST API for fetching products, manual catalog item additions, and stock editing. |
| `/backend_php/transactions.php` | REST API for processing checkouts, decrementing stock, generating receipt numbers, and handling refunds. |
| `/backend_php/expenses.php` | REST API for recording and tracking daily shop operating expenses. |
| `/backend_php/profiles.php` | REST API for role verification (Owner vs Staff) and PIN password changes. |
| `/backend_php/settings.php` | REST API for store metadata, currency, and receipt headers/footers. |
| `/backend_php/eod.php` | REST API for End-of-Day closing reports and cash drawer audits. |
| `/backend_php/export_sql.php` | One-click script to export a live MySQL database backup at any time. |
| `/backend_php/.htaccess` | Apache rewrite rules for clean URLs and security protection. |

---

## Step 1: Create the MySQL Database in cPanel / Web Hosting

1. Log in to your hosting account control panel (cPanel, Hostinger hPanel, Namecheap, etc.).
2. Go to **MySQL Databases** or **MySQL Database Wizard**.
3. Create a new database:
   - Example Database Name: `sabrother_pos` (or `sa_brothers_pos`).
4. Create a new database user:
   - Example Username: `sabrother_user`
   - Set a strong password (e.g. `StrongPass#2026!`). Note this down!
5. Add the user to the database and check **ALL PRIVILEGES**. Click **Make Changes**.

---

## Step 2: Import `sa_brothers_pos.sql` via phpMyAdmin

1. In your cPanel dashboard, click on **phpMyAdmin**.
2. In the left sidebar, click on your newly created database (e.g., `sabrother_pos`).
3. Click the **Import** tab at the top.
4. Under **File to import**, click **Choose File** and select `sa_brothers_pos.sql` (or `database.sql`) from this project.
5. Leave format as **SQL** and character set as **utf-8**.
6. Click the **Import** (or **Go**) button at the bottom.
7. You will see a green success message: *Import has been successfully finished. 9 tables created.*

---

## Step 3: Configure Database Credentials in `config.php`

Open `backend_php/config.php` in a text editor or cPanel File Manager and update the database details with the ones you created in Step 1:

```php
// Database Credentials
define('DB_HOST', 'localhost');                  // Usually localhost in cPanel
define('DB_PORT', '3306');
define('DB_NAME', 'sabrother_pos');              // Your cPanel database name
define('DB_USER', 'sabrother_user');             // Your cPanel database user
define('DB_PASS', 'YourStrongPasswordHere');     // The password you set
define('DB_CHARSET', 'utf8mb4');
```

Save the file.

---

## Step 4: Uploading Files to Your Domain (`public_html`)

1. Build the production React web application:
   ```bash
   npm run build
   ```
   This generates the optimized web app files inside the `dist/` folder.
2. In cPanel, open **File Manager** and navigate into `public_html/` (or your subdomain directory).
3. Upload:
   - All contents of the `dist/` folder directly into `public_html/` (`index.html`, `assets/`, etc.).
   - The `backend_php/` folder (you can rename it to `api/` or keep it as `backend_php/`).
   - The `.htaccess` file.

---

## Step 5: Connecting Your Custom Domain Name & SSL

1. **DNS Setup**:
   - In your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.), create an **A Record**:
     - Host / Name: `@`
     - Value / IP: *Your hosting server IP address*
     - TTL: Automatic or 1 Hour
   - Create a second **CNAME Record**:
     - Host / Name: `www`
     - Value: `yourdomain.com`
2. **Enable Free SSL Certificate (HTTPS)**:
   - In cPanel, find **SSL/TLS Status** or **Let's Encrypt SSL**.
   - Click **Run AutoSSL** or **Issue** for your domain.
   - Now your POS will load securely over `https://yourdomain.com`.

---

## Step 6: Initial Logins & Test

- **Store Owner Profile**:
  - Name: Shop Owner (Admin)
  - Default PIN: `1234`
  - Access: Full access to Stock Inventory, Indenting, Prices/Costs, Profits, EOD, and Settings.
- **Staff Cashier Profile**:
  - Name: Staff Cashier
  - Default PIN: `0000`
  - Access: POS Register sales & Shop Expenses. Cannot see inventory stocks, profit dashboard, or settings.

You can change both PINs anytime by going to **Store Settings &rarr; Profile Passwords & Staff Access Permissions**.
