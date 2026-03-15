'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, TrendingUp, Shield, Bell, PieChart, CreditCard,
  CheckCircle, ArrowRight, Star, Zap, Globe, Lock,
  BarChart3, Target, Repeat, ChevronRight, Menu, X
} from 'lucide-react';
import { getSession } from '../lib/auth';

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    getSession().then((session) => {
      if (session) router.replace('/dashboard');
    });
  }, [router]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'bg-indigo-100 text-indigo-600',
      title: 'Smart Dashboard',
      desc: "Get a bird's-eye view of your finances — income, expenses, savings and net worth all in one place.",
    },
    {
      icon: <Target className="w-6 h-6" />,
      color: 'bg-emerald-100 text-emerald-600',
      title: 'Budget Tracking',
      desc: 'Set monthly budgets per category and watch visual progress bars keep you on track in real time.',
    },
    {
      icon: <Repeat className="w-6 h-6" />,
      color: 'bg-purple-100 text-purple-600',
      title: 'Subscription Manager',
      desc: 'Never miss a renewal. Track all subscriptions with due-date alerts and monthly cost summaries.',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-rose-100 text-rose-600',
      title: 'Income & Expense Log',
      desc: 'Log transactions in seconds. Filter by category, date or type to understand your spending habits.',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      color: 'bg-amber-100 text-amber-600',
      title: 'Multi-Account Support',
      desc: 'Track cash, bank accounts, credit cards and digital wallets all from a single unified interface.',
    },
    {
      icon: <Globe className="w-6 h-6" />,
      color: 'bg-sky-100 text-sky-600',
      title: '17 Currencies',
      desc: 'Works with PKR, USD, EUR, GBP, INR, and 12 more — perfect for users around the world.',
    },
  ];

  const steps = [
    { step: '01', title: 'Create your account', desc: 'Sign up free in under 30 seconds. No credit card required.' },
    { step: '02', title: 'Set up your profile', desc: 'Tell us your country, currency, income range and financial goals.' },
    { step: '03', title: 'Start tracking', desc: 'Log transactions, set budgets and watch your finances come to life.' },
  ];

  const stats = [
    { value: '100%', label: 'Free to use' },
    { value: '17', label: 'Currencies supported' },
    { value: '10+', label: 'Budget categories' },
    { value: '0', label: 'Data sent to servers' },
  ];

  const testimonials = [
    {
      name: 'Ayesha R.',
      role: 'Freelance Designer, Lahore',
      avatar: 'AR',
      color: 'bg-indigo-500',
      text: 'Finally a finance tracker that uses PKR and actually makes sense for how we spend money here. The budget tracking has saved me thousands.',
    },
    {
      name: 'James K.',
      role: 'Software Engineer, London',
      avatar: 'JK',
      color: 'bg-emerald-500',
      text: 'I love that my data stays on my device. No subscription fees, no data harvesting. Just clean, fast finance tracking.',
    },
    {
      name: 'Maria S.',
      role: 'Small Business Owner, Dubai',
      avatar: 'MS',
      color: 'bg-rose-500',
      text: 'The subscription manager alone is worth it. I found three services I was paying for but had completely forgotten about!',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-100' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-card flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">FinanceFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#testimonials" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">Testimonials</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => router.push('/auth?mode=login')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-4 py-2">
              Log in
            </button>
            <button onClick={() => router.push('/auth?mode=register')} className="text-sm font-medium text-white gradient-card px-5 py-2 rounded-xl hover:shadow-lg transition-all">
              Get started free
            </button>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-600 py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-600 py-2">How it works</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-slate-600 py-2">Testimonials</a>
            <div className="flex gap-3 pt-2">
              <button onClick={() => router.push('/auth?mode=login')} className="flex-1 text-sm font-medium border border-slate-200 rounded-xl py-2.5">Log in</button>
              <button onClick={() => router.push('/auth?mode=register')} className="flex-1 text-sm font-medium text-white gradient-card rounded-xl py-2.5">Sign up free</button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 -z-10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl -z-10" />
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            100% Free · No server · Your data stays with you
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Take control of your<br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">finances today</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Track income, expenses, budgets and subscriptions — all in one beautiful dashboard. Works offline. Supports 17 currencies. Completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => router.push('/auth?mode=register')}
              className="inline-flex items-center justify-center gap-2 gradient-card text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all"
            >
              Start tracking free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => router.push('/auth?mode=login')}
              className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-2xl font-semibold text-lg hover:border-indigo-300 hover:shadow-md transition-all"
            >
              Log in to your account
            </button>
          </div>

          {/* Mock Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <div className="w-3 h-3 bg-amber-400 rounded-full" />
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-400 mx-4">financeflow.app/dashboard</div>
              </div>
              <div className="bg-slate-50 p-4">
                <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between mb-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 gradient-card rounded-lg flex items-center justify-center"><Wallet className="w-3.5 h-3.5 text-white" /></div>
                    <span className="font-bold text-sm">FinanceFlow</span>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium">+ Add New</div>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 flex gap-4 mb-3 text-xs shadow-sm overflow-x-auto">
                  {['Dashboard','Transactions','Accounts','Budgets','Subscriptions'].map((t,i) => (
                    <span key={t} className={`whitespace-nowrap ${i===0 ? 'text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-1' : 'text-slate-400'}`}>{t}</span>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {[
                    { label: 'Total Balance', value: '₨284,500', gradient: 'gradient-card' },
                    { label: 'Income', value: '₨120,000', gradient: 'income-gradient' },
                    { label: 'Expenses', value: '₨67,300', gradient: 'expense-gradient' },
                    { label: 'Savings', value: '₨52,700', gradient: 'investment-gradient' },
                  ].map((card) => (
                    <div key={card.label} className={`${card.gradient} rounded-xl p-3 text-white`}>
                      <p className="text-white/70 text-xs mb-1">{card.label}</p>
                      <p className="font-bold text-sm">{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="font-semibold text-xs mb-3">Budget Status</p>
                    {[
                      { cat: '🍔 Food', pct: 65, color: 'bg-amber-400' },
                      { cat: '🚗 Transport', pct: 30, color: 'bg-emerald-400' },
                      { cat: '🛍️ Shopping', pct: 88, color: 'bg-red-400' },
                    ].map((b) => (
                      <div key={b.cat} className="mb-2">
                        <div className="flex justify-between text-xs text-slate-600 mb-1"><span>{b.cat}</span><span>{b.pct}%</span></div>
                        <div className="h-1.5 bg-slate-100 rounded-full"><div className={`h-full ${b.color} rounded-full`} style={{width:`${b.pct}%`}} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <p className="font-semibold text-xs mb-3">Recent Transactions</p>
                    {[
                      { icon: '🍔', name: 'Food', acc: 'Cash', amt: '-₨2,400', color: 'text-red-500' },
                      { icon: '💼', name: 'Salary', acc: 'Bank', amt: '+₨120,000', color: 'text-emerald-600' },
                      { icon: '🛍️', name: 'Shopping', acc: 'Card', amt: '-₨8,700', color: 'text-red-500' },
                    ].map((t) => (
                      <div key={t.name+t.amt} className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-xs">{t.icon}</div>
                          <div><p className="text-xs font-medium">{t.name}</p><p className="text-xs text-slate-400">{t.acc}</p></div>
                        </div>
                        <span className={`text-xs font-semibold ${t.color}`}>{t.amt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-4 top-16 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
              <div><p className="text-xs font-semibold text-slate-800">Saved this month</p><p className="text-sm font-bold text-emerald-600">+₨52,700</p></div>
            </div>
            <div className="hidden md:flex absolute -left-4 bottom-16 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 items-center gap-2">
              <div className="w-8 h-8 bg-rose-100 rounded-xl flex items-center justify-center"><Bell className="w-4 h-4 text-rose-600" /></div>
              <div><p className="text-xs font-semibold text-slate-800">Netflix due in</p><p className="text-sm font-bold text-rose-600">3 days</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 px-4 border-y border-slate-100 bg-slate-50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <PieChart className="w-3.5 h-3.5" />
              Everything you need
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Powerful features, zero complexity</h2>
            <p className="text-lg text-slate-600 max-w-xl mx-auto">Every tool you need to understand and improve your financial health — without the bloat.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:border-indigo-100 transition-all group">
                <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy callout */}
      <section className="py-16 px-4 bg-gradient-to-br from-slate-900 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-400 text-sm font-semibold uppercase tracking-wider">Privacy First</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Your data never leaves your device</h2>
            <p className="text-slate-300 leading-relaxed mb-6">
              FinanceFlow stores everything in your browser&apos;s local storage. We have no servers receiving your financial data, no analytics tracking your spending, and no subscription fees. Just you and your finances.
            </p>
            <div className="space-y-3">
              {[
                'No server-side data storage',
                'No tracking or analytics on your transactions',
                'Works fully offline after first load',
                'Multiple accounts on same device — fully isolated',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <div className="w-56 h-56 bg-indigo-800/50 rounded-full flex items-center justify-center">
                <div className="w-40 h-40 bg-indigo-700/50 rounded-full flex items-center justify-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                    <Shield className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
              <div className="absolute top-4 -right-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-xs font-medium">🔒 Stored locally</div>
              <div className="absolute bottom-8 -left-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2 text-xs font-medium">✅ Zero breach risk</div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Up and running in minutes</h2>
            <p className="text-lg text-slate-600">Three simple steps to financial clarity.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.step} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-indigo-200 to-transparent" />
                )}
                <div className="w-16 h-16 gradient-card rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-lg">{s.step}</span>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Loved by users worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 ${t.color} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 gradient-card rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Ready to take control?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of people who use FinanceFlow to understand their money. Free forever, no strings attached.
          </p>
          <button
            onClick={() => router.push('/auth?mode=register')}
            className="inline-flex items-center gap-2 gradient-card text-white px-10 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all"
          >
            Create free account
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-slate-400 mt-4">No credit card · No email verification · Instant access</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 gradient-card rounded-lg flex items-center justify-center">
              <Wallet className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-800">FinanceFlow</span>
          </div>
          <p className="text-sm text-slate-400">© 2025 FinanceFlow. All data stored locally on your device.</p>
          <div className="flex gap-4">
            <button onClick={() => router.push('/auth?mode=login')} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Log in</button>
            <button onClick={() => router.push('/auth?mode=register')} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Sign up</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
