'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wallet, Plus, LayoutDashboard, Receipt, CreditCard, Target, Repeat, User,
} from 'lucide-react';
import { AnyRecord, Transaction, Account, Budget, Subscription, Profile, TabType } from './lib/types';
import { generateId } from './lib/constants';

import Toast from './components/Toast';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import AddTransactionModal from './components/AddTransactionModal';
import AccountModal from './components/AccountModal';
import BudgetModal from './components/BudgetModal';
import SubscriptionModal from './components/SubscriptionModal';
import ProfileModal from './components/ProfileModal';
import Dashboard from './components/Dashboard';
import TransactionsView from './components/TransactionsView';
import AccountsView from './components/AccountsView';
import BudgetsView from './components/BudgetsView';
import SubscriptionsView from './components/SubscriptionsView';
import ProfileView from './components/ProfileView';

const STORAGE_KEY = 'finance_tracker_data';
const CURRENCY_KEY = 'finance_tracker_currency';

export default function Home() {
  const [allData, setAllData] = useState<AnyRecord[]>([]);
  const [currency, setCurrency] = useState('₨');
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [hydrated, setHydrated] = useState(false);

  // Modal states
  const [showAddTx, setShowAddTx] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnyRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setAllData(JSON.parse(stored));
      const storedCurrency = localStorage.getItem(CURRENCY_KEY);
      if (storedCurrency) setCurrency(storedCurrency);
    } catch {}
    setHydrated(true);
  }, []);

  // Persist to localStorage whenever data changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
    } catch {}
  }, [allData, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CURRENCY_KEY, currency);
    } catch {}
  }, [currency, hydrated]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  }, []);

  // Derived data
  const transactions = allData.filter((d): d is Transaction => d.type === 'expense' || d.type === 'income');
  const accounts = allData.filter((d): d is Account => d.type === 'account');
  const budgets = allData.filter((d): d is Budget => d.type === 'budget');
  const subscriptions = allData.filter((d): d is Subscription => d.type === 'subscription');
  const profile = allData.find((d): d is Profile => d.type === 'profile') || null;

  // CRUD helpers
  const addRecord = (record: AnyRecord) => {
    setAllData((prev) => [...prev, record]);
  };

  const deleteRecord = (record: AnyRecord) => {
    setAllData((prev) => prev.filter((d) => d.id !== record.id));
  };

  const upsertProfile = (p: Profile) => {
    setAllData((prev) => {
      const existing = prev.find((d) => d.type === 'profile');
      if (existing) return prev.map((d) => (d.type === 'profile' ? p : d));
      return [...prev, p];
    });
  };

  // Delete flow
  const requestDelete = (item: AnyRecord) => {
    setDeleteTarget(item);
    setShowDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await new Promise((r) => setTimeout(r, 300)); // brief UX delay
    deleteRecord(deleteTarget);
    setDeleteLoading(false);
    setShowDelete(false);
    setDeleteTarget(null);
    showToast('Deleted successfully!');
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
          <p className="text-slate-500 text-sm">Loading...</p>
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
            <h1 className="text-lg font-bold text-slate-800">Personal Finance</h1>
            <p className="text-xs text-slate-500">{currentDate}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddTx(true)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 px-4 shrink-0 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                currentTab === tab.key
                  ? 'tab-active'
                  : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4">
        {currentTab === 'dashboard' && (
          <Dashboard
            transactions={transactions}
            budgets={budgets}
            subscriptions={subscriptions}
            accounts={accounts}
            currency={currency}
            onViewAll={() => setCurrentTab('transactions')}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            currency={currency}
            onDelete={requestDelete}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            currency={currency}
            onDelete={requestDelete}
            onAdd={() => setShowAccount(true)}
          />
        )}

        {currentTab === 'budgets' && (
          <BudgetsView
            budgets={budgets}
            transactions={transactions}
            currency={currency}
            onDelete={requestDelete}
            onAdd={() => setShowBudget(true)}
          />
        )}

        {currentTab === 'subscriptions' && (
          <SubscriptionsView
            subscriptions={subscriptions}
            currency={currency}
            onDelete={requestDelete}
            onAdd={() => setShowSubscription(true)}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            profile={profile}
            currency={currency}
            onEdit={() => setShowProfile(true)}
            onCurrencyChange={(c) => {
              setCurrency(c);
              showToast(`Currency updated to ${c}`);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <AddTransactionModal
        isOpen={showAddTx}
        onClose={() => setShowAddTx(false)}
        onAdd={(tx) => {
          addRecord(tx);
          showToast('Transaction added!');
        }}
        currency={currency}
      />

      <AccountModal
        isOpen={showAccount}
        onClose={() => setShowAccount(false)}
        onAdd={(acc) => {
          addRecord(acc);
          showToast('Account added!');
        }}
      />

      <BudgetModal
        isOpen={showBudget}
        onClose={() => setShowBudget(false)}
        onAdd={(b) => {
          addRecord(b);
          showToast('Budget set!');
        }}
        existingCategories={budgets.map((b) => b.category)}
      />

      <SubscriptionModal
        isOpen={showSubscription}
        onClose={() => setShowSubscription(false)}
        onAdd={(s) => {
          addRecord(s);
          showToast('Subscription added!');
        }}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        onSave={(p) => {
          upsertProfile(p);
          showToast('Profile saved!');
        }}
        existingProfile={profile}
      />

      <DeleteConfirmModal
        isOpen={showDelete}
        onClose={() => {
          setShowDelete(false);
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        isLoading={deleteLoading}
      />

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </div>
  );
}
