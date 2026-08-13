import { STORAGE_KEYS, storage } from '../storage';
import { http } from '../httpClient';
import type { AuthService } from '../types';
import type { AuthSession } from '@/types/auth';

export const httpAuthService: AuthService = {
  async login(credentials) {
    const session = await http.post<AuthSession>('/auth/login', credentials);
    storage.write(STORAGE_KEYS.session, session);
    return session;
  },

  async register(payload) {
    const session = await http.post<AuthSession>('/auth/register', payload);
    storage.write(STORAGE_KEYS.session, session);
    return session;
  },

  async logout() {
    try {
      await http.post<void>('/auth/logout');
    } finally {
      storage.remove(STORAGE_KEYS.session);
    }
  },

  async requestPasswordReset(email) {
    await http.post<void>('/auth/forgot-password', { email });
  },

  async resetPassword(payload) {
    await http.post<void>('/auth/reset-password', payload);
  },

  async restoreSession() {
    const cached = storage.read<AuthSession | null>(STORAGE_KEYS.session, null);
    if (!cached) return null;
    try {
      const user = await http.get<AuthSession['user']>('/auth/me');
      const session = { ...cached, user };
      storage.write(STORAGE_KEYS.session, session);
      return session;
    } catch {
      storage.remove(STORAGE_KEYS.session);
      return null;
    }
  },
};
