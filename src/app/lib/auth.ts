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
    // Handle specific registration errors
    if (error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already exists') ||
        error.message.toLowerCase().includes('user already')) {
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

  if (!data.session && !data.user) {
    return { ok: false, error: 'Signup failed. Please try again.' };
  }

  // Supabase sometimes returns a user with no session if email is already taken
  // but confirmation is off — identities array will be empty
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { ok: false, error: 'An account with this email already exists. Please log in instead.' };
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

  if (error) {
    const msg = error.message.toLowerCase();

    // Supabase returns "Invalid login credentials" for both wrong password
    // and non-existent user. We differentiate by checking the error code.
    if (
      msg.includes('invalid login credentials') ||
      msg.includes('invalid credentials') ||
      error.code === 'invalid_credentials'
    ) {
      // Try to determine if the user exists by attempting a password reset
      // (this doesn't send an email, just tells us if the user exists)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        { redirectTo: undefined as unknown as string }
      );

      // If reset returns no error, user exists → wrong password
      // If reset also errors with user not found → account doesn't exist
      if (
        resetError &&
        (resetError.message.toLowerCase().includes('user not found') ||
         resetError.message.toLowerCase().includes('unable to validate') ||
         resetError.code === 'user_not_found')
      ) {
        return {
          ok: false,
          error: 'No account found with this email address. Please sign up first.',
        };
      }

      // User exists but password is wrong
      return {
        ok: false,
        error: 'Incorrect password. Please try again or reset your password.',
      };
    }

    if (msg.includes('email not confirmed')) {
      return {
        ok: false,
        error: 'Please confirm your email before logging in.',
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

    // Fallback for anything unexpected
    return { ok: false, error: 'Login failed. Please check your details and try again.' };
  }

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
