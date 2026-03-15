import { createClient } from './supabase';

export async function registerUser(email: string, password: string, fullName: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.toLowerCase().trim(),
    password,
    options: {
      data: { full_name: fullName.trim() },
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes('already registered') ||
      error.message.toLowerCase().includes('already exists') ||
      error.message.toLowerCase().includes('user already')
    ) {
      return { ok: false, error: 'An account with this email already exists. Please log in instead.' };
    }
    if (error.message.toLowerCase().includes('password')) {
      return { ok: false, error: 'Password is too weak. Please use at least 6 characters.' };
    }
    if (error.message.toLowerCase().includes('email')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    return { ok: false, error: error.message };
  }

  // If email confirmation is OFF but email already exists,
  // Supabase returns a user with empty identities array
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: 'An account with this email already exists. Please log in instead.' };
  }

  if (!data.session && !data.user) {
    return { ok: false, error: 'Signup failed. Please try again.' };
  }

  return { ok: true };
}

export async function loginUser(email: string, password: string) {
  const supabase = createClient();
  const normalizedEmail = email.toLowerCase().trim();

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (!error) return { ok: true };

  const msg = error.message.toLowerCase();

  // Invalid credentials — Supabase intentionally returns the same error
  // for both wrong password and non-existent email (security best practice).
  // We cannot distinguish them without a separate authenticated query,
  // so we show a clear, honest combined message.
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials') ||
    error.code === 'invalid_credentials'
  ) {
    return {
      ok: false,
      error: 'Incorrect email or password. Please check your details and try again.',
    };
  }

  if (msg.includes('email not confirmed')) {
    return {
      ok: false,
      error: 'Please confirm your email address before logging in.',
    };
  }

  if (msg.includes('too many requests') || error.code === 'over_request_rate_limit') {
    return {
      ok: false,
      error: 'Too many login attempts. Please wait a few minutes and try again.',
    };
  }

  if (msg.includes('network') || msg.includes('fetch')) {
    return {
      ok: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }

  // Fallback
  return {
    ok: false,
    error: 'Login failed. Please check your details and try again.',
  };
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
