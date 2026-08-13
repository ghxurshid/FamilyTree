import { authService } from '@/services';
import { configureHttp } from '@/services/httpClient';
import { toUserMessage } from '@/services/apiError';
import type {
  AuthSession,
  AuthStatus,
  AuthUser,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types/auth';
import { createStore, useStore } from './createStore';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  /** So'rov davom etayotgani — formalardagi tugma holati. */
  pending: boolean;
  error: string | null;
}

const store = createStore<AuthState>({
  status: 'idle',
  user: null,
  token: null,
  pending: false,
  error: null,
});

function adopt(session: AuthSession) {
  store.setState({
    status: 'authenticated',
    user: session.user,
    token: session.token,
    pending: false,
    error: null,
  });
}

function clear(status: AuthStatus = 'anonymous') {
  store.setState({ status, user: null, token: null, pending: false });
}

async function run<T>(action: () => Promise<T>): Promise<T> {
  store.setState({ pending: true, error: null });
  try {
    return await action();
  } catch (error) {
    store.setState({ pending: false, error: toUserMessage(error) });
    throw error;
  }
}

configureHttp({
  getToken: () => store.getState().token,
  onUnauthorized: () => clear(),
});

export const authStore = {
  ...store,

  async restore() {
    store.setState({ status: 'loading' });
    const session = await authService.restoreSession().catch(() => null);
    if (session) adopt(session);
    else clear();
  },

  async login(credentials: LoginCredentials) {
    adopt(await run(() => authService.login(credentials)));
  },

  async register(payload: RegisterPayload) {
    adopt(await run(() => authService.register(payload)));
  },

  async requestPasswordReset(email: string) {
    await run(() => authService.requestPasswordReset(email));
    store.setState({ pending: false });
  },

  async resetPassword(payload: ResetPasswordPayload) {
    await run(() => authService.resetPassword(payload));
    store.setState({ pending: false });
  },

  async logout() {
    await authService.logout().catch(() => undefined);
    clear();
  },

  clearError: () => store.setState({ error: null }),
};

export function useAuth<S>(selector: (state: AuthState) => S): S {
  return useStore(store, selector);
}

export type { AuthState };
