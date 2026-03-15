'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, Eye, EyeOff, ArrowLeft, Loader2 } from 'lucide-react';
import { loginUser, registerUser, getSession } from '../lib/auth';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'register' || m === 'login') setMode(m);
    // Check existing session
    getSession().then((session) => {
      if (session) router.replace('/dashboard');
      else setLoading(false);
    });
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!fullName.trim()) { setError('Please enter your full name.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    }

    setLoading(true);
    const result = mode === 'register'
      ? await registerUser(email, password, fullName)
      : await loginUser(email, password);
    
    if (!result.ok) {
      setError(result.error || 'Something went wrong.');
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  const switchMode = (m: 'login' | 'register') => {
    setMode(m);
    setError('');
    setFullName(''); setEmail(''); setPassword(''); setConfirmPassword('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button onClick={() => router.push('/landing')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="gradient-card p-8 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">FinanceFlow</h1>
            <p className="text-white/80 text-sm mt-1">
              {mode === 'login' ? 'Welcome back!' : 'Start your financial journey'}
            </p>
          </div>

          <div className="flex border-b border-slate-100">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors capitalize ${
                  mode === m ? 'text-indigo-600 border-b-2 border-indigo-600 -mb-px' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {m === 'login' ? 'Log In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                  placeholder="e.g. Ali Hassan"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {mode === 'register' && (
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  placeholder="Repeat your password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-indigo-600 font-semibold hover:underline">
                {mode === 'login' ? 'Sign up free' : 'Log in'}
              </button>
            </p>
          </form>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          🔒 Your data is securely stored in the cloud — access from any device
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    }>
      <AuthForm />
    </Suspense>
  );
}
