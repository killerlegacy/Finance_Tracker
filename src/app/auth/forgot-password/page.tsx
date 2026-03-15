'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft, Loader2, Mail, CheckCircle } from 'lucide-react';
import { createClient } from '../../lib/supabase';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many')) {
        setError('Too many requests. Please wait a few minutes before trying again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => router.push('/auth')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to login
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="gradient-card p-8 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold">FinanceFlow</h1>
            <p className="text-white/80 text-sm mt-1">Reset your password</p>
          </div>

          <div className="p-6">
            {!sent ? (
              <>
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Forgot your password?</h2>
                  <p className="text-sm text-slate-500">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>

                  <p className="text-center text-sm text-slate-500">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => router.push('/auth')}
                      className="text-indigo-600 font-semibold hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Check your email</h2>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    We&apos;ve sent a password reset link to{' '}
                    <span className="font-semibold text-slate-700">{email}</span>.
                    Click the link in the email to set a new password.
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-400 text-left space-y-1">
                  <p>• Check your spam folder if you don&apos;t see it</p>
                  <p>• The link expires in 1 hour</p>
                  <p>• You can only request one reset email every 60 seconds</p>
                </div>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="text-sm text-indigo-600 font-medium hover:underline"
                >
                  Send to a different email
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
