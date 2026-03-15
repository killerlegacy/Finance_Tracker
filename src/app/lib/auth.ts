import { AuthUser, AuthSession } from './types';

const USERS_KEY = 'ft_users';
const SESSION_KEY = 'ft_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Simple deterministic hash (not crypto-secure, but fine for localStorage-only auth)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'ft_salt_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string
): Promise<{ ok: boolean; error?: string }> {
  const users = getUsers();
  const normalizedEmail = email.toLowerCase().trim();

  if (users.find((u) => u.email === normalizedEmail)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const hash = await hashPassword(password);
  const newUser: AuthUser = {
    id: generateId(),
    email: normalizedEmail,
    full_name: fullName.trim(),
    password_hash: hash,
    created_at: new Date().toISOString(),
  };

  saveUsers([...users, newUser]);
  createSession(newUser);
  return { ok: true };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const users = getUsers();
  const normalizedEmail = email.toLowerCase().trim();
  const user = users.find((u) => u.email === normalizedEmail);

  if (!user) {
    return { ok: false, error: 'No account found with this email.' };
  }

  const hash = await hashPassword(password);
  if (hash !== user.password_hash) {
    return { ok: false, error: 'Incorrect password.' };
  }

  createSession(user);
  return { ok: true };
}

function createSession(user: AuthUser) {
  const session: AuthSession = {
    user_id: user.id,
    email: user.email,
    full_name: user.full_name,
    expires_at: new Date(Date.now() + SESSION_DURATION_MS).toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (new Date(session.expires_at) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

// Per-user data key so multiple accounts on same browser don't collide
export function getUserDataKey(userId: string): string {
  return `ft_data_${userId}`;
}
