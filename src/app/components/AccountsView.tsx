'use client';

import { Trash2, PlusCircle } from 'lucide-react';
import { Account } from '../lib/types';
import { ACCOUNT_ICONS, formatCurrency } from '../lib/constants';

interface AccountsViewProps {
  accounts: Account[];
  currency: string;
  onDelete: (item: Account) => void;
  onAdd: () => void;
}

export default function AccountsView({ accounts, currency, onDelete, onAdd }: AccountsViewProps) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative group">
            <button
              onClick={() => onDelete(a)}
              className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl">
                {ACCOUNT_ICONS[a.category] || '💰'}
              </div>
              <div>
                <p className="font-semibold">{a.service_name}</p>
                <p className="text-sm text-slate-500">{a.category}</p>
              </div>
            </div>
            <p className={`text-2xl font-bold ${a.amount < 0 ? 'text-red-500' : 'text-slate-800'}`}>
              {formatCurrency(a.amount, currency)}
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-6 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
      >
        <PlusCircle className="w-5 h-5" />
        Add Account
      </button>
    </div>
  );
}
