'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Account } from '../lib/types';
import { ACCOUNT_TYPES, generateId } from '../lib/constants';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: Account) => void;
}

export default function AccountModal({ isOpen, onClose, onAdd }: AccountModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Bank');
  const [balance, setBalance] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setName('');
    setType('Bank');
    setBalance('');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Please enter an account name'); return; }
    if (!balance) { setError('Please enter a balance'); return; }

    onAdd({
      id: generateId(),
      type: 'account',
      service_name: name.trim(),
      category: type,
      amount: parseFloat(balance),
      created_at: new Date().toISOString(),
    });
    handleClose();
  };

  return (
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Add Account</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., HBL Bank"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Account Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Current Balance</label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
              step="0.01"
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="0"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl font-medium text-white gradient-card hover:shadow-lg transition-all">
            Add Account
          </button>
        </form>
      </div>
    </div>
  );
}
