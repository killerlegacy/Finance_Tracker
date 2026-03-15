'use client';

import { Trash2, PlusCircle } from 'lucide-react';
import { Subscription } from '../lib/types';
import { CATEGORY_EMOJIS, formatCurrency } from '../lib/constants';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  currency: string;
  onDelete: (item: Subscription) => void;
  onAdd: () => void;
}

export default function SubscriptionsView({ subscriptions, currency, onDelete, onAdd }: SubscriptionsViewProps) {
  const totalMonthly = subscriptions
    .filter((s) => s.billing_cycle === 'Monthly')
    .reduce((sum, s) => sum + s.amount, 0);
  const totalYearly = subscriptions
    .filter((s) => s.billing_cycle === 'Yearly')
    .reduce((sum, s) => sum + s.amount / 12, 0);
  const totalWeekly = subscriptions
    .filter((s) => s.billing_cycle === 'Weekly')
    .reduce((sum, s) => sum + s.amount * 4.33, 0);

  const monthlyEquivalent = totalMonthly + totalYearly + totalWeekly;

  const sorted = [...subscriptions].sort(
    (a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime()
  );

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const billing = new Date(dateStr);
    billing.setHours(0, 0, 0, 0);
    return Math.ceil((billing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDueBadge = (daysUntil: number) => {
    if (daysUntil <= 0) return { text: 'Due today', cls: 'bg-red-100 text-red-600' };
    if (daysUntil === 1) return { text: 'Due tomorrow', cls: 'bg-red-100 text-red-600' };
    if (daysUntil <= 3) return { text: `In ${daysUntil} days`, cls: 'bg-red-100 text-red-600' };
    if (daysUntil <= 7) return { text: `In ${daysUntil} days`, cls: 'bg-amber-100 text-amber-600' };
    return { text: `In ${daysUntil} days`, cls: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
        <p className="text-sm text-white/80">Monthly Equivalent</p>
        <p className="text-3xl font-bold">{formatCurrency(monthlyEquivalent, currency)}</p>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No subscriptions added yet</p>
        ) : (
          sorted.map((s) => {
            const daysUntil = getDaysUntil(s.next_billing_date);
            const badge = getDueBadge(daysUntil);

            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl">
                    {CATEGORY_EMOJIS[s.category] || '📺'}
                  </div>
                  <div>
                    <p className="font-semibold">{s.service_name}</p>
                    <p className="text-sm text-slate-500">{s.billing_cycle} • {s.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(s.amount, currency)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </div>
                  <button
                    onClick={() => onDelete(s)}
                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        <button
          onClick={onAdd}
          className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-4 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add Subscription
        </button>
      </div>
    </div>
  );
}
