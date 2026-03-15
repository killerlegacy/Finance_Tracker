'use client';

import { Wallet, TrendingUp, TrendingDown, PiggyBank, Bell } from 'lucide-react';
import { Transaction, Budget, Subscription, Account } from '../lib/types';
import { CATEGORY_EMOJIS, formatCurrency, getCurrentMonthYear } from '../lib/constants';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  accounts: Account[];
  currency: string;
  onViewAll: () => void;
}

export default function Dashboard({ transactions, budgets, subscriptions, accounts, currency, onViewAll }: DashboardProps) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTx = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const income = monthlyTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = monthlyTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalAccountBalance = accounts.reduce((s, a) => s + a.amount, 0);
  const totalBalance = totalAccountBalance + income - expenses;
  // Savings = income minus expenses, but never negative (you can't save what you haven't earned)
  const savings = income > 0 ? Math.max(0, income - expenses) : 0;

  const recent = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const upcomingBills = [...subscriptions].sort((a, b) => new Date(a.next_billing_date).getTime() - new Date(b.next_billing_date).getTime()).slice(0, 4);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="gradient-card rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-xs font-medium">Total Balance</span>
            <Wallet className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalBalance, currency)}</p>
        </div>
        <div className="income-gradient rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-xs font-medium">Income</span>
            <TrendingUp className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(income, currency)}</p>
        </div>
        <div className="expense-gradient rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-xs font-medium">Expenses</span>
            <TrendingDown className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(expenses, currency)}</p>
        </div>
        <div className="investment-gradient rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/80 text-xs font-medium">Savings</span>
            <PiggyBank className="w-4 h-4 text-white/60" />
          </div>
          <p className="text-2xl font-bold">{formatCurrency(savings, currency)}</p>
        </div>
      </div>

      {/* Budget & Recent Transactions */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Budget Progress */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Budget Status</h3>
            <span className="text-xs text-slate-500">{getCurrentMonthYear()}</span>
          </div>
          <div className="space-y-3">
            {budgets.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No budgets set yet</p>
            ) : (
              budgets.map((b) => {
                const spent = monthlyTx
                  .filter((t) => t.type === 'expense' && t.category === b.category)
                  .reduce((s, t) => s + t.amount, 0);
                const percent = Math.min((spent / b.amount) * 100, 100);
                const barColor = percent > 100 ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-emerald-500';

                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{CATEGORY_EMOJIS[b.category] || ''} {b.category}</span>
                      <span className="text-slate-500">{formatCurrency(spent, currency)} / {formatCurrency(b.amount, currency)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} progress-bar rounded-full`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
            <button onClick={onViewAll} className="text-xs text-indigo-600 font-medium">View All</button>
          </div>
          <div className="space-y-2">
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No transactions yet</p>
            ) : (
              recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'} flex items-center justify-center text-lg`}>
                      {CATEGORY_EMOJIS[t.category] || (t.type === 'income' ? '💰' : '💸')}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.category}</p>
                      <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Bills */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">Upcoming Bills</h3>
          <Bell className="w-4 h-4 text-slate-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {upcomingBills.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4 col-span-full">No upcoming bills</p>
          ) : (
            upcomingBills.map((s) => (
              <div key={s.id} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{CATEGORY_EMOJIS[s.category] || '📅'}</span>
                  <span className="font-medium text-sm">{s.service_name}</span>
                </div>
                <p className="text-xs text-slate-500">{new Date(s.next_billing_date).toLocaleDateString()}</p>
                <p className="font-semibold text-indigo-600">{formatCurrency(s.amount, currency)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
