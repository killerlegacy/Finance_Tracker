'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Transaction } from '../lib/types';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, ACCOUNT_TYPES, CATEGORY_EMOJIS, generateId } from '../lib/constants';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Transaction) => void;
  currency: string;
}

export default function AddTransactionModal({ isOpen, onClose, onAdd, currency }: AddTransactionModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [source, setSource] = useState('');
  const [account, setAccount] = useState('Cash');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setTxType('expense');
    setAmount('');
    setCategory('');
    setSource('');
    setAccount('Cash');
    setDate(today);
    setNotes('');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    if (txType === 'expense' && !category) {
      setError('Please select a category');
      return;
    }
    if (txType === 'income' && !source) {
      setError('Please select an income source');
      return;
    }
    if (!date) {
      setError('Please select a date');
      return;
    }

    const tx: Transaction = {
      id: generateId(),
      type: txType,
      date,
      amount: parseFloat(amount),
      category: txType === 'expense' ? category : source,
      source: txType === 'income' ? source : '',
      account,
      notes,
      created_at: new Date().toISOString(),
    };

    onAdd(tx);
    handleClose();
  };

  return (
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-auto shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="font-semibold text-lg">Add Transaction</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTxType('expense')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm ${txType === 'expense' ? 'expense-gradient text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTxType('income')}
              className={`flex-1 py-3 rounded-xl font-medium text-sm ${txType === 'income' ? 'income-gradient text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-slate-700">Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{currency}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Category or Source */}
          {txType === 'expense' ? (
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-700">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select source</option>
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>{CATEGORY_EMOJIS[s]} {s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Account */}
          <div>
            <label className="text-sm font-medium text-slate-700">Account</label>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ACCOUNT_TYPES.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add a note..."
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-xl font-medium text-white gradient-card hover:shadow-lg transition-all"
          >
            Add Transaction
          </button>
        </form>
      </div>
    </div>
  );
}
