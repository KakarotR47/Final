import React, { useState, useMemo } from 'react';
import { useShop } from '../../context/ShopContext';
import { getLocalDateStr } from '../../services/storage';
import { Expense, ExpenseCategory } from '../../types';
import {
  Wallet,
  Plus,
  Search,
  Filter,
  Trash2,
  Calendar,
  X,
  CreditCard,
  Banknote,
  Building,
} from 'lucide-react';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Packaging & Supplies',
  'Staff Wages',
  'Inventory Freight',
  'Utilities',
  'Rent',
  'Repairs & Maintenance',
  'Marketing',
  'Miscellaneous',
];

export const ExpenseLedger: React.FC = () => {
  const { expenses, addExpense, deleteExpense, formatCurrency } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ExpenseCategory>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Add Expense form
  const [formData, setFormData] = useState({
    date: getLocalDateStr(),
    category: 'Packaging & Supplies' as ExpenseCategory,
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'bank_transfer' | 'card',
    receiptRef: '',
  });

  // Calculate expense statistics
  const stats = useMemo(() => {
    const todayStr = getLocalDateStr();
    const thisMonthStr = todayStr.slice(0, 7);

    let todayTotal = 0;
    let todayCash = 0;
    let monthTotal = 0;
    const catMap: Record<string, number> = {};

    expenses.forEach((e) => {
      if (e.date === todayStr) {
        todayTotal += e.amount;
        if (e.paymentMethod === 'cash') todayCash += e.amount;
      }
      if (e.date.startsWith(thisMonthStr)) {
        monthTotal += e.amount;
      }
      catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });

    const topCategoryEntry = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

    return {
      todayTotal,
      todayCash,
      monthTotal,
      topCategory: topCategoryEntry ? topCategoryEntry[0] : 'None',
      topCategoryAmount: topCategoryEntry ? topCategoryEntry[1] : 0,
      totalCount: expenses.length,
    };
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            e.description.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            (e.receiptRef && e.receiptRef.toLowerCase().includes(q));
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [expenses, selectedCategory, searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) return;

    addExpense({
      date: formData.date,
      category: formData.category,
      description: formData.description.trim(),
      amount,
      paymentMethod: formData.paymentMethod,
      receiptRef: formData.receiptRef.trim() || undefined,
    });

    setIsAddModalOpen(false);
    setFormData({
      date: getLocalDateStr(),
      category: 'Packaging & Supplies',
      description: '',
      amount: '',
      paymentMethod: 'cash',
      receiptRef: '',
    });
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Shop Expenses Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log overhead, wages, freight &amp; supplies to compute accurate daily net profit
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Today&apos;s Total Expenses
          </div>
          <div className="mt-1 text-2xl font-bold font-mono-numbers text-rose-600 dark:text-rose-400">
            {formatCurrency(stats.todayTotal)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Deducted from today&apos;s gross sales
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Paid from Cash Drawer (Till)
          </div>
          <div className="mt-1 text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
            {formatCurrency(stats.todayCash)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Reconciles in End-of-Day cash balance
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            This Month&apos;s Expenses
          </div>
          <div className="mt-1 text-2xl font-bold font-mono-numbers text-slate-900 dark:text-white">
            {formatCurrency(stats.monthTotal)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total monthly operating budget
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Largest Expense Category
          </div>
          <div className="mt-1 text-base font-bold text-slate-900 dark:text-white truncate">
            {stats.topCategory}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono-numbers">
            {formatCurrency(stats.topCategoryAmount)} total recorded
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by description or invoice reference..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e: any) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500 w-full sm:w-auto"
          >
            <option value="All">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description / Payee</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3">Receipt / Ref #</th>
                <th className="py-3 px-3 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <div>{exp.date}</div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(exp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {exp.category}
                  </td>
                  <td className="py-3 px-3 text-slate-900 dark:text-white max-w-xs truncate">
                    {exp.description}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        exp.paymentMethod === 'cash'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {exp.paymentMethod === 'cash' ? <Banknote className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                      <span className="capitalize">{exp.paymentMethod.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                    {exp.receiptRef || '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono-numbers font-bold text-rose-600 dark:text-rose-400 text-sm">
                    -{formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => setExpenseToDelete(exp)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              No expenses recorded matching your filter
            </p>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Record Shop Expense
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Deducts from net daily profit and reconciles with till cash
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description / Payee *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electric utility bill, delivery courier, paper rolls..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-bold font-mono-numbers bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Paid Via *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e: any) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash">Cash Drawer (Till)</option>
                    <option value="bank_transfer">Bank Transfer / UPI</option>
                    <option value="card">Company Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Receipt / Voucher # (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. INV-90412"
                  value={formData.receiptRef}
                  onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* In-app Expense Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Delete Expense Entry</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                Delete expense record: <strong className="text-slate-900 dark:text-white">{expenseToDelete.description}</strong> ({formatCurrency(expenseToDelete.amount)})?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteExpense(expenseToDelete.id);
                  setExpenseToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
