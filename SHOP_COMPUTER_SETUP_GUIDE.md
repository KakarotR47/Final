# SA Brothers Vendors — Dedicated Shop Computer Setup Guide
## 100% Local PC Operation · Hard Drive Storage · Machine Lock

This Point of Sale (POS) and inventory system has been configured to **run exclusively on your shop computer** with **all data saved directly to your computer's hard drive**. No cloud hosting or active internet connection is required.

---

### Key Features of Shop Computer Mode

1. **All Data Saved on Computer Hard Drive**:
   - Every sale, expense, stock intake, and price change is automatically saved to `./local_database/` on your computer's hard disk (`products.json`, `transactions.json`, `expenses.json`, `settings.json`, `profiles.json`, `movements.json`).
   - Even if you restart your computer or clear your browser cache, your store data remains 100% safe and intact on your hard drive.
2. **Only Opens on Your Shop Computer (Device Lock)**:
   - When device lock is enabled, only your registered shop computer can open and operate the POS register.
   - Any unauthorized computer, mobile phone, or external browser is immediately blocked with an **"Access Restricted — Shop Computer Only"** lock screen.
   - Only the Store Owner with Master PIN (`1234`) can register or unlock computers.
3. **Double-Click Desktop Launcher (`START_SHOP_POS.bat`)**:
   - Launches the POS system in clean, frameless Windows application mode without browser address bars or tabs, looking and feeling like an installed Windows desktop POS software.
4. **Automated Local Hard Drive Backups (`BACKUP_LOCAL_DATABASE.bat`)**:
   - One double-click creates a timestamped copy of your entire shop database in `C:\SABrothers_POS_Backups\`.

---

## How to Set It Up on Your Shop Computer

### Step 1: Download or Copy the Project Folder to Your Shop PC
1. Extract or place the project folder on your shop computer:
   - Example folder: `C:\SABrothersPOS\` or on your Desktop.

### Step 2: Install Node.js (If Not Already Installed)
1. Download and install **Node.js LTS** on your shop computer from: [https://nodejs.org](https://nodejs.org) (Standard Windows `.msi` installer — click Next, Next, Install).

### Step 3: Start the POS with One Double-Click
1. Inside the project folder, simply double-click:
   ```text
   START_SHOP_POS.bat
   ```
2. The script will automatically:
   - Install required packages (first time only).
   - Start the local offline database engine.
   - Automatically open Google Chrome or Microsoft Edge in full **Desktop App Window Mode** at `http://localhost:3000`.

---

## Desktop Shortcut Creation (For Cashier Counter)

To make an icon directly on your Windows Desktop:
1. Right-click on `START_SHOP_POS.bat`.
2. Select **Send to &rarr; Desktop (create shortcut)**.
3. On your Desktop, right-click the new shortcut and select **Rename**: name it `SA Brothers Vendors POS`.
4. (Optional) Right-click &rarr; **Properties** &rarr; **Change Icon** to assign a shopping cart or register icon.
5. Your cashier or staff can now launch the store with a simple double-click every morning!

---

## Default Profiles & Passwords

- **Store Owner (Full Administrative Access)**:
  - PIN: `1234`
  - Access: Stock inventory, supplier costs, stock replenishment/indenting, adding new items, profit dashboard, and EOD reports.
- **Staff Cashier (Limited Sales & Expenses Access)**:
  - PIN: `0000`
  - Access: POS Register sales and logging shop expenses only. Stock inventory and profit dashboard are completely hidden.

*Both passwords can be changed anytime in **Store Settings &rarr; Profile Passwords**.*
