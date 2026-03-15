import { createClient } from './supabase';
import { AnyRecord } from './types';

export async function loadAllRecords(userId: string): Promise<AnyRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('loadAllRecords error:', error);
    return [];
  }

  return (data || []).map((row) => ({
    ...row.data,
    id: row.id,
  })) as AnyRecord[];
}

export async function createRecord(userId: string, record: AnyRecord): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('records').insert({
    id: record.id,
    user_id: userId,
    type: record.type,
    data: record,
  });
  if (error) { console.error('createRecord error:', error); return false; }
  return true;
}

export async function updateRecord(userId: string, record: AnyRecord): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('records')
    .update({ data: record, type: record.type })
    .eq('id', record.id)
    .eq('user_id', userId);
  if (error) { console.error('updateRecord error:', error); return false; }
  return true;
}

export async function deleteRecord(userId: string, recordId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('id', recordId)
    .eq('user_id', userId);
  if (error) { console.error('deleteRecord error:', error); return false; }
  return true;
}

export async function upsertRecord(userId: string, record: AnyRecord): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from('records').upsert({
    id: record.id,
    user_id: userId,
    type: record.type,
    data: record,
  });
  if (error) { console.error('upsertRecord error:', error); return false; }
  return true;
}

export async function deleteAllUserRecords(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase
    .from('records')
    .delete()
    .eq('user_id', userId);
  if (error) { console.error('deleteAllUserRecords error:', error); return false; }
  return true;
}
