'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Plus, Users, Receipt, Calculator, Loader2,
  Copy, Check, Crown, Trash2, LogOut, UserPlus, X,
  AlertTriangle, ChevronRight, Clock, Calendar, CheckCircle2,
  History, PlayCircle, Info,
} from 'lucide-react';
import { getSession } from '../../lib/auth';
import {
  getGroup, getGroupMembers, getGroupExpenses,
  getSettlementRounds, getActiveRound, getSettlementsForRound,
  getPaymentHistory, createSettlementRound, deleteSettlementRound,
  markSettled, checkAndExpireRound, addGroupExpense, deleteGroupExpense,
  updateMemberRole, removeMember, leaveGroup, deleteGroup,
  calculateNetBalances,
  Group, GroupMember, GroupExpense, GroupSettlementRound, GroupSettlement, GroupPayment,
} from '../../lib/groups';
import { CATEGORY_EMOJIS } from '../../lib/constants';

const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Utilities',
  'Shopping', 'Health', 'Entertainment', 'Education', 'Miscellaneous',
];

const EXPIRY_OPTIONS = [
  { label: '24 Hours', value: 24 },
  { label: '3 Days', value: 72 },
  { label: '7 Days', value: 168 },
  { label: 'No Expiry', value: 0 },
];

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
  const [rounds, setRounds] = useState<GroupSettlementRound[]>([]);
  const [activeRound, setActiveRound] = useState<GroupSettlementRound | null>(null);
  const [activeSettlements, setActiveSettlements] = useState<GroupSettlement[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<GroupPayment[]>([]);
  const [myRole, setMyRole] = useState<'admin' | 'member'>('member');
  const [tab, setTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Add expense modal
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Food');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expNotes, setExpNotes] = useState('');
  const [expSplitType, setExpSplitType] = useState<'equal' | 'exact' | 'percentage'>('equal');
  const [expParticipants, setExpParticipants] = useState<string[]>([]);
  const [expSplitDetails, setExpSplitDetails] = useState<{ user_id: string; user_name: string; amount: string }[]>([]);

  // Create settlement modal
  const [showCreateSettlement, setShowCreateSettlement] = useState(false);
  const [settleDateFrom, setSettleDateFrom] = useState('');
  const [settleDateTo, setSettleDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [settleExpiry, setSettleExpiry] = useState(24);

  // Delete/leave modals
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [showLeaveGroup, setShowLeaveGroup] = useState(false);
  const [deleteGroupText, setDeleteGroupText] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = async (uid: string) => {
    const [g, m, e, r, ph] = await Promise.all([
      getGroup(groupId),
      getGroupMembers(groupId),
      getGroupExpenses(groupId),
      getSettlementRounds(groupId),
      getPaymentHistory(groupId),
    ]);

    if (!g) { router.replace('/groups'); return; }

    setGroup(g);
    setMembers(m);
    setExpenses(e);
    setRounds(r);
    setPaymentHistory(ph);

    const me = m.find((mem) => mem.user_id === uid);
    if (me) setMyRole(me.role);

    // Set default date_from for settlement (day after last round OR group creation)
    const lastRound = r.find((round) => round.status === 'completed');
    if (lastRound) {
      const nextDay = new Date(lastRound.date_to);
      nextDay.setDate(nextDay.getDate() + 1);
      setSettleDateFrom(nextDay.toISOString().split('T')[0]);
    } else {
      setSettleDateFrom(g.created_at.split('T')[0]);
    }

    // Load active round and its settlements
    const active = await getActiveRound(groupId);
    if (active) {
      // Check if expired
      const isExpired = await checkAndExpireRound(active);
      if (isExpired) {
        active.status = 'expired';
      }
      setActiveRound(active.status === 'active' ? active : null);
      if (active.status !== 'active') {
        setRounds(await getSettlementRounds(groupId));
      }
      const settlements = await getSettlementsForRound(active.id);
      setActiveSettlements(settlements);
    }

    // Initialize participants to all members for add expense form
    setExpParticipants(m.map((mem) => mem.user_id));

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

  // Update split details when participants or split type changes
  useEffect(() => {
    if (expSplitType !== 'equal') {
      const activeParticipants = members.filter((m) => expParticipants.includes(m.user_id));
      setExpSplitDetails(
        activeParticipants.map((m) => ({
          user_id: m.user_id,
          user_name: m.display_name,
          amount: expSplitType === 'percentage'
            ? String(Math.round(100 / activeParticipants.length))
            : '',
        }))
      );
    }
  }, [expSplitType, expParticipants, members]);

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

    // Validate split details
    if (expSplitType === 'exact') {
      const total = expSplitDetails.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
      if (Math.abs(total - parseFloat(expAmount)) > 0.01) {
        showToast(`Split amounts must add up to ${fmt(parseFloat(expAmount))}`);
        return;
      }
    }
    if (expSplitType === 'percentage') {
      const total = expSplitDetails.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        showToast('Percentages must add up to 100%');
        return;
      }
    }

    setActionLoading(true);
    const expense = await addGroupExpense({
      group_id: groupId,
      paid_by: userId,
      paid_by_name: userName,
      title: expTitle.trim(),
      amount: parseFloat(expAmount),
      category: expCategory,
      split_type: expSplitType,
      participants: expParticipants.length === members.length ? [] : expParticipants,
      split_details: expSplitType !== 'equal'
        ? expSplitDetails.map((d) => ({
            user_id: d.user_id,
            user_name: d.user_name,
            amount: parseFloat(d.amount) || 0,
          }))
        : [],
      date: expDate,
      notes: expNotes,
    });

    if (expense) {
      setExpenses((prev) => [expense, ...prev]);
      setShowAddExpense(false);
      setExpTitle(''); setExpAmount(''); setExpNotes('');
      setExpSplitType('equal');
      setExpParticipants(members.map((m) => m.user_id));
      showToast('Expense added!');
    } else {
      showToast('Failed to add expense.');
    }
    setActionLoading(false);
  };

  const handleDeleteExpense = async (expId: string) => {
    await deleteGroupExpense(expId);
    setExpenses((prev) => prev.filter((e) => e.id !== expId));
    showToast('Expense deleted.');
  };

  const handleCreateSettlement = async () => {
    if (activeRound) {
      showToast('There is already an active settlement. Settle or delete it first.');
      return;
    }

    setActionLoading(true);
    const expiresAt = settleExpiry > 0
      ? new Date(Date.now() + settleExpiry * 60 * 60 * 1000).toISOString()
      : null;

    const round = await createSettlementRound(
      groupId, settleDateFrom, settleDateTo, expiresAt,
      userId, userName, expenses, members
    );

    if (round) {
      setActiveRound(round);
      const settlements = await getSettlementsForRound(round.id);
      setActiveSettlements(settlements);
      setRounds(await getSettlementRounds(groupId));
      setShowCreateSettlement(false);
      showToast(`Settlement Round #${round.round_number} created!`);
    } else {
      showToast('Failed to create settlement.');
    }
    setActionLoading(false);
  };

  const handleMarkSettled = async (settlement: GroupSettlement) => {
    if (myRole !== 'admin') { showToast('Only admins can mark settlements.'); return; }
    setActionLoading(true);

    const ok = await markSettled(
      settlement.id, userId, settlement.round_id,
      groupId, settlement.from_user_id, settlement.from_user_name,
      settlement.to_user_id, settlement.to_user_name, settlement.amount
    );

    if (ok) {
      setActiveSettlements((prev) =>
        prev.map((s) => s.id === settlement.id
          ? { ...s, settled: true, settled_by: userId, settled_at: new Date().toISOString() }
          : s
        )
      );
      // Check if all settled → complete round
      const remaining = activeSettlements.filter((s) => s.id !== settlement.id && !s.settled);
      if (remaining.length === 0) {
        setActiveRound(null);
        setRounds(await getSettlementRounds(groupId));
        setPaymentHistory(await getPaymentHistory(groupId));
        showToast('All debts settled! Round completed 🎉');
      } else {
        showToast('Marked as settled!');
      }
    }
    setActionLoading(false);
  };

  const handleDeleteRound = async (roundId: string) => {
    setActionLoading(true);
    const ok = await deleteSettlementRound(roundId);
    if (ok) {
      setActiveRound(null);
      setActiveSettlements([]);
      setRounds(await getSettlementRounds(groupId));
      showToast('Settlement round deleted.');
    }
    setActionLoading(false);
  };

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'member') => {
    if (targetUserId === userId) { showToast("You can't change your own role."); return; }
    await updateMemberRole(groupId, targetUserId, newRole);
    setMembers((prev) => prev.map((m) => m.user_id === targetUserId ? { ...m, role: newRole } : m));
    showToast(newRole === 'admin' ? 'Promoted to admin!' : 'Demoted to member.');
  };

  const handleRemoveMember = async (targetUserId: string, name: string) => {
    await removeMember(groupId, targetUserId);
    setMembers((prev) => prev.filter((m) => m.user_id !== targetUserId));
    showToast(`${name} removed.`);
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

  // Derived
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const myExpensesTotal = expenses.filter((e) => e.paid_by === userId).reduce((s, e) => s + e.amount, 0);
  const currency = group?.currency || '₨';
  const fmt = (n: number) => currency + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const netBalances = calculateNetBalances(expenses, members);
  const myBalance = netBalances[userId]?.balance || 0;

  const pendingSettlements = activeSettlements.filter((s) => !s.settled);
  const settledInRound = activeSettlements.filter((s) => s.settled);

  // Time remaining for active round
  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }
  if (!group) return null;

  const tabs: { key: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <Calculator className="w-4 h-4" /> },
    { key: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" />, badge: expenses.length },
    { key: 'settlements', label: 'Settlements', icon: <ChevronRight className="w-4 h-4" />, badge: pendingSettlements.length || undefined },
    { key: 'members', label: 'Members', icon: <Users className="w-4 h-4" />, badge: members.length },
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
            <button onClick={copyInviteCode}
              className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : `${group.invite_code}`}
            </button>
            <button onClick={() => setShowAddExpense(true)}
              className="gradient-card text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:shadow-md transition-all">
              <Plus className="w-3.5 h-3.5" /> Add Expense
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-slate-200 px-4 overflow-x-auto shrink-0">
        <div className="flex min-w-max">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                tab === t.key ? 'tab-active' : 'text-slate-600 hover:text-indigo-600'
              }`}>
              {t.icon}{t.label}
              {t.badge !== undefined && t.badge > 0 && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  t.key === 'settlements' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                }`}>{t.badge}</span>
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
              <div className="gradient-card rounded-2xl p-4 text-white col-span-2">
                <p className="text-white/70 text-xs mb-1">Total Group Spend</p>
                <p className="text-3xl font-bold">{fmt(totalSpent)}</p>
                <p className="text-white/60 text-xs mt-1">{expenses.length} expenses · {members.length} members</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs mb-1">You paid</p>
                <p className="text-2xl font-bold text-slate-800">{fmt(myExpensesTotal)}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <p className="text-slate-500 text-xs mb-1">Your net balance</p>
                <p className={`text-2xl font-bold ${myBalance > 0 ? 'text-emerald-600' : myBalance < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                  {myBalance > 0 ? '+' : ''}{fmt(myBalance)}
                </p>
                <p className="text-xs text-slate-400">
                  {myBalance > 0 ? 'you are owed' : myBalance < 0 ? 'you owe' : 'all even'}
                </p>
              </div>
            </div>

            {/* Member balances */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h3 className="font-semibold mb-3">Member Balances</h3>
              <div className="space-y-2">
                {members.map((m) => {
                  const bal = netBalances[m.user_id]?.balance || 0;
                  const isMe = m.user_id === userId;
                  return (
                    <div key={m.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${isMe ? 'bg-indigo-50 border border-indigo-100' : 'bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                          {m.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{m.display_name}</span>
                            {m.role === 'admin' && <Crown className="w-3 h-3 text-amber-500" />}
                            {isMe && <span className="text-xs text-slate-400">(you)</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${bal > 0 ? 'text-emerald-600' : bal < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {bal > 0 ? `+${fmt(bal)}` : bal < 0 ? `-${fmt(Math.abs(bal))}` : '✓ Even'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {bal > 0 ? 'owed' : bal < 0 ? 'owes' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active settlement status */}
            {activeRound && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">
                      Active Settlement Round #{activeRound.round_number}
                    </p>
                  </div>
                  <button onClick={() => setTab('settlements')} className="text-xs text-amber-700 font-medium hover:underline">
                    View →
                  </button>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  {pendingSettlements.length} debt{pendingSettlements.length !== 1 ? 's' : ''} pending
                  {activeRound.expires_at && ` · ${getTimeRemaining(activeRound.expires_at)}`}
                </p>
              </div>
            )}

            {/* Danger zone */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 space-y-2">
              <p className="text-sm font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Danger Zone
              </p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setShowLeaveGroup(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-100">
                  <LogOut className="w-3.5 h-3.5" /> Leave Group
                </button>
                {group.created_by === userId && (
                  <button onClick={() => setShowDeleteGroup(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-medium hover:bg-red-100">
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
              expenses.map((exp) => {
                const participantCount = exp.participants?.length > 0
                  ? exp.participants.length
                  : members.length;
                return (
                  <div key={exp.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-xl shrink-0">
                          {CATEGORY_EMOJIS[exp.category] || '💸'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{exp.title}</p>
                          <p className="text-xs text-slate-500">
                            Paid by <span className="font-medium">{exp.paid_by === userId ? 'you' : exp.paid_by_name}</span>
                            {' · '}{new Date(exp.date).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {exp.split_type === 'equal' ? `÷ ${participantCount}` : exp.split_type}
                            </span>
                            {exp.participants?.length > 0 && exp.participants.length < members.length && (
                              <span className="text-xs text-indigo-600">
                                {exp.participants.length} of {members.length} members
                              </span>
                            )}
                          </div>
                          {exp.notes && <p className="text-xs text-slate-400 mt-1">{exp.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-slate-800">{fmt(exp.amount)}</p>
                          <p className="text-xs text-slate-400">
                            {fmt(exp.amount / participantCount)} each
                          </p>
                        </div>
                        {(exp.paid_by === userId || myRole === 'admin') && (
                          <button onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── SETTLEMENTS ── */}
        {tab === 'settlements' && (
          <div className="space-y-4">
            {/* Info box */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Settlements are created manually by admins as <strong>snapshots</strong> of a date range.
                  Once created, new expenses won&apos;t affect the current round — they&apos;ll be included in the next one.
                  {myRole !== 'admin' && ' Only admins can create and settle rounds.'}
                </p>
              </div>
            </div>

            {/* Active round */}
            {activeRound ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Round header */}
                <div className="gradient-card px-4 py-3 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold">Round #{activeRound.round_number} — Active</p>
                      <p className="text-white/80 text-xs">
                        {new Date(activeRound.date_from).toLocaleDateString()} → {new Date(activeRound.date_to).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{fmt(activeRound.total_amount)}</p>
                      {activeRound.expires_at && (
                        <p className="text-white/70 text-xs flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(activeRound.expires_at)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  {/* Progress */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{settledInRound.length} of {activeSettlements.length} debts settled</span>
                    <span>{pendingSettlements.length} remaining</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: activeSettlements.length > 0 ? `${(settledInRound.length / activeSettlements.length) * 100}%` : '0%' }}
                    />
                  </div>

                  {/* Pending debts */}
                  {pendingSettlements.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
                      {pendingSettlements.map((s) => {
                        const isFromMe = s.from_user_id === userId;
                        const isToMe = s.to_user_id === userId;
                        return (
                          <div key={s.id} className={`rounded-xl p-3 border ${isFromMe ? 'bg-red-50 border-red-200' : isToMe ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-sm font-semibold ${isFromMe ? 'text-red-700' : 'text-slate-700'}`}>
                                    {isFromMe ? 'You' : s.from_user_name}
                                  </span>
                                  <span className="text-slate-400 text-xs">→</span>
                                  <span className={`text-sm font-semibold ${isToMe ? 'text-emerald-700' : 'text-slate-700'}`}>
                                    {isToMe ? 'You' : s.to_user_name}
                                  </span>
                                </div>
                                <p className="text-lg font-bold text-slate-800">{fmt(s.amount)}</p>
                                {isFromMe && <p className="text-xs text-red-600">You need to pay this</p>}
                                {isToMe && <p className="text-xs text-emerald-600">You will receive this</p>}
                              </div>
                              {myRole === 'admin' ? (
                                <button
                                  onClick={() => handleMarkSettled(s)}
                                  disabled={actionLoading}
                                  className="shrink-0 px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center gap-1"
                                >
                                  {actionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  Settle
                                </button>
                              ) : (
                                <span className="shrink-0 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">Admin only</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Settled debts in this round */}
                  {settledInRound.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settled in this round</p>
                      {settledInRound.map((s) => (
                        <div key={s.id} className="bg-slate-50 rounded-xl px-3 py-2 flex items-center justify-between opacity-70">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-slate-600">{s.from_user_id === userId ? 'You' : s.from_user_name}</span>
                            <span className="text-slate-400 text-xs">paid</span>
                            <span className="font-medium text-slate-600">{s.to_user_id === userId ? 'you' : s.to_user_name}</span>
                            <span className="font-semibold">{fmt(s.amount)}</span>
                          </div>
                          <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                            <Check className="w-3 h-3" /> Paid
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin: delete round */}
                  {myRole === 'admin' && (
                    <button
                      onClick={() => handleDeleteRound(activeRound.id)}
                      disabled={actionLoading}
                      className="w-full text-xs text-red-500 hover:text-red-700 py-2 border border-red-100 hover:border-red-200 rounded-xl transition-colors"
                    >
                      Delete this round
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* No active round */
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
                  <PlayCircle className="w-7 h-7 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">No active settlement</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {myRole === 'admin'
                      ? 'Create a settlement round to calculate who owes who based on expenses.'
                      : 'Waiting for an admin to create a settlement round.'}
                  </p>
                </div>
                {myRole === 'admin' && expenses.length > 0 && (
                  <button
                    onClick={() => setShowCreateSettlement(true)}
                    className="inline-flex items-center gap-2 gradient-card text-white px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all"
                  >
                    <Calculator className="w-4 h-4" />
                    Create Settlement Round
                  </button>
                )}
                {expenses.length === 0 && (
                  <p className="text-xs text-slate-400">Add some expenses first before creating a settlement.</p>
                )}
              </div>
            )}

            {/* Past rounds history */}
            {rounds.filter((r) => r.status !== 'active').length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-3">
                  <History className="w-4 h-4" /> Past Rounds
                </p>
                <div className="space-y-2">
                  {rounds.filter((r) => r.status !== 'active').map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl px-4 py-3 border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">Round #{r.round_number}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              r.status === 'expired' ? 'bg-red-100 text-red-600' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {r.status === 'completed' ? '✓ Completed' : r.status === 'expired' ? '⚠ Expired' : r.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(r.date_from).toLocaleDateString()} → {new Date(r.date_to).toLocaleDateString()}
                            {' · '}{fmt(r.total_amount)}
                          </p>
                          <p className="text-xs text-slate-400">Created by {r.created_by_name}</p>
                        </div>
                        {r.status === 'expired' && myRole === 'admin' && (
                          <button
                            onClick={() => handleDeleteRound(r.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-100 rounded-lg"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment history */}
            {paymentHistory.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4" /> Payment History
                </p>
                <div className="space-y-2">
                  {paymentHistory.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl px-4 py-3 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{p.from_user_id === userId ? 'You' : p.from_user_name}</span>
                        <span className="text-slate-400 text-xs">paid</span>
                        <span className="font-medium">{p.to_user_id === userId ? 'you' : p.to_user_name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">{fmt(p.amount)}</p>
                        <p className="text-xs text-slate-400">{new Date(p.settled_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MEMBERS ── */}
        {tab === 'members' && (
          <div className="space-y-3">
            {members.map((m) => {
              const bal = netBalances[m.user_id]?.balance || 0;
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
                        <p className={`text-xs font-medium ${bal > 0 ? 'text-emerald-600' : bal < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                          {bal > 0 ? `Owed ${fmt(bal)}` : bal < 0 ? `Owes ${fmt(Math.abs(bal))}` : 'All even'}
                        </p>
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
                          }`}>
                          <Crown className="w-3 h-3" />
                          {m.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.user_id, m.display_name)}
                          className="p-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <button onClick={copyInviteCode}
              className="w-full border-2 border-dashed border-slate-300 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
              <UserPlus className="w-4 h-4" /> Invite more members
            </button>
          </div>
        )}
      </main>

      {/* ── ADD EXPENSE MODAL ── */}
      {showAddExpense && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-semibold text-lg">Add Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">What was it for? *</label>
                <input type="text" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} required
                  placeholder="e.g. Grocery run, Hotel, Petrol"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Amount ({currency}) *</label>
                  <input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} required
                    min="0.01" step="0.01" placeholder="0"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Date</label>
                  <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                </div>
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

              {/* Split type */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">How to split?</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['equal', 'exact', 'percentage'] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setExpSplitType(type)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all capitalize ${
                        expSplitType === type
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}>
                      {type === 'equal' ? '÷ Equal' : type === 'exact' ? '₨ Exact' : '% Percent'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Participants */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  Who participated?
                  <span className="text-slate-400 font-normal ml-1">(uncheck to exclude)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {members.map((m) => (
                    <label key={m.user_id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
                      expParticipants.includes(m.user_id)
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}>
                      <input type="checkbox" checked={expParticipants.includes(m.user_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setExpParticipants((prev) => [...prev, m.user_id]);
                          } else {
                            if (expParticipants.length > 1) {
                              setExpParticipants((prev) => prev.filter((id) => id !== m.user_id));
                            }
                          }
                        }}
                        className="accent-indigo-600" />
                      <span className="text-xs font-medium text-slate-700 truncate">
                        {m.user_id === userId ? 'You' : m.display_name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Exact / Percentage split details */}
              {expSplitType !== 'equal' && expAmount && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">
                    {expSplitType === 'exact' ? 'Amount per person' : 'Percentage per person'}
                  </label>
                  <div className="space-y-2">
                    {expSplitDetails.map((detail, i) => (
                      <div key={detail.user_id} className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 flex-1">
                          {detail.user_id === userId ? 'You' : detail.user_name}
                        </span>
                        <div className="relative w-32">
                          <input
                            type="number"
                            value={detail.amount}
                            onChange={(e) => {
                              const updated = [...expSplitDetails];
                              updated[i].amount = e.target.value;
                              setExpSplitDetails(updated);
                            }}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm pr-7"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                            {expSplitType === 'percentage' ? '%' : currency}
                          </span>
                        </div>
                      </div>
                    ))}
                    {/* Running total */}
                    <div className={`text-xs px-3 py-2 rounded-lg ${
                      expSplitType === 'exact'
                        ? Math.abs(expSplitDetails.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0) - parseFloat(expAmount || '0')) < 0.01
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                        : Math.abs(expSplitDetails.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0) - 100) < 0.01
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                    }`}>
                      Total: {expSplitDetails.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0).toFixed(2)}
                      {expSplitType === 'exact' ? ` / ${expAmount} ${currency}` : '% / 100%'}
                    </div>
                  </div>
                </div>
              )}

              {/* Equal split preview */}
              {expSplitType === 'equal' && expAmount && expParticipants.length > 0 && (
                <div className="bg-indigo-50 rounded-xl px-4 py-3 text-xs text-indigo-700">
                  Split equally: <strong>{fmt(parseFloat(expAmount) / expParticipants.length)}</strong> per person
                  among {expParticipants.length} participant{expParticipants.length !== 1 ? 's' : ''}
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <textarea value={expNotes} onChange={(e) => setExpNotes(e.target.value)} rows={2}
                  placeholder="Any extra details..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" />
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

      {/* ── CREATE SETTLEMENT MODAL ── */}
      {showCreateSettlement && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="gradient-card px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Create Settlement</h3>
                    <p className="text-white/70 text-xs">Round #{(rounds.length) + 1}</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateSettlement(false)} className="p-1.5 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Date range */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Date Range</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">From</label>
                    <input type="date" value={settleDateFrom}
                      onChange={(e) => setSettleDateFrom(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">To</label>
                    <input type="date" value={settleDateTo}
                      onChange={(e) => setSettleDateTo(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
                  </div>
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Settlement Expires In</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setSettleExpiry(opt.value)}
                      className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        settleExpiry === opt.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview</p>
                {(() => {
                  const rangeExpenses = expenses.filter((e) => e.date >= settleDateFrom && e.date <= settleDateTo);
                  const total = rangeExpenses.reduce((s, e) => s + e.amount, 0);
                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Expenses in range</span>
                        <span className="font-semibold">{rangeExpenses.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Total amount</span>
                        <span className="font-semibold">{fmt(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Per person</span>
                        <span className="font-semibold">{members.length > 0 ? fmt(total / members.length) : fmt(0)}</span>
                      </div>
                      {settleExpiry > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Expires</span>
                          <span className="font-semibold text-amber-600">
                            {new Date(Date.now() + settleExpiry * 60 * 60 * 1000).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCreateSettlement(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm">
                  Cancel
                </button>
                <button onClick={handleCreateSettlement} disabled={actionLoading || !settleDateFrom || !settleDateTo}
                  className="flex-1 py-3 rounded-xl font-semibold text-white gradient-card hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  {actionLoading ? 'Creating...' : 'Create Round'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LEAVE GROUP MODAL ── */}
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
              <button onClick={() => setShowLeaveGroup(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm">Cancel</button>
              <button onClick={handleLeaveGroup} disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 disabled:opacity-60 flex items-center justify-center gap-2">
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE GROUP MODAL ── */}
      {showDeleteGroup && (
        <div className="fixed inset-0 modal-overlay z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="bg-red-500 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Delete Group</h3>
                  <p className="text-red-100 text-xs">Cannot be undone</p>
                </div>
              </div>
              <button onClick={() => { setShowDeleteGroup(false); setDeleteGroupText(''); }}
                className="p-1.5 hover:bg-white/20 rounded-lg"><X className="w-4 h-4" /></button>
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
                  className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-40 flex items-center justify-center gap-2">
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

      {/* Create Settlement FAB for admin when no active round */}
      {myRole === 'admin' && !activeRound && expenses.length > 0 && tab !== 'settlements' && (
        <button
          onClick={() => { setTab('settlements'); setShowCreateSettlement(true); }}
          className="fixed bottom-6 right-6 gradient-card text-white px-5 py-3 rounded-2xl shadow-xl font-semibold text-sm flex items-center gap-2 hover:shadow-2xl transition-all z-40"
        >
          <Calculator className="w-4 h-4" />
          Create Settlement
        </button>
      )}
    </div>
  );
}
