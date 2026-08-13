import type { PersonId } from './person';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  /** Shajaradagi shaxs — huquqlar va qarindoshlik shundan hisoblanadi. */
  personId: PersonId | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginCredentials {
  displayName: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'anonymous';
