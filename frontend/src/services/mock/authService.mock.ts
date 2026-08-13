import { ApiError } from '../apiError';
import { STORAGE_KEYS, storage } from '../storage';
import type { AuthService } from '../types';
import { latency, mockDb } from './mockDb';
import type { AuthSession } from '@/types/auth';

/**
 * Demo autentifikatsiya: istalgan email va parol ishlaydi (dizayndagi
 * "Demo: istalgan email va parol ishlaydi" yozuvi). Foydalanuvchi
 * shajaradagi haqiqiy shaxsga bog'lanadi.
 */
function makeSession(email: string, displayName?: string): AuthSession {
  const person = mockDb.meId ? mockDb.get(mockDb.meId) : null;
  return {
    token: `mock.${btoa(email).replace(/=+$/, '')}.${Date.now()}`,
    user: {
      id: 'u_' + (mockDb.meId ?? '0'),
      email,
      displayName: displayName || person?.name || email.split('@')[0],
      personId: mockDb.meId,
    },
  };
}

export const mockAuthService: AuthService = {
  async login({ email, password }) {
    await latency(null);
    if (!email.trim() || !password.trim()) {
      throw new ApiError('validation', 'Email va parolni kiriting');
    }
    const session = makeSession(email);
    storage.write(STORAGE_KEYS.session, session);
    return session;
  },

  async register({ email, password, displayName }) {
    await latency(null);
    if (!email.trim() || !password.trim()) {
      throw new ApiError('validation', 'Email va parolni kiriting');
    }
    const session = makeSession(email, displayName);
    storage.write(STORAGE_KEYS.session, session);
    return session;
  },

  async logout() {
    await latency(null, 0.3);
    storage.remove(STORAGE_KEYS.session);
  },

  async requestPasswordReset(email) {
    await latency(null);
    if (!email.trim()) throw new ApiError('validation', 'Emailingizni kiriting');
  },

  async resetPassword({ password }) {
    await latency(null);
    if (password.trim().length < 6) {
      throw new ApiError('validation', "Parol kamida 6 belgidan iborat bo'lsin");
    }
  },

  async restoreSession() {
    return storage.read<AuthSession | null>(STORAGE_KEYS.session, null);
  },
};
