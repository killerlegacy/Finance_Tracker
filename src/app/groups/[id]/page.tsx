'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Plus, Users, Receipt, Calculator, Settings,
  Loader2, Copy, Check, Crown, Trash2, LogOut, UserPlus,
  ChevronRight, AlertTriangle, X
} from 'lucide-react';
import { getSession } from '../../lib/auth';
import {
  getGroup, getGroupMembers, getGroupExpenses, getGroupSettlements,
  addGroupExpense, deleteGroupExpense, markSettled, saveSettlements,
  calculateSettlements, updateMemberRole, removeMember, leaveGroup,
  deleteGroup, Group, GroupMember, GroupExpense, GroupSettlement
} from '../../lib/groups';
import { CATEGORY_EMOJIS, CURRENCIES } from '../../lib/constants';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Housing', 'Utilities', 'Shopping', 'Health', 'Entertainment', 'Education', 'Miscellaneous'];

type TabType = 'overview' | 'expenses' | 'settlements' | 'members';

export default function GroupDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [settlements, setSettlements] = useState<GroupSettlement[]>([]);
  const [myRole, setMyRole] = useState<'admin' | 'member'>('member');
  const [tab, setTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Modals
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [showLeaveGroup, setShowLeaveGroup] = useState(false);
  const [deleteGroupText, setDeleteGroupText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Add expense form
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const loadData = async (uid: string) => {
    const [g, m, e, s] = await Promise.all([
      getGroup(groupId),
      getGroupMembers(groupId),
      getGroupExpenses(groupId),
      getGroupSettlements(groupId),
    ]);
    if (!g) { router.replace('/groups'); return; }
    setGroup(g);
    setMembers(m);
    setExpenses(e);
    setSettlements(s);
    const me = m.find((mem) => mem.user_id === uid);
    if (me) setMyRole(me.role);
    setLoading(false);
  };

  useEffect(() => {
    getSession().then((session) => {
      if (!session) { router.replace('/auth'); return; }
      setUserId(session.user.id);
      setUserName(session.user.user_metadata?.full_name || session.user.email || 'You');
      loadData(session.user.id);
    });
  }, [groupId]);

  const copyInviteCode = () => {
    if (!group) return;
    const link = `${window.location.origin}/groups/join?code=${group.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Invite link copied!');
  };

  const handleAddExpense = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!expTitle.trim() || !expAmount) return;
  setActionLoading(true);

  const expense = await addGroupExpense({
    group_id: groupId,
    paid_by: userId,
    paid_by_name: userName,
    title: expTitle.trim(),
    amount: parseFloat(expAmount),
    category: expCategory,
    split_type: 'equal',
    date: expDate,
    notes: expNotes,
  });

  if (expense) {
    const newExpenses = [expense, ...expenses];
    setExpenses(newExpenses);

    // Recalculate settlements from scratch using ALL expenses
    // Only recalculate unsettled — settled ones stay as history
    const newSettlements = calculateSettlements(newExpenses, members);
    await saveSettlements(groupId, newSettlements);

    // Reload settlements fresh from DB to get accurate state
    const s = await getGroupSettlements(groupId);
    setSettlements(s);

    setShowAddExpense(false);
    setExpTitle('');
    setExpAmount('');
    setExpNotes('');
    setExpCategory('Food');
    showToast('Expense added!');
  } else {
    showToast('Failed to add expense. Please try again.');
  }
  setActionLoading(false);
};

  const handleDeleteExpense = async (expId: string) => {
  await deleteGroupExpense(expId);
  const newExpenses = expenses.filter((e) => e.id !== expId);
  setExpenses(newExpenses);

  // Recalculate from scratch with remaining expenses
  const newSettlements = calculateSettlements(newExpenses, members);
  await saveSettlements(groupId, newSettlements);

  // Reload fresh
  const s = await getGroupSettlements(groupId);
  setSettlements(s);
  showToast('Expense deleted.');
};

  const handleMarkSettled = async (settlementId: string) => {
    if (myRole !== 'admin') { showToast('Only admins can mark settlements.'); return; }
    setActionLoading(true);
    const ok = await markSettled(settlementId, userId);
    if (ok) {
      setSettlements((prev) => prev.map((s) => s.id === settlementId ? { ...s, settled: true, settled_by: userId, settled_at: new Date().toISOString() } : s));
      showToast('Marked as settled!');
    }
    setActionLoading(false);
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'member') => {
    if (targetUserId === userId) { showToast("You can't change your own role."); return; }
    await updateMemberRole(groupId, targetUserId, newRole);
    setMembers((prev) => prev.map((m) => m.user_id === targetUserId ? { ...m, role: newRole } : m));
    showToast(newRole === 'admin' ? 'Member promoted to admin!' : 'Admin demoted to member.');
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    if (targetUserId === userId) return;
    await removeMember(groupId, targetUserId);
    const newMembers = members.filter((m) => m.user_id !== targetUserId);
    setMembers(newMembers);
    const newSettlements = calculateSettlements(expenses, newMembers);
    await saveSettlements(groupId, newSettlements);
    const s = await getGroupSettlements(groupId);
    setSettlements(s);
    showToast(`${name} removed from group.`);
  };

  const handleLeaveGroup = async () => {
    setActionLoading(true);
    await leaveGroup(groupId, userId);
    router.push('/groups');
  };

  const handleDeleteGroup = async () => {
    if (!group || deleteGroupText !== group.name) return;
    setActionLoading(true);
    await deleteGroup(groupId);
    router.push('/groups');
  };

  // Derived stats
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const myExpenses = expenses.filter((e) => e.paid_by === userId);
  const myTotal = myExpenses.reduce((s, e) => s + e.amount, 0);
  const currency = group?.currency || '₨';
  const fmt = (n: number) => currency + Math.abs(n).toLocaleString();
  const pendingSettlements = settlements.filter((s) => !s.settled);
  const settledSettlements = settlements.filter((s) => s.settled);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Calculator className="w-4 h-4" /> },
    { key: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" /> },
    { key: 'settlements', label: 'Settlements', icon: <ChevronRight className="w-4 h-4" /> },
    { key: 'members', label: 'Members', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/groups')} className="p-2 hover:bg-slate-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="font-bold text-slate-800">{group.name}</h1>
              <p className="text-xs text-slate-500">{members.length} members · {currency}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : `Invite: ${group.invite_code}`}
            </button>
            <button
              onClick={() => setShowAddExpense(true)}
              className="gradient-card text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200 px-4 overflow-x-auto shrink-0">
        <div className="flex min-w-max">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key ? 'tab-active' : 'text-slate-600 hover:text-indigo-600'
              }`}
            >
              {t.icon}{t.label}
              {t.key === 'settlements' && pendingSettlements.length > 0 && (
                <span className="ml-1 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  {pendingSettlements.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4 max-w-2xl w-full mx-auto space-y-4">

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="gradient-card rounded-2xl p-4 text-white">
                <p className="text-white/70 text-xs mb-1">Total Spent</p>
                <p className="text-2xl font-bold">{fmt(totalSpent)}</p>
                <p className="text-white/60 text-xs mt-1">{expenses.length} expenses</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
                <p className="text-white/70 text-xs mb-1">Your Share</p>
                <p className="text-2xl font-bold">{fmt(members.length > 0 ? totalSpent / members.length : 0)}</p>
                <p className="text-white/60 text-xs mt-1">of {members.length} members</p>
              </div>
              <div className="income-gradient rounded-2xl p-4 text-white">
                <p className="text-white/70 text-xs mb-1">You Paid</p>
                <p className="text-2xl font-bold">{fmt(myTotal)}</p>
              </div>
              <div className="expense-gradient rounded-2xl p-4 text-white">
                <p className="text-white/70 text-xs mb-1">Pending Debts</p>
                <p className="text-2xl font-bold">{pendingSettlements.length}</p>
                <p className="text-white/60 text-xs mt-1">to settle</p>
              </div>
            </div>

            {/* Member contributions */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="font-semibold mb-3">Member Contributions</h3>
              <div className="space-y-2">
                {members.map((m) => {
                  const paid = expenses.filter((e) => e.paid_by === m.user_id).reduce((s, e) => s + e.amount, 0);
                  const share = members.length > 0 ? totalSpent / members.length : 0;
                  const net = paid - share;
                  return (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                          {m.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{m.display_name}</span>
                            {m.role === 'admin' && <Crown className="w-3 h-3 text-amber-500" />}
                            {m.user_id === userId && <span className="text-xs text-slate-400">(you)</span>}
                          </div>
                          <span className="text-xs text-slate-500">Paid {fmt(paid)}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {net >= 0 ? '+' : ''}{fmt(net)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick settlement preview */}
            {pendingSettlements.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Pending Settlements</h3>
                  <button onClick={() => setTab('settlements')} className="text-xs text-indigo-600 font-medium">View All</button>
                </div>
                <div className="space-y-2">
                  {pendingSettlements.slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
                      <p className="text-sm">
                        <span className="font-medium text-red-600">{s.from_user_name}</span>
                        <span className="text-slate-500"> owes </span>
                        <span className="font-medium text-emerald-600">{s.to_user_name}</span>
                      </p>
                      <span className="font-bold text-slate-800">{fmt(s.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Danger zone */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 space-y-2">
              <p className="text-sm font-semibold text-red-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</p>
              <div className="flex gap-2">
                <button onClick={() => setShowLeaveGroup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Leave Group
                </button>
                {group.created_by === userId && (
                  <button onClick={() => setShowDeleteGroup(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Group
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── EXPENSES ── */}
        {tab === 'expenses' && (
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No expenses yet.</p>
                <button onClick={() => setShowAddExpense(true)} className="mt-3 text-indigo-600 text-sm font-medium hover:underline">
                  Add the first expense
                </button>
              </div>
            ) : (
              expenses.map((exp) => (
                <div key={exp.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-xl">
                      {CATEGORY_EMOJIS[exp.category] || '💸'}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{exp.title}</p>
                      <p className="text-xs text-slate-500">{exp.paid_by_name} · {new Date(exp.date).toLocaleDateString()}</p>
                      {exp.notes && <p className="text-xs text-slate-400">{exp.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{fmt(exp.amount)}</p>
                      <p className="text-xs text-slate-400">{fmt(exp.amount / members.length)} each</p>
                    </div>
                    {(exp.paid_by === userId || myRole === 'admin') && (
                      <button onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SETTLEMENTS ── */}
        {tab === 'settlements' && (
          <div className="space-y-4">
            {pendingSettlements.length === 0 && settledSettlements.length === 0 ? (
              <div className="text-center py-12">
                <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No settlements yet. Add some expenses first.</p>
              </div>
            ) : (
              <>
                {pendingSettlements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      Pending
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingSettlements.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {pendingSettlements.map((s) => (
                        <div key={s.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-red-600">{s.from_user_name}</span>
                                <span className="text-slate-400 text-sm">owes</span>
                                <span className="font-semibold text-emerald-600">{s.to_user_name}</span>
                              </div>
                              <p className="text-lg font-bold text-slate-800 mt-1">{fmt(s.amount)}</p>
                            </div>
                            {myRole === 'admin' ? (
                              <button
                                onClick={() => handleMarkSettled(s.id)}
                                disabled={actionLoading}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center gap-1.5"
                              >
                                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                Settle
                              </button>
                            ) : (
                              <div className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-xs font-medium cursor-not-allowed" title="Only admins can mark settlements">
                                Admin only
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {settledSettlements.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-500 mb-3 text-sm flex items-center gap-2">
                      Settled
                      <span className="bg-emerald-100 text-emerald-600 text-xs px-2 py-0.5 rounded-full">{settledSettlements.length}</span>
                    </h3>
                    <div className="space-y-2">
                      {settledSettlements.map((s) => (
                        <div key={s.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 opacity-70">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap text-sm">
                                <span className="font-medium text-slate-600">{s.from_user_name}</span>
                                <span className="text-slate-400">paid</span>
                                <span className="font-medium text-slate-600">{s.to_user_name}</span>
                              </div>
                              <p className="font-semibold text-slate-600 mt-0.5">{fmt(s.amount)}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-xs font-semibold">
                              <Check className="w-3.5 h-3.5" /> Settled
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!myRole || myRole !== 'admin' && pendingSettlements.length > 0 && (
              <p className="text-center text-xs text-slate-400 bg-slate-50 rounded-xl py-3 px-4">
                Only group admins can mark settlements as paid.
              </p>
            )}
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div className="space-y-3">
            {members.map((m) => {
              const paid = expenses.filter((e) => e.paid_by === m.user_id).reduce((s, e) => s + e.amount, 0);
              const isMe = m.user_id === userId;
              const canManage = myRole === 'admin' && !isMe;

              return (
                <div key={m.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                        {m.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{m.display_name}</p>
                          {m.role === 'admin' && (
                            <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              <Crown className="w-3 h-3" /> Admin
                            </span>
                          )}
                          {isMe && <span className="text-xs text-slate-400">(you)</span>}
                        </div>
                        <p className="text-xs text-slate-500">Paid {fmt(paid)} total</p>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRoleChange(m.user_id, m.role === 'admin' ? 'member' : 'admin')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            m.role === 'admin'
                              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          {m.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.display_name)}
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Invite more */}
            <button
              onClick={copyInviteCode}
              className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite more members — copy link
            </button>
          </div>
        )}
      </main>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-lg">Add Group Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">What was it for? *</label>
                <input type="text" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} required
                  placeholder="e.g. Grocery run, Electricity bill"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Amount ({currency}) *</label>
                <input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required min="0.01" step="0.01"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                {expAmount && members.length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Each person pays: {fmt(parseFloat(expAmount) / members.length)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Category</label>
                <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_EMOJIS[c] || ''} {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Date</label>
                <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={expNotes} onChange={(e) => setExpNotes(e.target.value)} rows={2} placeholder="Any extra details..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
              </div>
              <div className="bg-indigo-50 rounded-xl px-4 py-3 text-xs text-indigo-700">
                <strong>Paid by you</strong> and split equally among all {members.length} members.
              </div>
              <button type="submit" disabled={actionLoading}
                className="w-full py-3.5 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {actionLoading ? 'Adding...' : 'Add Expense'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Leave Group Modal */}
      {showLeaveGroup && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <LogOut className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Leave Group?</h3>
              <p className="text-sm text-slate-500 mt-1">You will lose access to this group&apos;s expenses and settlements.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveGroup(false)} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm hover:bg-slate-200 transition-colors">Cancel</button>
              <button onClick={handleLeaveGroup} disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Modal */}
      {showDeleteGroup && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-red-500 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold">Delete Group</h3>
                    <p className="text-red-100 text-xs">This cannot be undone</p>
                  </div>
                </div>
                <button onClick={() => { setShowDeleteGroup(false); setDeleteGroupText(''); }}
                  className="p-1.5 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">All expenses, settlements and members will be permanently deleted.</p>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Type <span className="font-bold text-red-600">{group.name}</span> to confirm
                </label>
                <input type="text" value={deleteGroupText} onChange={(e) => setDeleteGroupText(e.target.value)}
                  placeholder={group.name}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-red-400 text-sm" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteGroup(false); setDeleteGroupText(''); }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm">Cancel</button>
                <button onClick={handleDeleteGroup} disabled={deleteGroupText !== group.name || actionLoading}
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg z-50 text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
