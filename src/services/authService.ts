/**
 * Authentication Service for Employee Task Management Portal
 * Supports:
 * - Login with email or username
 * - Password verification via salted SHA-256 (no plaintext passwords)
 * - Validation & informative credential error messages
 * - Session persistence via localStorage
 * - Safe Logout workflow
 */

import { User } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { verifyPassword } from '../utils/crypto';

const SESSION_STORAGE_KEY = 'taskportal_active_session';
const TOKEN_STORAGE_KEY = 'taskportal_auth_token';

export interface LoginResult {
  success: boolean;
  user?: User;
  error?: string;
  field?: 'identifier' | 'password' | 'general';
}

export const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    username: 'admin',
    email: 'admin@taskportal.io',
    password: 'Admin@123',
    role: 'Administrator (Full Access)',
    badgeColor: 'blue'
  },
  {
    label: 'Alice (Employee)',
    username: 'alice',
    email: 'alice.smith@taskportal.io',
    password: 'Alice@123',
    role: 'Senior Frontend Engineer',
    badgeColor: 'emerald'
  },
  {
    label: 'Bob (Employee)',
    username: 'bob',
    email: 'bob.jones@taskportal.io',
    password: 'Bob@123',
    role: 'Staff Product Designer',
    badgeColor: 'purple'
  }
];

export async function authenticateUser(identifier: string, password: string): Promise<LoginResult> {
  const trimmedId = identifier.trim().toLowerCase();

  // Basic validation
  if (!trimmedId) {
    return {
      success: false,
      error: 'Please enter your email or username.',
      field: 'identifier'
    };
  }

  if (!password) {
    return {
      success: false,
      error: 'Please enter your password.',
      field: 'password'
    };
  }

  // Look up user in user repository by username or email
  const user = INITIAL_USERS.find(
    u => u.username.toLowerCase() === trimmedId || u.email.toLowerCase() === trimmedId
  );

  if (!user || !user.password_hash || !user.salt) {
    return {
      success: false,
      error: 'Invalid username/email or password. Please verify your credentials.',
      field: 'general'
    };
  }

  // Verify against cryptographic salted hash
  const isValid = await verifyPassword(password, user.password_hash, user.salt);

  if (!isValid) {
    return {
      success: false,
      error: 'Invalid username/email or password. Please verify your credentials.',
      field: 'general'
    };
  }

  // Safe user record (omit sensitive hash details from session store)
  const safeUser: User = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    employee_id: user.employee_id
  };

  // Persist session
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
    localStorage.setItem(TOKEN_STORAGE_KEY, `mock-jwt-bearer-${safeUser.id}-${Date.now()}`);
  } catch (e) {
    console.warn('LocalStorage error saving session', e);
  }

  return {
    success: true,
    user: safeUser
  };
}

export function getStoredSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as User;
    }
  } catch (e) {
    console.warn('Failed to parse stored session', e);
  }
  return null;
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear stored session', e);
  }
}
