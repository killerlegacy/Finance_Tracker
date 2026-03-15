'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet, Plus, LayoutDashboard, Receipt, CreditCard, Target, Repeat, User, LogOut, Loader2,
} from 'lucide-react';
import { AnyRecord, Transaction, Account, Budget, Subscription, Profile, TabType } from '../lib/types';
import { getSession, logout } from '../lib/auth';
import { loadAllRecords, createRecord, updateRecord, deleteRecord } from '../lib/db';

import Toast from '../components/Toast';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AddTransactionModal from '../components/AddTransactionModal';
import AccountModal from '../components/AccountModal';
import BudgetModal from '../components/BudgetModal';
import SubscriptionModal from '../components/SubscriptionModal';
import ProfileModal from '../components/ProfileModal';
import Dashboard from '../components/Dashboard';
import TransactionsView from '../components/TransactionsView';
import AccountsView from '../components/AccountsView';
import BudgetsView from '../components/BudgetsView';
import SubscriptionsView from '../components/SubscriptionsView';
import ProfileView from '../components/ProfileView';

export default function DashboardPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<AnyRecord[]>([]);
  const [currency, setCurrency] = useState('₨');
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [showAddTx, setShowAddTx] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg); setToastVisible(true);
  }, []);

  // Auth + load data from Supabase
  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) { router.replace('/auth'); return; }

      setUserId(session.user.id);
      setUserEmail(session.user.email || '');
      setUserName(session.user.user_metadata?.full_name || session.user.email || '');

      const records = await loadAllRecords(session.user.id);

      // Check onboarding complete
      const profile = records.find((d) => d.type === 'profile') as Profile | undefined;
      if (!profile?.onboarding_complete) {
        router.replace('/onboarding');
        return;
      }

      if (profile?.currency) setCurrency(profile.currency);
      setAllData(records);
      setHydrated(true);
    });
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/landing');
  };

  // Derived slices
  const transactions = allData.filter((d): d is Transaction => d.type === 'expense' || d.type === 'income');
  const accounts = allData.filter((d): d is Account => d.type === 'account');
  const budgets = allData.filter((d): d is Budget => d.type === 'budget');
  const subscriptions = allData.filter((d): d is Subscription => d.type === 'subscription');
  const profile = allData.find((d): d is Profile => d.type === 'profile') || null;

  const addRecord = async (record: AnyRecord) => {
    const ok = await createRecord(userId, record);
    if (ok) {
      setAllData((prev) => [...prev, record]);
    } else {
      showToast('Failed to save. Please try again.');
    }
  };

  const upsertProfile = async (p: Profile) => {
    const existing = allData.find((d) => d.type === 'profile');
    const ok = existing ? await updateRecord(userId, p) : await createRecord(userId, p);
    if (ok) {
      setAllData((prev) => {
        const hasProfile = prev.find((d) => d.type === 'profile');
        if (hasProfile) return prev.map((d) => (d.type === 'profile' ? p : d));
        return [...prev, p];
      });
      if (p.currency) setCurrency(p.currency);
    } else {
      showToast('Failed to save profile.');
    }
  };

  const requestDelete = (item: AnyRecord) => {
    setDeleteTarget(item); setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const ok = await deleteRecord(userId, deleteTarget.id);
    setDeleteLoading(false);
    if (ok) {
      setAllData((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      showToast('Deleted successfully!');
    } else {
      showToast('Failed to delete. Please try again.');
    }
    setShowDelete(false);
    setDeleteTarget(null);
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 inline mr-1" /> },
    { key: 'transactions', label: 'Transactions', icon: <Receipt className="w-4 h-4 inline mr-1" /> },
    { key: 'accounts', label: 'Accounts', icon: <CreditCard className="w-4 h-4 inline mr-1" /> },
    { key: 'budgets', label: 'Budgets', icon: <Target className="w-4 h-4 inline mr-1" /> },
    { key: 'subscriptions', label: 'Subscriptions', icon: <Repeat className="w-4 h-4 inline mr-1" /> },
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4 inline mr-1" /> },
  ];

  if (!hydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-card flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-indigo-500 animate-spin mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Loading your finances...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-card flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">FinanceFlow</h1>
            <p className="text-xs text-slate-500 hidden sm:block">{currentDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAddTx(true)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add New</span>
          </button>
          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm hover:bg-indigo-200 transition-colors">
              {userName.charAt(0).toUpperCase()}
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-11 bg-white border border-slate-100 rounded-2xl shadow-xl w-56 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="font-semibold text-sm text-slate-800 truncate">{userName}</p>
                  <p className="text-xs text-slate-500 truncate">{userEmail}</p>
                </div>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200 px-4 shrink-0 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => { setCurrentTab(tab.key); setShowUserMenu(false); }}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                currentTab === tab.key ? 'tab-active' : 'text-slate-600 hover:text-indigo-600'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4" onClick={() => setShowUserMenu(false)}>
        {currentTab === 'dashboard' && <Dashboard transactions={transactions} budgets={budgets} subscriptions={subscriptions} accounts={accounts} currency={currency} onViewAll={() => setCurrentTab('transactions')} />}
        {currentTab === 'transactions' && <TransactionsView transactions={transactions} currency={currency} onDelete={requestDelete} />}
        {currentTab === 'accounts' && <AccountsView accounts={accounts} currency={currency} onDelete={requestDelete} onAdd={() => setShowAccount(true)} />}
        {currentTab === 'budgets' && <BudgetsView budgets={budgets} transactions={transactions} currency={currency} onDelete={requestDelete} onAdd={() => setShowBudget(true)} />}
        {currentTab === 'subscriptions' && <SubscriptionsView subscriptions={subscriptions} currency={currency} onDelete={requestDelete} onAdd={() => setShowSubscription(true)} />}
        {currentTab === 'profile' && <ProfileView profile={profile} currency={currency} onEdit={() => setShowProfile(true)} onCurrencyChange={(c) => { setCurrency(c); showToast(`Currency updated to ${c}`); }} />}
      </main>

      {/* Modals */}
      <AddTransactionModal isOpen={showAddTx} onClose={() => setShowAddTx(false)} onAdd={async (tx) => { await addRecord(tx); showToast('Transaction added!'); }} currency={currency} />
      <AccountModal isOpen={showAccount} onClose={() => setShowAccount(false)} onAdd={async (acc) => { await addRecord(acc); showToast('Account added!'); }} />
      <BudgetModal isOpen={showBudget} onClose={() => setShowBudget(false)} onAdd={async (b) => { await addRecord(b); showToast('Budget set!'); }} existingCategories={budgets.map((b) => b.category)} />
      <SubscriptionModal isOpen={showSubscription} onClose={() => setShowSubscription(false)} onAdd={async (s) => { await addRecord(s); showToast('Subscription added!'); }} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} onSave={async (p) => { await upsertProfile(p); showToast('Profile saved!'); }} existingProfile={profile} />
      <DeleteConfirmModal isOpen={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null); }} onConfirm={confirmDelete} isLoading={deleteLoading} />
      <Toast message={toastMsg} visible={toastVisible} onHide={() => setToastVisible(false)} />
    </div>
  );
}
