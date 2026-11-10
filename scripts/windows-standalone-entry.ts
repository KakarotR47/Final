import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { renderReceiptSlipHtml } from '../src/services/receiptHtmlGenerator.ts';

// When running as a Windows executable, process.execPath is C:\path\to\SA_Brothers_POS.exe
const isWindowsExe = process.execPath.toLowerCase().endsWith('.exe');
const appDir = isWindowsExe ? path.dirname(process.execPath) : process.cwd();

// Ensure local hard drive database directory exists on shop computer
const LOCAL_DB_DIR = path.resolve(appDir, 'local_database');
const LOCAL_BACKUP_DIR = path.resolve(LOCAL_DB_DIR, 'backups');
if (!fs.existsSync(LOCAL_DB_DIR)) {
  fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
  fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
}

// In-memory cache for print receipts
const recentPrintReceipts = new Map<string, { transaction: any; settings?: any }>();

const app = express();
app.use(express.json({ limit: '50mb' }));

// Helper to write file safely
function saveLocalJson(filename: string, data: any) {
  const filePath = path.resolve(LOCAL_DB_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function readLocalJson<T>(filename: string, fallback: T): T {
  const filePath = path.resolve(LOCAL_DB_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: 'local-shop-pc',
    hardDriveStorage: fs.existsSync(LOCAL_DB_DIR),
    directory: LOCAL_DB_DIR,
    timestamp: new Date().toISOString(),
  });
});

// Database status
app.get('/api/local-db/status', (_req, res) => {
  try {
    const files = ['products.json', 'transactions.json', 'expenses.json', 'movements.json', 'settings.json', 'profiles.json', 'device_lock.json'];
    const status: Record<string, any> = {};

    files.forEach((file) => {
      const p = path.resolve(LOCAL_DB_DIR, file);
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        status[file] = { exists: true, sizeBytes: stat.size, lastModified: stat.mtime };
      } else {
        status[file] = { exists: false };
      }
    });

    const backupsCount = fs.existsSync(LOCAL_BACKUP_DIR) ? fs.readdirSync(LOCAL_BACKUP_DIR).length : 0;

    res.json({
      success: true,
      directory: LOCAL_DB_DIR,
      files: status,
      totalBackupsOnDisk: backupsCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Load database
app.get('/api/local-db/load', (_req, res) => {
  try {
    const data = {
      products: readLocalJson('products.json', null),
      transactions: readLocalJson('transactions.json', null),
      expenses: readLocalJson('expenses.json', null),
      movements: readLocalJson('movements.json', null),
      settings: readLocalJson('settings.json', null),
      profiles: readLocalJson('profiles.json', null),
      deviceLock: readLocalJson('device_lock.json', {
        isDeviceLockEnabled: false,
        authorizedDeviceId: '',
        authorizedDeviceName: 'Shop Counter PC (Default)',
      }),
    };
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Sync database
app.post('/api/local-db/sync', (req, res) => {
  try {
    const { products, transactions, expenses, movements, settings, profiles, deviceLock } = req.body;

    if (products !== undefined) saveLocalJson('products.json', products);
    if (transactions !== undefined) saveLocalJson('transactions.json', transactions);
    if (expenses !== undefined) saveLocalJson('expenses.json', expenses);
    if (movements !== undefined) saveLocalJson('movements.json', movements);
    if (settings !== undefined) saveLocalJson('settings.json', settings);
    if (profiles !== undefined) saveLocalJson('profiles.json', profiles);
    if (deviceLock !== undefined) saveLocalJson('device_lock.json', deviceLock);

    res.json({
      success: true,
      message: 'All data successfully saved to shop computer hard disk',
      timestamp: new Date().toISOString(),
      savedTo: LOCAL_DB_DIR,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Create backup
app.post('/api/local-db/create-backup', (_req, res) => {
  try {
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `sa_brothers_backup_${dateStr}.json`;
    const backupFilePath = path.resolve(LOCAL_BACKUP_DIR, backupFileName);

    const fullDump = {
      backupDate: new Date().toISOString(),
      products: readLocalJson('products.json', []),
      transactions: readLocalJson('transactions.json', []),
      expenses: readLocalJson('expenses.json', []),
      movements: readLocalJson('movements.json', []),
      settings: readLocalJson('settings.json', {}),
      profiles: readLocalJson('profiles.json', []),
      deviceLock: readLocalJson('device_lock.json', {}),
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(fullDump, null, 2), 'utf8');

    res.json({
      success: true,
      message: `Backup snapshot saved to ${backupFileName}`,
      filePath: backupFilePath,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Device lock
app.get('/api/device-lock', (_req, res) => {
  const lock = readLocalJson('device_lock.json', {
    isDeviceLockEnabled: false,
    authorizedDeviceId: '',
    authorizedDeviceName: 'Shop Counter PC (Default)',
    authorizedAt: null,
  });
  res.json({ success: true, data: lock });
});

app.post('/api/device-lock/save', (req, res) => {
  try {
    const config = req.body;
    saveLocalJson('device_lock.json', config);
    res.json({ success: true, message: 'Shop computer binding updated', data: config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Receipts
app.post('/api/prepare-print-slip', (req, res) => {
  try {
    const { transaction, settings } = req.body;
    if (!transaction || !transaction.receiptNumber) {
      return res.status(400).json({ error: 'Invalid transaction data' });
    }
    recentPrintReceipts.set(transaction.receiptNumber, { transaction, settings });
    res.json({
      ok: true,
      url: `/print-slip/${encodeURIComponent(transaction.receiptNumber)}`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message });
  }
});

app.get('/print-slip/:receiptNumber', (req, res) => {
  const { receiptNumber } = req.params;
  const entry = recentPrintReceipts.get(receiptNumber);
  if (entry) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderReceiptSlipHtml(entry.transaction, entry.settings));
  }
  res.status(404).send('<h1>Receipt not found</h1><p>Please open receipt in POS and click Print.</p>');
});

app.get('/print-slip', (req, res) => {
  try {
    const rawData = req.query.receipt as string;
    if (!rawData) return res.status(400).send('Receipt data required');
    let transaction: any;
    try {
      transaction = JSON.parse(rawData);
    } catch {
      transaction = JSON.parse(decodeURIComponent(rawData));
    }
    const html = renderReceiptSlipHtml(transaction);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err: any) {
    res.status(500).send('Failed to generate print slip: ' + err?.message);
  }
});

// Offline rule-based EOD analysis
app.post('/api/analyze-eod', (req, res) => {
  const { reportData, shopName = 'SA Brothers Vendors', currency = 'PKR' } = req.body || {};
  const cur = currency;
  const margin = Number(reportData?.grossMarginPercent || 0);
  const netProfit = Number(reportData?.netDailyProfit || 0);
  const netSales = Number(reportData?.netSales || 0);
  const lowStock = Number(reportData?.lowStockAlertCount || 0);
  const topProducts = Array.isArray(reportData?.topSellingProducts) ? reportData.topSellingProducts : [];
  const topItemName = topProducts[0]?.name || 'Top items';

  const analysis = `### Daily Financial Health & Margin Highlights
Today, ${shopName} generated **${cur} ${netSales.toFixed(2)}** in net sales with a **${margin.toFixed(1)}%** gross margin, yielding **${cur} ${netProfit.toFixed(2)}** in net daily profit. All financial ledgers are saved to your local Windows hard drive.

### Sales & Product Velocity
A total of **${reportData?.itemsSoldCount || 0} units** were sold across **${reportData?.transactionCount || 0} customer orders**. Customer demand was led by **${topItemName}**.

### Actionable Recommendations for Tomorrow
- **Stock Replenishment**: There are **${lowStock} items** currently low on stock. Restock before morning trading.
- **Cash Drawer Audit**: Verify drawer balance against Expected Cash total of **${cur} ${Number(reportData?.expectedCashInDrawer || 0).toFixed(2)}**.
- **Local Hard Drive Backup**: Run BACKUP_LOCAL_DATABASE.bat or click "Save to PC Now" in Settings to keep records protected.`;

  res.json({ analysis, source: 'windows-offline-engine' });
});

// Static assets serving: look in dist/ adjacent to executable or current working directory
const distDir = [
  path.resolve(appDir, 'dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, 'dist'),
].find((d) => fs.existsSync(path.resolve(d, 'index.html'))) || path.resolve(appDir, 'dist');

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, {
    etag: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      }
    },
  }));
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

function launchBrowserAppMode(port: number) {
  if (process.platform !== 'win32') return;
  const url = `http://localhost:${port}`;
  const candidates = [
    process.env['ProgramFiles'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['ProgramFiles(x86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['ProgramFiles(x86)'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
    process.env['ProgramFiles'] + '\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const exe of candidates) {
    if (exe && fs.existsSync(exe)) {
      try {
        spawn(exe, [`--app=${url}`, '--window-size=1400,860'], { detached: true, stdio: 'ignore' }).unref();
        return;
      } catch {}
    }
  }
  // Fallback to default browser
  try {
    spawn('cmd.exe', ['/c', 'start', url], { detached: true, stdio: 'ignore' }).unref();
  } catch {}
}

const PORT = 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('==============================================================');
  console.log('  SA BROTHERS VENDORS - POINT OF SALE & INVENTORY TERMINAL');
  console.log('==============================================================');
  console.log(`  Local Windows Server listening on: http://localhost:${PORT}`);
  console.log(`  Hard Drive Database Directory:     ${LOCAL_DB_DIR}`);
  console.log('==============================================================');
  launchBrowserAppMode(PORT);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    const ALT_PORT = 3088;
    const altServer = app.listen(ALT_PORT, '0.0.0.0', () => {
      console.log(`Port 3000 busy. Running on fallback: http://localhost:${ALT_PORT}`);
      launchBrowserAppMode(ALT_PORT);
    });
  }
});
