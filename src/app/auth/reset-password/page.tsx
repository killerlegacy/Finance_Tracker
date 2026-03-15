'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      } else if (event === 'SIGNED_IN' && session) {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      } else {
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) setInvalidLink(true);
          });
        }, 3000);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('same password')) {
        setError('Your new password must be different from your current password.');
      } else {
        setError('Failed to reset password. Your link may have expired. Please request a new one.');
      }
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  if (invalidLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="gradient-card p-8 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">FinanceFlow</h1>
            </div>
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 mb-2">Link expired or invalid</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  This password reset link has expired or already been used. Please request a new one.
                </p>
              </div>
              <button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full py-3 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all text-sm"
              >
                Request New Reset Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="gradient-card p-8 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">FinanceFlow</h1>
            <p className="text-white/80 text-sm mt-1">Set a new password</p>
          </div>

          <div className="p-6">
            {!sessionReady ? (
              <div className="text-center py-8 space-y-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                <p className="text-sm text-slate-500">Verifying your reset link...</p>
              </div>
            ) : done ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Password updated!</h2>
                  <p className="text-sm text-slate-500">
                    Your password has been successfully changed. Redirecting you to the dashboard...
                  </p>
                </div>
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mx-auto" />
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Create new password</h2>
                  <p className="text-sm text-slate-500">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Min. 6 characters"
                        className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {password.length > 0 && (
                      <div className="mt-2 flex gap-1 items-center">
                        {[1, 2, 3, 4].map((level) => {
                          const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1;
                          return (
                            <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                              level <= strength
                                ? strength === 1 ? 'bg-red-400' : strength === 2 ? 'bg-amber-400' : 'bg-emerald-400'
                                : 'bg-slate-100'
                            }`} />
                          );
                        })}
                        <span className="text-xs text-slate-400 ml-1">
                          {password.length < 6 ? 'Too short' : password.length < 8 ? 'Weak' : password.length < 12 ? 'Good' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repeat your new password"
                      className={`w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-colors ${
                        confirmPassword.length > 0 && confirmPassword !== password
                          ? 'border-red-300 focus:ring-red-100'
                          : confirmPassword.length > 0 && confirmPassword === password
                          ? 'border-emerald-300'
                          : 'border-slate-200'
                      }`}
                    />
                    {confirmPassword.length > 0 && confirmPassword !== password && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || password !== confirmPassword || password.length < 6}
                    className="w-full py-3.5 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
