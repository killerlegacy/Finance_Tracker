'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Budget } from '../lib/types';
import { EXPENSE_CATEGORIES, CATEGORY_EMOJIS, generateId } from '../lib/constants';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (budget: Budget) => void;
  existingCategories: string[];
}

export default function BudgetModal({ isOpen, onClose, onAdd, existingCategories }: BudgetModalProps) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const availableCategories = EXPENSE_CATEGORIES.filter((c) => !existingCategories.includes(c));

  if (!isOpen) return null;

  const handleClose = () => {
    setCategory('');
    setAmount('');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!category) { setError('Please select a category'); return; }
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid budget amount'); return; }
    if (existingCategories.includes(category)) { setError('Budget for this category already exists'); return; }

    onAdd({
      id: generateId(),
      type: 'budget',
      category,
      amount: parseFloat(amount),
      created_at: new Date().toISOString(),
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Set Budget</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select category</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>{CATEGORY_EMOJIS[c]} {c}</option>
              ))}
            </select>
            {availableCategories.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">All categories already have budgets.</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Monthly Budget</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="0.01"
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="20000"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl font-medium text-white gradient-card hover:shadow-lg transition-all">
            Set Budget
          </button>
        </form>
      </div>
    </div>
  );
}
