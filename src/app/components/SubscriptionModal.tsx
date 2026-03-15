'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Subscription } from '../lib/types';
import { generateId } from '../lib/constants';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (sub: Subscription) => void;
}

const SUB_CATEGORIES = ['Entertainment', 'Utilities', 'Education', 'Health', 'Other'];
const SUB_CATEGORY_EMOJIS: Record<string, string> = {
  Entertainment: '🎬',
  Utilities: '💡',
  Education: '📚',
  Health: '💊',
  Other: '📦',
};

export default function SubscriptionModal({ isOpen, onClose, onAdd }: SubscriptionModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [cycle, setCycle] = useState<'Monthly' | 'Yearly' | 'Weekly'>('Monthly');
  const [billingDate, setBillingDate] = useState(today);
  const [category, setCategory] = useState('Entertainment');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setCost('');
    setCycle('Monthly');
    setBillingDate(today);
    setCategory('Entertainment');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter a service name'); return; }
    if (!cost || parseFloat(cost) <= 0) { setError('Please enter a valid cost'); return; }
    if (!billingDate) { setError('Please select a billing date'); return; }

    onAdd({
      id: generateId(),
      type: 'subscription',
      service_name: name.trim(),
      amount: parseFloat(cost),
      billing_cycle: cycle,
      next_billing_date: billingDate,
      category,
      created_at: new Date().toISOString(),
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Add Subscription</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Service Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Netflix"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Cost</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="1100"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Billing Cycle</label>
            <select
              value={cycle}
              onChange={(e) => setCycle(e.target.value as 'Monthly' | 'Yearly' | 'Weekly')}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="Weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Next Billing Date</label>
            <input
              type="date"
              value={billingDate}
              onChange={(e) => setBillingDate(e.target.value)}
              required
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SUB_CATEGORIES.map((c) => (
                <option key={c} value={c}>{SUB_CATEGORY_EMOJIS[c]} {c}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl font-medium text-white gradient-card hover:shadow-lg transition-all">
            Add Subscription
          </button>
        </form>
      </div>
    </div>
  );
}
