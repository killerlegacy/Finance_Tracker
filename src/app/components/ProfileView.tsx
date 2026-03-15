'use client';

import { User, Mail, Phone, Globe, Edit, Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Profile } from '../lib/types';
import { CURRENCIES } from '../lib/constants';
import { deleteAllUserRecords } from '../lib/db';
import { logout } from '../lib/auth';
import { createClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';

interface ProfileViewProps {
  profile: Profile | null;
  currency: string;
  userId: string;
  onEdit: () => void;
  onCurrencyChange: (c: string) => void;
}

export default function ProfileView({ profile, currency, userId, onEdit, onCurrencyChange }: ProfileViewProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const canDelete = confirmText.toLowerCase() === 'delete account' && confirmed;

  const handleDeleteAccount = async () => {
    if (!canDelete) return;
    setDeleting(true);
    setDeleteError('');

    // Delete all records from Supabase
    const recordsDeleted = await deleteAllUserRecords(userId);
    if (!recordsDeleted) {
      setDeleteError('Failed to delete data. Please try again.');
      setDeleting(false);
      return;
    }

    // Delete the Supabase auth user
    const supabase = createClient();
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      // Even if RPC fails, still log out and redirect — data is wiped
      console.error('delete_user rpc error:', error);
    }

    await logout();
    router.push('/landing');
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile?.full_name || 'Add Your Name'}</h2>
            <p className="text-white/80">{profile?.country || 'Country not set'}</p>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg">Personal Information</h3>
          <button onClick={onEdit} className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2">
            <Edit className="w-4 h-4" /> Edit
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <InfoRow icon={<User className="w-5 h-5 text-indigo-600" />} bgColor="bg-indigo-100" label="Full Name" value={profile?.full_name} />
          <InfoRow icon={<Mail className="w-5 h-5 text-purple-600" />} bgColor="bg-purple-100" label="Email" value={profile?.email} />
          <InfoRow icon={<Phone className="w-5 h-5 text-pink-600" />} bgColor="bg-pink-100" label="Phone" value={profile?.phone} />
          <InfoRow icon={<Globe className="w-5 h-5 text-emerald-600" />} bgColor="bg-emerald-100" label="Country" value={profile?.country} />
        </div>
      </div>

      {/* Currency Settings */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-lg mb-4">Currency Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Select Currency</label>
            <select value={currency} onChange={(e) => onCurrencyChange(e.target.value)}
              className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">Current Currency: <span className="font-semibold text-indigo-600">{currency}</span></p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="font-semibold text-lg text-red-600">Danger Zone</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Permanently delete your account and all associated financial data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Red header */}
            <div className="bg-red-500 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Delete Account</h3>
                    <p className="text-red-100 text-xs">This cannot be undone</p>
                  </div>
                </div>
                <button onClick={() => { setShowDeleteModal(false); setConfirmText(''); setConfirmed(false); setDeleteError(''); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Warning list */}
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-red-700 mb-2">The following will be permanently deleted:</p>
                {[
                  'Your account and login credentials',
                  'All transactions and financial records',
                  'All budgets and subscription data',
                  'All account balances and profile info',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm text-red-600">
                    <span className="mt-0.5 shrink-0">✕</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Type confirmation */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Type <span className="font-bold text-red-600">delete account</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="delete account"
                  className={`w-full px-4 py-3 border rounded-xl outline-none text-sm transition-colors ${
                    confirmText.toLowerCase() === 'delete account'
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-slate-200 focus:border-red-300 focus:ring-2 focus:ring-red-100'
                  }`}
                />
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-red-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600">
                  I understand that all my data will be <span className="font-semibold text-slate-800">permanently deleted</span> and this action cannot be reversed.
                </span>
              </label>

              {deleteError && (
                <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{deleteError}</p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setConfirmText(''); setConfirmed(false); setDeleteError(''); }}
                  className="flex-1 py-3 rounded-xl font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!canDelete || deleting}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {deleting ? 'Deleting...' : 'Delete Everything'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, bgColor, label, value }: { icon: React.ReactNode; bgColor: string; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-semibold text-slate-800">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}
