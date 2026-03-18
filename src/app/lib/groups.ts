import { createClient } from './supabase';

export interface Group {
  id: string;
  name: string;
  description: string;
  currency: string;
  created_by: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  display_name: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface GroupExpense {
  id: string;
  group_id: string;
  paid_by: string;
  paid_by_name: string;
  title: string;
  amount: number;
  category: string;
  split_type: 'equal' | 'exact' | 'percentage';
  participants: string[];
  split_details: SplitDetail[];
  date: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface SplitDetail {
  user_id: string;
  user_name: string;
  amount: number;
}

export interface GroupSettlementRound {
  id: string;
  group_id: string;
  round_number: number;
  date_from: string;
  date_to: string;
  expires_at: string | null;
  created_by: string;
  created_by_name: string;
  status: 'active' | 'completed' | 'expired' | 'deleted';
  total_amount: number;
  member_count: number;
  created_at: string;
}

export interface GroupSettlement {
  id: string;
  group_id: string;
  round_id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number;
  settled: boolean;
  settled_by: string | null;
  settled_at: string | null;
  created_at: string;
}

export interface GroupPayment {
  id: string;
  group_id: string;
  settlement_id: string;
  round_id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  amount: number;
  settled_by: string;
  settled_at: string;
}

export interface SettlementDebt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Groups ──────────────────────────────────────────

export async function createGroup(
  name: string,
  description: string,
  currency: string,
  userId: string,
  displayName: string
): Promise<Group | null> {
  const supabase = createClient();
  const invite_code = generateInviteCode();
  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, description, currency, created_by: userId, invite_code })
    .select().single();
  if (error || !group) { console.error('createGroup:', error); return null; }
  await supabase.from('group_members').insert({
    group_id: group.id, user_id: userId, display_name: displayName, role: 'admin',
  });
  return group;
}

export async function getMyGroups(userId: string): Promise<Group[]> {
  const supabase = createClient();
  const { data: memberRows, error: memberError } = await supabase
    .from('group_members').select('group_id').eq('user_id', userId);
  if (memberError || !memberRows || memberRows.length === 0) return [];
  const groupIds = memberRows.map((r) => r.group_id);
  const { data, error } = await supabase
    .from('groups').select('*').in('id', groupIds)
    .eq('is_active', true).order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
  if (error) return null;
  return data;
}

export async function getGroupByInviteCode(code: string): Promise<Group | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('groups').select('*')
    .eq('invite_code', code.toUpperCase().trim())
    .eq('is_active', true).maybeSingle();
  if (error) return null;
  return data;
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) return false;
  return true;
}

// ── Members ──────────────────────────────────────────

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_members').select('*').eq('group_id', groupId)
    .order('joined_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function joinGroup(groupId: string, userId: string, displayName: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('group_members').insert({
    group_id: groupId, user_id: userId, display_name: displayName, role: 'member',
  });
  if (error) return false;
  return true;
}

export async function isAlreadyMember(groupId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('group_members').select('id')
    .eq('group_id', groupId).eq('user_id', userId).maybeSingle();
  return !!data;
}

export async function updateMemberRole(groupId: string, targetUserId: string, role: 'admin' | 'member'): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_members').update({ role })
    .eq('group_id', groupId).eq('user_id', targetUserId);
  if (error) return false;
  return true;
}

export async function removeMember(groupId: string, targetUserId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_members').delete()
    .eq('group_id', groupId).eq('user_id', targetUserId);
  if (error) return false;
  return true;
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const members = await getGroupMembers(groupId);
  const admins = members.filter((m) => m.role === 'admin');
  const isAdmin = admins.some((m) => m.user_id === userId);
  if (isAdmin && admins.length === 1 && members.length > 1) {
    const nextMember = members.find((m) => m.user_id !== userId);
    if (nextMember) await updateMemberRole(groupId, nextMember.user_id, 'admin');
  }
  const { error } = await supabase
    .from('group_members').delete()
    .eq('group_id', groupId).eq('user_id', userId);
  if (error) return false;
  const remaining = members.filter((m) => m.user_id !== userId);
  if (remaining.length === 0) await deleteGroup(groupId);
  return true;
}

export async function syncUserNameInGroups(userId: string, newName: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('group_members').update({ display_name: newName }).eq('user_id', userId);
  await supabase.from('group_expenses').update({ paid_by_name: newName }).eq('paid_by', userId);
  await supabase.from('group_settlements').update({ from_user_name: newName }).eq('from_user_id', userId);
  await supabase.from('group_settlements').update({ to_user_name: newName }).eq('to_user_id', userId);
}

// ── Expenses ──────────────────────────────────────────

export async function getGroupExpenses(groupId: string): Promise<GroupExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_expenses').select('*').eq('group_id', groupId)
    .order('date', { ascending: false });
  if (error) return [];
  return (data || []).map((e) => ({
    ...e,
    participants: e.participants || [],
    split_details: e.split_details || [],
    status: e.status || 'approved',
    rejection_reason: e.rejection_reason || null,
  }));
}

export async function addGroupExpense(
  expense: Omit<GroupExpense, 'id' | 'created_at'>,
  isAdmin: boolean
): Promise<GroupExpense | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_expenses')
    .insert({
      group_id: expense.group_id,
      paid_by: expense.paid_by,
      paid_by_name: expense.paid_by_name,
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      split_type: expense.split_type,
      participants: expense.participants,
      split_details: expense.split_details,
      date: expense.date,
      notes: expense.notes,
      // Admins auto-approve their own expenses, members need approval
      status: isAdmin ? 'approved' : 'pending',
    })
    .select().single();
  if (error) { console.error('addGroupExpense:', error); return null; }
  return data;
}

export async function approveExpense(expenseId: string, adminUserId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_expenses')
    .update({
      status: 'approved',
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', expenseId);
  if (error) { console.error('approveExpense:', error); return false; }
  return true;
}

export async function rejectExpense(
  expenseId: string,
  adminUserId: string,
  reason: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_expenses')
    .update({
      status: 'rejected',
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || 'Rejected by admin',
    })
    .eq('id', expenseId);
  if (error) { console.error('rejectExpense:', error); return false; }
  return true;
}

export async function deleteGroupExpense(expenseId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('group_expenses').delete().eq('id', expenseId);
  if (error) return false;
  return true;
}

// ── Balance Calculation ──────────────────────────────────────────

// Get approved expenses NOT covered by any completed settlement round
// Uses created_at timestamp comparison (not just date) so expenses added
// AFTER a settlement was created — even on the same date — are correctly included
export function getUnsettledExpenses(
  expenses: GroupExpense[],
  completedRounds: GroupSettlementRound[]
): GroupExpense[] {
  // Filter to approved only
  const approved = expenses.filter((e) => e.status === 'approved');

  // If no completed rounds, ALL approved expenses are unsettled
  if (completedRounds.length === 0) return approved;

  return approved.filter((expense) => {
    // Check if this expense is covered by any completed round
    const isCovered = completedRounds.some((round) => {
      if (round.status !== 'completed') return false;

      const expenseCreatedAt = new Date(expense.created_at).getTime();
      const roundCreatedAt = new Date(round.created_at).getTime();
      const expDate = expense.date;

      return (
        expenseCreatedAt < roundCreatedAt &&
        expDate >= round.date_from &&
        expDate <= round.date_to
      );
    });

    return !isCovered;
  });
}

export function calculateNetBalances(
  expenses: GroupExpense[],
  members: GroupMember[]
): Record<string, { name: string; balance: number }> {
  if (members.length === 0) return {};

  const balances: Record<string, { name: string; balance: number }> = {};
  members.forEach((m) => {
    balances[m.user_id] = { name: m.display_name, balance: 0 };
  });

  // Trust the caller to pass correct expenses — don't re-filter here
  expenses.forEach((expense) => {
    const paidBy = expense.paid_by;
    const amount = expense.amount;

    const participantIds =
      expense.participants?.length > 0
        ? expense.participants.filter((uid) => balances[uid])
        : members.map((m) => m.user_id);

    if (participantIds.length === 0) return;

    if (expense.split_type === 'equal') {
      const sharePerPerson = Math.round((amount / participantIds.length) * 100) / 100;
      participantIds.forEach((uid) => {
        if (balances[uid]) balances[uid].balance -= sharePerPerson;
      });
    } else if (expense.split_type === 'exact') {
      expense.split_details.forEach((detail) => {
        if (balances[detail.user_id]) balances[detail.user_id].balance -= detail.amount;
      });
    } else if (expense.split_type === 'percentage') {
      expense.split_details.forEach((detail) => {
        if (balances[detail.user_id]) {
          const owedAmount = Math.round((amount * detail.amount / 100) * 100) / 100;
          balances[detail.user_id].balance -= owedAmount;
        }
      });
    }

    if (balances[paidBy]) balances[paidBy].balance += amount;
  });

  Object.keys(balances).forEach((uid) => {
    balances[uid].balance = Math.round(balances[uid].balance * 100) / 100;
  });

  return balances;
}

export function calculateSettlementsFromBalances(
  balances: Record<string, { name: string; balance: number }>
): SettlementDebt[] {
  const creditors: { id: string; name: string; amount: number }[] = [];
  const debtors: { id: string; name: string; amount: number }[] = [];

  Object.entries(balances).forEach(([uid, { name, balance }]) => {
    if (balance > 0.01) creditors.push({ id: uid, name, amount: balance });
    else if (balance < -0.01) debtors.push({ id: uid, name, amount: -balance });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: SettlementDebt[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const amount = Math.round(Math.min(creditor.amount, debtor.amount) * 100) / 100;
    if (amount > 0.01) {
      settlements.push({
        fromUserId: debtor.id,
        fromUserName: debtor.name,
        toUserId: creditor.id,
        toUserName: creditor.name,
        amount,
      });
    }
    creditor.amount = Math.round((creditor.amount - amount) * 100) / 100;
    debtor.amount = Math.round((debtor.amount - amount) * 100) / 100;
    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return settlements;
}

// ── Settlement Rounds ──────────────────────────────────────────

export async function getSettlementRounds(groupId: string): Promise<GroupSettlementRound[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_settlement_rounds').select('*').eq('group_id', groupId)
    .order('round_number', { ascending: false });
  if (error) return [];
  return data || [];
}

export async function getActiveRound(groupId: string): Promise<GroupSettlementRound | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('group_settlement_rounds').select('*')
    .eq('group_id', groupId).eq('status', 'active').maybeSingle();
  return data;
}

export async function createSettlementRound(
  groupId: string,
  dateFrom: string,
  dateTo: string,
  expiresAt: string | null,
  createdBy: string,
  createdByName: string,
  expenses: GroupExpense[],
  members: GroupMember[]
): Promise<GroupSettlementRound | null> {
  const supabase = createClient();

  const { data: existing } = await supabase
    .from('group_settlement_rounds').select('round_number').eq('group_id', groupId)
    .order('round_number', { ascending: false }).limit(1).maybeSingle();
  const roundNumber = (existing?.round_number || 0) + 1;

  // Only approved expenses in date range
  const rangeExpenses = expenses.filter(
    (e) => e.status === 'approved' && e.date >= dateFrom && e.date <= dateTo
  );
  const totalAmount = rangeExpenses.reduce((s, e) => s + e.amount, 0);

  const { data: round, error: roundError } = await supabase
    .from('group_settlement_rounds')
    .insert({
      group_id: groupId,
      round_number: roundNumber,
      date_from: dateFrom,
      date_to: dateTo,
      expires_at: expiresAt,
      created_by: createdBy,
      created_by_name: createdByName,
      status: 'active',
      total_amount: totalAmount,
      member_count: members.length,
    })
    .select().single();

  if (roundError || !round) { console.error('createSettlementRound:', roundError); return null; }

  const balances = calculateNetBalances(rangeExpenses, members);
  const debts = calculateSettlementsFromBalances(balances);

  if (debts.length > 0) {
    await supabase.from('group_settlements').insert(
      debts.map((d) => ({
        group_id: groupId,
        round_id: round.id,
        from_user_id: d.fromUserId,
        from_user_name: d.fromUserName,
        to_user_id: d.toUserId,
        to_user_name: d.toUserName,
        amount: d.amount,
        settled: false,
      }))
    );
  }

  return round;
}

export async function deleteSettlementRound(roundId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('group_settlement_rounds').delete().eq('id', roundId);
  if (error) return false;
  return true;
}

export async function checkAndExpireRound(round: GroupSettlementRound): Promise<boolean> {
  if (!round.expires_at || round.status !== 'active') return false;
  if (new Date(round.expires_at) > new Date()) return false;
  const supabase = createClient();
  await supabase.from('group_settlement_rounds')
    .update({ status: 'expired' }).eq('id', round.id);
  return true;
}

export async function getSettlementsForRound(roundId: string): Promise<GroupSettlement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_settlements').select('*').eq('round_id', roundId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data || [];
}

export async function markSettled(
  settlementId: string,
  adminUserId: string,
  roundId: string,
  groupId: string,
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  amount: number
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_settlements')
    .update({ settled: true, settled_by: adminUserId, settled_at: new Date().toISOString() })
    .eq('id', settlementId);
  if (error) return false;

  await supabase.from('group_payments').insert({
    group_id: groupId,
    settlement_id: settlementId,
    round_id: roundId,
    from_user_id: fromUserId,
    from_user_name: fromUserName,
    to_user_id: toUserId,
    to_user_name: toUserName,
    amount,
    settled_by: adminUserId,
    settled_at: new Date().toISOString(),
  });

  const { data: remaining } = await supabase
    .from('group_settlements')
    .select('id').eq('round_id', roundId).eq('settled', false);

  if (!remaining || remaining.length === 0) {
    await supabase.from('group_settlement_rounds')
      .update({ status: 'completed' }).eq('id', roundId);
  }

  return true;
}

export async function getPaymentHistory(groupId: string): Promise<GroupPayment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_payments').select('*').eq('group_id', groupId)
    .order('settled_at', { ascending: false });
  if (error) return [];
  return data || [];
}
