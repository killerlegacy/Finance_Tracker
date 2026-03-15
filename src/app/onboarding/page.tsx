'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { getSession, getUser } from '../lib/auth';
import { createRecord } from '../lib/db';
import { generateId } from '../lib/constants';
import { Profile } from '../lib/types';
import { COUNTRIES, CURRENCIES } from '../lib/constants';

const FINANCIAL_GOALS = [
  { value: 'save_emergency', label: '🏦 Build an emergency fund', desc: '3–6 months of expenses saved' },
  { value: 'pay_debt', label: '💳 Pay off debt', desc: 'Credit cards, loans or other debts' },
  { value: 'save_purchase', label: '🏠 Save for a big purchase', desc: 'Home, car, education, travel' },
  { value: 'invest', label: '📈 Start investing', desc: 'Grow wealth over time' },
  { value: 'budget', label: '📊 Stick to a budget', desc: 'Track and control spending' },
  { value: 'general', label: '🎯 General financial awareness', desc: 'Understand where money goes' },
];

const INCOME_RANGES = [
  { value: 'under_30k', label: 'Under ₨30,000 / month' },
  { value: '30k_60k', label: '₨30,000 – ₨60,000 / month' },
  { value: '60k_100k', label: '₨60,000 – ₨100,000 / month' },
  { value: '100k_200k', label: '₨100,000 – ₨200,000 / month' },
  { value: 'over_200k', label: 'Over ₨200,000 / month' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('₨');
  const [incomeRange, setIncomeRange] = useState('');
  const [financialGoal, setFinancialGoal] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.replace('/auth'); return; }
      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
      setUserName(session.user.user_metadata?.full_name || session.user.email || '');
      setLoading(false);
    });
  }, [router]);

  const canProceed = () => {
    if (step === 1) return country !== '' && currency !== '';
    if (step === 2) return incomeRange !== '' && financialGoal !== '';
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    const profile: Profile = {
      id: generateId(),
      type: 'profile',
      full_name: userName,
      email: userEmail,
      phone,
      country,
      currency,
      monthly_income: incomeRange,
      financial_goal: financialGoal,
      onboarding_complete: true,
      created_at: new Date().toISOString(),
    };

    const ok = await createRecord(userId, profile);
    if (!ok) {
      setError('Failed to save profile. Please try again.');
      setSaving(false);
      return;
    }
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const progressPct = ((step - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 gradient-card rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">FinanceFlow</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Setup</p>
                <h2 className="text-lg font-bold text-slate-800">
                  {step === 1 && `Welcome, ${userName.split(' ')[0]}! 👋`}
                  {step === 2 && 'Your financial picture'}
                  {step === 3 && 'Contact details'}
                  {step === 4 && "You're all set!"}
                </h2>
              </div>
              <span className="text-sm font-semibold text-slate-400">{step} / {totalSteps}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full gradient-card progress-bar rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-5">
                <p className="text-slate-600 text-sm">Let&apos;s personalise your experience. Where are you based and what currency do you use?</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Your Country</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                    <option value="">Select your country</option>
                    {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Preferred Currency</label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {CURRENCIES.slice(0, 9).map((c) => (
                      <button key={c.value} type="button" onClick={() => setCurrency(c.value)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
                          currency === c.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}>
                        {c.value} <span className="text-xs text-slate-400">{c.label.split('(')[0].trim().split(' ').pop()}</span>
                      </button>
                    ))}
                  </div>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-500">
                    <option value="">Or pick from full list...</option>
                    {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <p className="text-slate-600 text-sm">This helps us tailor your dashboard. All info is private to you.</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Monthly Income Range</label>
                  <div className="space-y-2">
                    {INCOME_RANGES.map((r) => (
                      <button key={r.value} type="button" onClick={() => setIncomeRange(r.value)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          incomeRange === r.value ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-medium' : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                        }`}>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Primary Financial Goal</label>
                  <div className="grid grid-cols-1 gap-2">
                    {FINANCIAL_GOALS.map((g) => (
                      <button key={g.value} type="button" onClick={() => setFinancialGoal(g.value)}
                        className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                          financialGoal === g.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
                        }`}>
                        <span className="font-medium text-slate-800">{g.label}</span>
                        <span className="text-slate-500 text-xs block">{g.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <p className="text-slate-600 text-sm">Almost done! Add your phone number for your profile (optional).</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Profile summary</p>
                  {[['Name', userName], ['Email', userEmail], ['Country', country], ['Currency', currency],
                    ['Goal', FINANCIAL_GOALS.find(g => g.value === financialGoal)?.label || '']].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">You&apos;re ready to go!</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Your profile is set up. Your data will sync across all your devices automatically via Supabase cloud storage.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[{ icon: '📊', label: 'Add transactions' }, { icon: '🎯', label: 'Set budgets' }, { icon: '🔁', label: 'Track subscriptions' }].map((item) => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                      <div className="text-2xl mb-1">{item.icon}</div>
                      <p className="text-xs text-slate-600 font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>
            )}

            <div className="flex gap-3 mt-6">
              {step > 1 && step < 4 && (
                <button onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 3 && (
                <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white gradient-card hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 3 && (
                <button onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white gradient-card hover:shadow-lg transition-all">
                  Review & Finish <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 4 && (
                <button onClick={handleFinish} disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white gradient-card hover:shadow-lg transition-all disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Go to Dashboard'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
