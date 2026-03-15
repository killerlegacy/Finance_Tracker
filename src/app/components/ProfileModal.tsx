'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Profile } from '../lib/types';
import { COUNTRIES, generateId } from '../lib/constants';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: Profile) => void;
  existingProfile: Profile | null;
}

export default function ProfileModal({ isOpen, onClose, onSave, existingProfile }: ProfileModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (existingProfile && isOpen) {
      setFullName(existingProfile.full_name || '');
      setEmail(existingProfile.email || '');
      setPhone(existingProfile.phone || '');
      setCountry(existingProfile.country || '');
    }
  }, [existingProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: existingProfile?.id || generateId(),
      type: 'profile',
      full_name: fullName,
      email,
      phone,
      country,
      currency: existingProfile?.currency || '₨',
      monthly_income: existingProfile?.monthly_income || '',
      financial_goal: existingProfile?.financial_goal || '',
      onboarding_complete: existingProfile?.onboarding_complete ?? true,
      created_at: existingProfile?.created_at || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Edit Profile</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your full name" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Your phone number" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Country</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}
              className="w-full mt-1 px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="w-full py-3 rounded-xl font-medium text-white gradient-card hover:shadow-lg transition-all">
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}
