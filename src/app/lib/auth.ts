import { createClient } from './supabase';

export async function registerUser(email: string, password: string, fullName: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
    },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function loginUser(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
