'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Transaction } from '../lib/types';
import { CATEGORY_EMOJIS, formatCurrency } from '../lib/constants';

interface TransactionsViewProps {
  transactions: Transaction[];
  currency: string;
  onDelete: (item: Transaction) => void;
}

export default function TransactionsView({ transactions, currency, onDelete }: TransactionsViewProps) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState(currentMonth);

  let filtered = [...transactions];
  if (filterType !== 'all') filtered = filtered.filter((t) => t.type === filterType);
  if (filterMonth) filtered = filtered.filter((t) => t.date?.startsWith(filterMonth));
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const categories = Array.from(new Set(transactions.map((t) => t.category).filter(Boolean)));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            {transactions.length === 0 ? 'No transactions yet. Click "Add New" to get started!' : 'No transactions match the current filters.'}
          </p>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'} flex items-center justify-center text-xl`}>
                  {CATEGORY_EMOJIS[t.category] || (t.type === 'income' ? '💰' : '💸')}
                </div>
                <div>
                  <p className="font-medium">{t.category}</p>
                  <p className="text-sm text-slate-500">{t.account} • {new Date(t.date).toLocaleDateString()}</p>
                  {t.notes && <p className="text-xs text-slate-400 mt-1">{t.notes}</p>}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-bold text-lg ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                </span>
                <button
                  onClick={() => onDelete(t)}
                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
