'use client';

import { User, Mail, Phone, Globe, Edit } from 'lucide-react';
import { Profile } from '../lib/types';
import { CURRENCIES } from '../lib/constants';

interface ProfileViewProps {
  profile: Profile | null;
  currency: string;
  onEdit: () => void;
  onCurrencyChange: (c: string) => void;
}

export default function ProfileView({ profile, currency, onEdit, onCurrencyChange }: ProfileViewProps) {
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
          <button
            onClick={onEdit}
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit
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
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value)}
              className="w-full mt-2 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600">
              Current Currency: <span className="font-semibold text-indigo-600">{currency}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  bgColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  bgColor: string;
  label: string;
  value?: string;
}) {
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
