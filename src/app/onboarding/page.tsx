'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ChevronRight, ChevronLeft, Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { getSession } from '../lib/auth';
import { createRecord } from '../lib/db';
import { generateId } from '../lib/constants';
import { Profile, Account } from '../lib/types';
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

const ACCOUNT_TYPES = [
  { value: 'Bank', label: '🏦 Bank Account' },
  { value: 'Cash', label: '💵 Cash' },
  { value: 'Credit Card', label: '💳 Credit Card' },
  { value: 'Digital Wallet', label: '📱 Digital Wallet' },
  { value: 'Savings', label: '🐷 Savings Account' },
];

interface InitialAccount {
  name: string;
  type: string;
  balance: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Step 1
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('₨');

  // Step 2
  const [incomeRange, setIncomeRange] = useState('');
  const [financialGoal, setFinancialGoal] = useState('');

  // Step 3 — initial accounts
  const [accounts, setAccounts] = useState<InitialAccount[]>([
    { name: '', type: 'Bank', balance: '' },
  ]);

  // Step 4
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
    if (step === 3) {
      // At least one account must have a name and valid balance
      return accounts.some((a) => a.name.trim() !== '' && a.balance !== '' && !isNaN(parseFloat(a.balance)));
    }
    return true;
  };

  const addAccount = () => {
    if (accounts.length < 5) setAccounts([...accounts, { name: '', type: 'Bank', balance: '' }]);
  };

  const removeAccount = (i: number) => {
    if (accounts.length > 1) setAccounts(accounts.filter((_, idx) => idx !== i));
  };

  const updateAccount = (i: number, field: keyof InitialAccount, value: string) => {
    setAccounts(accounts.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  const handleFinish = async () => {
    setSaving(true);
    setError('');

    // Save profile
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

    const profileOk = await createRecord(userId, profile);
    if (!profileOk) {
      setError('Failed to save profile. Please try again.');
      setSaving(false);
      return;
    }

    // Save valid accounts
    const validAccounts = accounts.filter((a) => a.name.trim() && a.balance !== '' && !isNaN(parseFloat(a.balance)));
    for (const acc of validAccounts) {
      const accountRecord: Account = {
        id: generateId(),
        type: 'account',
        service_name: acc.name.trim(),
        category: acc.type,
        amount: parseFloat(acc.balance),
        created_at: new Date().toISOString(),
      };
      await createRecord(userId, accountRecord);
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

  const stepTitles: Record<number, string> = {
    1: `Welcome, ${userName.split(' ')[0]}! 👋`,
    2: 'Your financial picture',
    3: 'Add your accounts',
    4: 'Contact details',
    5: "You're all set!",
  };

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
          {/* Progress header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Setup</p>
                <h2 className="text-lg font-bold text-slate-800">{stepTitles[step]}</h2>
              </div>
              <span className="text-sm font-semibold text-slate-400">{step} / {totalSteps}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full gradient-card progress-bar rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="p-6">

            {/* Step 1: Country & Currency */}
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

            {/* Step 2: Income & Goal */}
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

            {/* Step 3: Initial Accounts */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-slate-600 text-sm">Add at least one account to track your starting balance. You can add more later.</p>
                <div className="space-y-3">
                  {accounts.map((acc, i) => (
                    <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-3 relative">
                      {accounts.length > 1 && (
                        <button onClick={() => removeAccount(i)}
                          className="absolute top-3 right-3 p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Account Name</label>
                        <input type="text" value={acc.name} onChange={(e) => updateAccount(i, 'name', e.target.value)}
                          placeholder="e.g. HBL Bank, Cash Wallet"
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Account Type</label>
                          <select value={acc.type} onChange={(e) => updateAccount(i, 'type', e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
                            {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 block mb-1">Current Balance ({currency})</label>
                          <input type="number" value={acc.balance} onChange={(e) => updateAccount(i, 'balance', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {accounts.length < 5 && (
                  <button onClick={addAccount}
                    className="w-full border-2 border-dashed border-slate-300 rounded-xl py-3 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add another account
                  </button>
                )}
                <p className="text-xs text-slate-400 text-center">This sets your starting balance so your Total Balance is accurate from day one.</p>
              </div>
            )}

            {/* Step 4: Phone */}
            {step === 4 && (
              <div className="space-y-5">
                <p className="text-slate-600 text-sm">Almost done! Add your phone number for your profile (optional).</p>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Profile summary</p>
                  {[
                    ['Name', userName],
                    ['Country', country],
                    ['Currency', currency],
                    ['Accounts', accounts.filter(a => a.name).map(a => a.name).join(', ') || '—'],
                    ['Goal', FINANCIAL_GOALS.find(g => g.value === financialGoal)?.label || ''],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Done */}
            {step === 5 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">You&apos;re ready to go!</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    Your profile and accounts are set up. Your data syncs across all your devices automatically.
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

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 1 && step < 5 && (
                <button onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:border-slate-300 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 4 && (
                <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white gradient-card hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 4 && (
                <button onClick={() => setStep(5)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white gradient-card hover:shadow-lg transition-all">
                  Review & Finish <ChevronRight className="w-4 h-4" />
                </button>
              )}
              {step === 5 && (
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
