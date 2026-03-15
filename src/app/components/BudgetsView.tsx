'use client';

import { Trash2, PlusCircle } from 'lucide-react';
import { Budget, Transaction } from '../lib/types';
import { CATEGORY_EMOJIS, formatCurrency } from '../lib/constants';

interface BudgetsViewProps {
  budgets: Budget[];
  transactions: Transaction[];
  currency: string;
  onDelete: (item: Budget) => void;
  onAdd: () => void;
}

export default function BudgetsView({ budgets, transactions, currency, onDelete, onAdd }: BudgetsViewProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = transactions.filter((t) => {
    if (t.type !== 'expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const spent = monthlyExpenses
            .filter((t) => t.category === b.category)
            .reduce((s, t) => s + t.amount, 0);
          const percent = Math.min((spent / b.amount) * 100, 100);
          const remaining = b.amount - spent;
          const isOver = spent > b.amount;
          const isWarning = !isOver && percent > 80;

          const status = isOver ? 'Over budget!' : isWarning ? 'Almost there' : 'On track';
          const statusColor = isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500';
          const barColor = isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500';

          return (
            <div key={b.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative group">
              <button
                onClick={() => onDelete(b)}
                className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                  {CATEGORY_EMOJIS[b.category] || '📊'}
                </div>
                <div>
                  <p className="font-semibold">{b.category}</p>
                  <p className={`text-sm ${statusColor}`}>{status}</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span>Spent: {formatCurrency(spent, currency)}</span>
                  <span>Budget: {formatCurrency(b.amount, currency)}</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} progress-bar rounded-full`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-slate-500">
                {remaining >= 0
                  ? `${formatCurrency(remaining, currency)} remaining`
                  : `${formatCurrency(Math.abs(remaining), currency)} over budget`}
              </p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onAdd}
        className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        Add Budget Category
      </button>
    </div>
  );
}
