import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

import { spawn } from 'child_process';
import { renderReceiptSlipHtml } from './src/services/receiptHtmlGenerator.ts';

dotenv.config();
// Ensure HMR is disabled in AI Studio dev environment to prevent WebSocket connection failures
process.env.DISABLE_HMR = 'true';
process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure local hard drive database directory exists on shop computer
const LOCAL_DB_DIR = path.resolve(__dirname, 'local_database');
const LOCAL_BACKUP_DIR = path.resolve(LOCAL_DB_DIR, 'backups');
if (!fs.existsSync(LOCAL_DB_DIR)) {
  fs.mkdirSync(LOCAL_DB_DIR, { recursive: true });
}
if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
  fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true });
}

const app = express();

// In-memory cache for clean print URLs
const recentPrintReceipts = new Map<string, { transaction: any; settings?: any }>();

// Determine port: CLI arguments (--port 3000) take precedence; in dev mode, default strictly to 3000
function resolvePort(): number {
  const args = process.argv.slice(2);
  const portIdx = args.findIndex((arg) => arg === '--port' || arg === '-p');
  if (portIdx !== -1 && args[portIdx + 1]) {
    const parsed = parseInt(args[portIdx + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  // In development, always default to 3000 for AI Studio dev server
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  // In production, use container PORT env var if available
  if (process.env.PORT) {
    const parsed = parseInt(process.env.PORT, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 3000;
}

const PORT = resolvePort();

app.use(express.json({ limit: '25mb' }));

// Health check endpoint with local storage indicators
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: 'local-shop-pc',
    hardDriveStorage: fs.existsSync(LOCAL_DB_DIR),
    timestamp: new Date().toISOString()
  });
});

// ====================================================================
// LOCAL HARD DRIVE DATABASE PERSISTENCE ENDPOINTS (SAVES DATA ON PC)
// ====================================================================

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

// 1. Get status of files saved on computer hard drive
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

// 2. Load all database tables from local hard drive
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

// 3. Save / Sync entire database or tables directly to local computer disk
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
      savedTo: LOCAL_DB_DIR
    });
  } catch (err: any) {
    console.error('Failed to sync to local hard drive:', err);
    res.status(500).json({ success: false, error: err?.message });
  }
});

// 4. Create an automated local hard drive backup snapshot
app.post('/api/local-db/create-backup', (req, res) => {
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
      filePath: backupFilePath
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// 5. Download Standalone Windows Desktop Application (.exe)
app.get('/api/download-exe', (_req, res) => {
  const exePath = path.resolve(__dirname, 'SA_Brothers_POS.exe');
  if (!fs.existsSync(exePath)) {
    return res.status(404).json({ error: 'SA_Brothers_POS.exe not found' });
  }
  const stat = fs.statSync(exePath);
  res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
  res.setHeader('Content-Disposition', 'attachment; filename="SA_Brothers_POS.exe"');
  res.setHeader('Content-Length', stat.size.toString());
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Disposition');
  res.sendFile(exePath);
});

// 5b. Download Full Windows Installation Package (.zip containing .exe, .bat, setup guide & database)
app.get('/api/download-windows-package', (_req, res) => {
  const zipPath = path.resolve(__dirname, 'SA_Brothers_POS_Windows_Package.zip');
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: 'SA_Brothers_POS_Windows_Package.zip not found' });
  }
  const stat = fs.statSync(zipPath);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="SA_Brothers_POS_Windows_Package.zip"');
  res.setHeader('Content-Length', stat.size.toString());
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Disposition');
  res.sendFile(zipPath);
});

// 5c. Download Windows Desktop Launcher (.bat)
app.get('/api/download-launcher', (_req, res) => {
  const batPath = path.resolve(__dirname, 'START_SHOP_POS.bat');
  res.setHeader('Content-Type', 'application/x-bat');
  res.setHeader('Content-Disposition', 'attachment; filename="START_SHOP_POS.bat"');
  res.sendFile(batPath);
});

// 6. Download Windows Hard Drive Backup Utility (.bat)
app.get('/api/download-backup-bat', (_req, res) => {
  const batPath = path.resolve(__dirname, 'BACKUP_LOCAL_DATABASE.bat');
  res.setHeader('Content-Type', 'application/x-bat');
  res.setHeader('Content-Disposition', 'attachment; filename="BACKUP_LOCAL_DATABASE.bat"');
  res.sendFile(batPath);
});

// 7. Device lock settings endpoint
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

// Dedicated Print Window Endpoints (Opens outside iframe for native printer dialog)
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
  res.status(404).send('<h1>Receipt not found</h1><p>Please open the receipt in the POS register and click Print.</p>');
});

app.get('/print-slip', (req, res) => {
  try {
    const rawData = req.query.receipt as string;
    if (!rawData) {
      return res.status(400).send('Receipt data required');
    }
    let transaction: any;
    try {
      transaction = JSON.parse(rawData);
    } catch {
      try {
        transaction = JSON.parse(decodeURIComponent(rawData));
      } catch (err2: any) {
        return res.status(400).send('Invalid receipt payload: ' + err2?.message);
      }
    }
    const html = renderReceiptSlipHtml(transaction);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err: any) {
    res.status(500).send('Failed to generate print slip: ' + err?.message);
  }
});

// Download full project source code archive
app.get('/api/download-project', (_req, res) => {
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', 'attachment; filename="sa-brothers-vendors-project.tar.gz"');

  const tarProcess = spawn('tar', [
    '--exclude=node_modules',
    '--exclude=dist',
    '--exclude=.git',
    '-czf',
    '-',
    '-C',
    path.resolve(__dirname),
    '.'
  ]);

  tarProcess.stdout.pipe(res);

  tarProcess.stderr.on('data', (data) => {
    console.error('Tar stderr:', data.toString());
  });

  tarProcess.on('error', (err) => {
    console.error('Failed to create archive:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create archive' });
    }
  });
});

// Download ready-to-import MySQL database dump
app.get('/api/download-sql', (_req, res) => {
  const sqlFilePath = path.resolve(__dirname, 'sa_brothers_pos.sql');
  res.setHeader('Content-Type', 'application/sql; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sa_brothers_pos.sql"');
  res.sendFile(sqlFilePath);
});

// Automated End-of-Day AI Executive Analysis Endpoint (Powered by Gemini Pro)
app.post('/api/analyze-eod', async (req, res) => {
  try {
    const { reportData, shopName, currency = 'PKR' } = req.body;

    if (!reportData) {
      return res.status(400).json({ error: 'Missing reportData in request body' });
    }

    const cur = currency || 'PKR';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Fallback to rich automated analysis when no Gemini API key is configured
      const automatedSummary = generateRuleBasedAnalysis(reportData, shopName || 'SA Brothers Vendors', cur);
      return res.json({
        analysis: automatedSummary,
        source: 'automated-rule-engine'
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert retail shop business consultant. Analyze the following End-of-Day (EOD) sales, profit, and inventory report for "${shopName || 'SA Brothers Vendors'}".
Date: ${reportData.date}
Gross Revenue: ${cur} ${Number(reportData.grossSales || 0).toFixed(2)}
Net Sales: ${cur} ${Number(reportData.netSales || 0).toFixed(2)}
Discounts Given: ${cur} ${Number(reportData.discountsGiven || 0).toFixed(2)}
Cost of Goods Sold (COGS): ${cur} ${Number(reportData.totalCostOfGoods || 0).toFixed(2)}
Gross Profit: ${cur} ${Number(reportData.grossProfit || 0).toFixed(2)} (${Number(reportData.grossMarginPercent || 0).toFixed(1)}% margin)
Operating Expenses: ${cur} ${Number(reportData.totalExpenses || 0).toFixed(2)}
Net Daily Profit: ${cur} ${Number(reportData.netDailyProfit || 0).toFixed(2)}
Total Transactions: ${reportData.transactionCount || 0}
Total Items Sold: ${reportData.itemsSoldCount || 0}
Payment Breakdown: Cash: ${cur} ${Number(reportData.cashSales || 0).toFixed(2)}, Card: ${cur} ${Number(reportData.cardSales || 0).toFixed(2)}, Mobile/QR: ${cur} ${Number(reportData.mobileSales || 0).toFixed(2)}
Expected Cash in Drawer: ${cur} ${Number(reportData.expectedCashInDrawer || 0).toFixed(2)}
Low Stock Alerts: ${reportData.lowStockAlertCount || 0} items low on stock
Top Selling Products: ${JSON.stringify(reportData.topSellingProducts || [])}

Provide a concise, practical executive briefing for the shopkeeper divided into 3 short sections:
1. **Daily Financial Health & Margin Highlights**: Evaluate today's revenue, profit margin, and expense ratios.
2. **Sales & Product Velocity**: Highlight what performed best and any slow-moving category observations.
3. **Actionable Recommendations for Tomorrow**: 2-3 specific actions (e.g. restocking, promotion, cash drawer checks).
Keep tone professional, encouraging, and razor-focused on retail store profitability. Use currency ${cur}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    const analysisText = response.text || generateRuleBasedAnalysis(reportData, shopName || 'SA Brothers Vendors', cur);

    return res.json({
      analysis: analysisText,
      source: 'gemini-2.5-pro'
    });
  } catch (error: any) {
    console.error('Error generating AI analysis:', error);
    // Graceful fallback to rule-based engine on error
    const cur = req.body?.currency || 'PKR';
    const fallback = generateRuleBasedAnalysis(req.body?.reportData || {}, req.body?.shopName || 'SA Brothers Vendors', cur);
    return res.json({
      analysis: fallback,
      source: 'automated-rule-engine-fallback'
    });
  }
});

function generateRuleBasedAnalysis(data: any, shopName: string, cur: string = 'PKR'): string {
  const margin = Number(data.grossMarginPercent || 0);
  const netProfit = Number(data.netDailyProfit || 0);
  const netSales = Number(data.netSales || 0);
  const expenses = Number(data.totalExpenses || 0);
  const lowStock = Number(data.lowStockAlertCount || 0);
  const topProducts = Array.isArray(data.topSellingProducts) ? data.topSellingProducts : [];
  const topItemName = topProducts[0]?.name || 'Top items';

  let marginAssessment = 'healthy and balanced';
  if (margin < 20) marginAssessment = 'tight; review supplier cost pricing or adjust markups';
  else if (margin > 45) marginAssessment = 'exceptionally strong';

  let expenseAssessment = 'operating expenses are within normal retail thresholds';
  if (netSales > 0 && expenses / netSales > 0.35) {
    expenseAssessment = 'operating overhead consumed over 35% of revenue today; monitor utility or freight costs';
  }

  return `### Daily Financial Health & Margin Highlights
Today, ${shopName} generated **${cur} ${netSales.toFixed(2)}** in net sales with a **${margin.toFixed(1)}%** gross margin, yielding **${cur} ${netProfit.toFixed(2)}** in net daily profit. The store's gross margin is ${marginAssessment}, and ${expenseAssessment}.

### Sales & Product Velocity
A total of **${data.itemsSoldCount || 0} units** were sold across **${data.transactionCount || 0} customer orders**. Customer demand was led by **${topItemName}**, which generated the highest turnover today. Payment collection was well-distributed across payment channels.

### Actionable Recommendations for Tomorrow
- **Stock Replenishment**: There are currently **${lowStock} products** at or below low-stock safety thresholds. Submit supplier purchase orders before peak morning trade.
- **Cash Drawer Audit**: Verify the physical cash count against the expected till total of **${cur} ${Number(data.expectedCashInDrawer || 0).toFixed(2)}**.
- **Promotional Bundles**: Consider pairing high-margin items with fast-moving staples to further increase the average basket size.`;
}

// Development and Production setup
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: false,
        hmr: false,
      },
      plugins: [
        {
          name: 'disable-hmr-ws-client',
          transform(code, id) {
            if (id.includes('@vite/client') || id.includes('vite/dist/client/client.mjs')) {
              return {
                code: code
                  .replace('async connect(handlers) {', 'async connect(handlers) { return; /* HMR disabled */')
                  .replace(/throw e;/g, 'return;')
                  .replace(/console\.error\(`\[vite\] failed to connect to websocket[^\`]*`\);/g, '/* HMR WebSocket disabled */'),
              };
            }
          },
        },
      ],
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production with no-cache on index.html so updates apply immediately
    app.use(
      express.static(path.resolve(__dirname, 'dist'), {
        etag: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Generic error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: err?.message });
    }
  });

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Error] Port ${PORT} is already in use. Please terminate any conflicting processes.`);
      process.exit(1);
    } else {
      console.error('[Error] Server encountered an error:', err);
      process.exit(1);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Global safety net for unexpected exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

startServer();
