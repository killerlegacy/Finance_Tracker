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

  // When email confirmation is OFF, Supabase still returns a user object
  // but identities will be empty if the email is already taken
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

  // Step 1 — attempt login
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (!error) return { ok: true };

  const msg = error.message.toLowerCase();

  // Step 2 — on credentials failure, check if the email exists
  // by querying our records table for a profile with this email.
  // This is safe because it only runs after a failed login attempt.
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials') ||
    error.code === 'invalid_credentials'
  ) {
    try {
      const { data: profileRows } = await supabase
        .from('records')
        .select('id')
        .eq('type', 'profile')
        .filter('data->>email', 'eq', normalizedEmail)
        .limit(1);

      const userExists = profileRows && profileRows.length > 0;

      if (!userExists) {
        return {
          ok: false,
          error: 'No account found with this email address. Please sign up to get started.',
        };
      }

      // User exists but password was wrong
      return {
        ok: false,
        error: 'Incorrect password. Please try again.',
      };
    } catch {
      // If the check fails for any reason, fall back to a generic message
      return {
        ok: false,
        error: 'Invalid email or password. Please check your details and try again.',
      };
    }
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

  return { ok: false, error: 'Login failed. Please check your details and try again.' };
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
