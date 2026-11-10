# SA Brothers Vendors — Full Project Handover for Gemini Pro

Copy and paste the text below directly into your other Google AI Studio account (or Gemini Pro prompt) to continue building your application without missing anything:

---

```text
I am continuing work on my Point of Sale (POS) and Inventory Management web application for my shop "SA Brothers Vendors" in Pakistan.

### 1. Store Details & Settings:
- Store Name: "SA Brothers Vendors"
- Tagline: "Court Stamp Vendors & Legal Paper"
- Currency: PKR (display as "Rs.")
- Tax: 0% Tax (Tax-free sales; no tax in cart, checkout, or receipts)

### 2. Left Vertical Sidebar Navigation (Tabs on left, not on top):
- Court Items (pre-filters POS register to Court Items)
- Office Paper (pre-filters POS register to Office Paper)
- All Items (POS) (full catalog register with search & barcode)
- Stock / Inventory (remaining stock, sold units, reorder alerts, custom stock addition)
- Profit & Dashboard (daily revenue, gross profit, net profit, margin %, hourly chart)
- Past Bills & Receipts (sales history archive, thermal receipt reprinting, customer returns)
- Shop Expenses (daily wages, tea, freight, utility bills)
- Daily Closing (EOD) (end-of-day register closing report & cash drawer audit)
- Store Settings (shop details, opening float, JSON database backup export & restore)

### 3. Exact Product Catalogs Pre-seeded:

#### A. Court Items (Exact 10 items):
1. Rs50 Stamp — Rs. 50 (sheet)
2. Rs100 Stamp — Rs. 100 (sheet)
3. Rs200 Stamp — Rs. 200 (sheet)
4. Rs500 Stamp — Rs. 500 (sheet)
5. Rs1000 Stamp — Rs. 1,000 (sheet)
6. Backdate Stamp — Rs. 1,200 (sheet)
7. Rs50-Agreements — Rs. 70 (sheet)
8. Rs100-Agreements — Rs. 130 (sheet)
9. Rs200-Agreements — Rs. 250 (sheet)
10. Notry/Auth Stamp — Rs. 300 (pcs)

#### B. Office Paper & Legal Forms (Exact 13 items):
1. A4 Rim — Rs. 1,250 (ream)
2. Legal Rim — Rs. 1,550 (ream)
3. A4-100p — Rs. 300 (pack of 100 pages)
4. Legal-100p — Rs. 380 (pack of 100 pages)
5. Ledger-70g — Rs. 12 (sheet)
6. Ledger-80g — Rs. 15 (sheet)
7. Ledger-90g — Rs. 20 (sheet)
8. Domicile-PRC — Rs. 50 (pcs)
9. Nikah-Form — Rs. 150 (set)
10. KMC-Form — Rs. 40 (pcs)
11. Sale/transfer/Delievry recpit — Rs. 35 (pcs)
12. Sale/Transfer Delievery Book — Rs. 320 (book)
13. Arm-Licence — Rs. 60 (pcs)

### 4. Key POS Features:
- Direct manual quantity typing: The quantity in the cart input is an editable text box so I can click and type any number (e.g. 100) instead of clicking "+".
- Quick quantity presets: "+10", "+50", and "=100" buttons in the cart.
- "+Qty" modal button on every product card to type any custom quantity before adding to cart.
- Search bar multiplier: Typing e.g. "100*paper" or "50*stamp" adds that exact quantity directly.
- Thermal receipt preview with print button (formatted for 80mm POS receipt printers).
- End-of-Day report with AI summary powered by Gemini Pro (`gemini-2.5-pro`).
- Full offline-ready persistence in localStorage with database JSON export and import.

Please continue building and maintaining this app with these exact specifications.
```
