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
  split_type: string;
  date: string;
  notes: string;
  created_at: string;
}

export interface GroupSettlement {
  id: string;
  group_id: string;
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
    .select()
    .single();

  if (error || !group) { console.error('createGroup:', error); return null; }

  // Add creator as admin
  await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    display_name: displayName,
    role: 'admin',
  });

  return group;
}

export async function getMyGroups(userId: string): Promise<Group[]> {
  const supabase = createClient();

  // Step 1 — get the group IDs this user belongs to
  const { data: memberRows, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', userId);

  if (memberError || !memberRows || memberRows.length === 0) return [];

  const groupIds = memberRows.map((r) => r.group_id);

  // Step 2 — fetch those groups using a plain array
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) { console.error('getMyGroups:', error); return []; }
  return data || [];
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) { console.error('getGroup:', error); return null; }
  return data;
}

export async function getGroupByInviteCode(code: string): Promise<Group | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', code.toUpperCase().trim())
    .eq('is_active', true)
    .maybeSingle(); // ← was .single() which throws error on 0 rows

  if (error) { console.error('getGroupByInviteCode:', error); return null; }
  return data; // returns null if not found, no error thrown
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  if (error) { console.error('deleteGroup:', error); return false; }
  return true;
}

// ── Members ──────────────────────────────────────────

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_members')
    .select('*')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error) { console.error('getGroupMembers:', error); return []; }
  return data || [];
}

export async function joinGroup(
  groupId: string,
  userId: string,
  displayName: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('group_members').insert({
    group_id: groupId,
    user_id: userId,
    display_name: displayName,
    role: 'member',
  });
  if (error) { console.error('joinGroup:', error); return false; }
  return true;
}

export async function isAlreadyMember(groupId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle(); // ← was .single() which throws error on 0 rows

  return !!data;
}

export async function updateMemberRole(
  groupId: string,
  targetUserId: string,
  role: 'admin' | 'member'
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);
  if (error) { console.error('updateMemberRole:', error); return false; }
  return true;
}

export async function removeMember(groupId: string, targetUserId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', targetUserId);
  if (error) { console.error('removeMember:', error); return false; }
  return true;
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const supabase = createClient();

  const members = await getGroupMembers(groupId);
  const admins = members.filter((m) => m.role === 'admin');
  const isAdmin = admins.some((m) => m.user_id === userId);

  // If leaving user is the only admin, promote the next oldest member
  if (isAdmin && admins.length === 1 && members.length > 1) {
    const nextMember = members.find((m) => m.user_id !== userId);
    if (nextMember) await updateMemberRole(groupId, nextMember.user_id, 'admin');
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) { console.error('leaveGroup:', error); return false; }

  // If no members left, delete the group
  const remaining = members.filter((m) => m.user_id !== userId);
  if (remaining.length === 0) await deleteGroup(groupId);

  return true;
}

// ── Expenses ──────────────────────────────────────────

export async function getGroupExpenses(groupId: string): Promise<GroupExpense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('date', { ascending: false });

  if (error) { console.error('getGroupExpenses:', error); return []; }
  return data || [];
}

export async function addGroupExpense(
  expense: Omit<GroupExpense, 'id' | 'created_at'>
): Promise<GroupExpense | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_expenses')
    .insert(expense)
    .select()
    .single();

  if (error) { console.error('addGroupExpense:', error); return null; }
  return data;
}

export async function deleteGroupExpense(expenseId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('group_expenses').delete().eq('id', expenseId);
  if (error) { console.error('deleteGroupExpense:', error); return false; }
  return true;
}

// ── Settlements ──────────────────────────────────────────

export interface SettlementDebt {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export function calculateSettlements(
  expenses: GroupExpense[],
  members: GroupMember[]
): SettlementDebt[] {
  if (members.length === 0 || expenses.length === 0) return [];

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const fairShare = total / members.length;

  // Step 1 — Calculate net balance for each member
  // Positive = they are owed money (paid more than fair share)
  // Negative = they owe money (paid less than fair share)
  const balances: Record<string, { name: string; balance: number }> = {};

  // Start everyone at -fairShare (they owe their share)
  members.forEach((m) => {
    balances[m.user_id] = { name: m.display_name, balance: -fairShare };
  });

  // Add back what each person actually paid
  expenses.forEach((e) => {
    if (balances[e.paid_by]) {
      balances[e.paid_by].balance += e.amount;
    }
  });

  // Step 2 — Round to 2 decimal places to avoid floating point issues
  // e.g. -0.000000001 should be treated as 0
  Object.keys(balances).forEach((uid) => {
    balances[uid].balance = Math.round(balances[uid].balance * 100) / 100;
  });

  // Step 3 — Separate into creditors and debtors
  // At this point balances are already NETTED per person
  // so there's no case where person A owes B AND B owes A
  const creditors: { id: string; name: string; amount: number }[] = [];
  const debtors: { id: string; name: string; amount: number }[] = [];

  Object.entries(balances).forEach(([uid, { name, balance }]) => {
    if (balance > 0.01) {
      creditors.push({ id: uid, name, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: uid, name, amount: -balance }); // store as positive
    }
    // balance ~0 means they paid exactly their fair share, skip
  });

  // Sort largest first for optimal matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Step 4 — Greedy minimize transactions algorithm
  // Match largest debtor with largest creditor each iteration
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

export async function getGroupSettlements(groupId: string): Promise<GroupSettlement[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('group_settlements')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) { console.error('getGroupSettlements:', error); return []; }
  return data || [];
}

export async function saveSettlements(
  groupId: string,
  settlements: SettlementDebt[]
): Promise<boolean> {
  const supabase = createClient();

  // Delete ALL unsettled settlements for this group before recalculating
  // This prevents duplicates from accumulating on every expense change
  const { error: deleteError } = await supabase
    .from('group_settlements')
    .delete()
    .eq('group_id', groupId)
    .eq('settled', false);

  if (deleteError) {
    console.error('saveSettlements delete error:', deleteError);
    return false;
  }

  // If no new settlements needed, we're done
  if (settlements.length === 0) return true;

  // Insert fresh calculated settlements
  const { error: insertError } = await supabase
    .from('group_settlements')
    .insert(
      settlements.map((s) => ({
        group_id: groupId,
        from_user_id: s.fromUserId,
        from_user_name: s.fromUserName,
        to_user_id: s.toUserId,
        to_user_name: s.toUserName,
        amount: s.amount,
        settled: false,
      }))
    );

  if (insertError) {
    console.error('saveSettlements insert error:', insertError);
    return false;
  }

  return true;
}

export async function markSettled(
  settlementId: string,
  adminUserId: string
): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('group_settlements')
    .update({
      settled: true,
      settled_by: adminUserId,
      settled_at: new Date().toISOString(),
    })
    .eq('id', settlementId);

  if (error) { console.error('markSettled:', error); return false; }
  return true;
}
