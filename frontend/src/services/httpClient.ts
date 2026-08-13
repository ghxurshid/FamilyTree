import { env } from '@/app/config/env';
import { ApiError, statusToKind, defaultMessage } from './apiError';

type TokenReader = () => string | null;

let readToken: TokenReader = () => null;
let onUnauthorized: (() => void) | null = null;

/** Auth qatlami tokenni shu yerga ulaydi — HTTP klient store'ni bilmaydi. */
export function configureHttp(options: {
  getToken?: TokenReader;
  onUnauthorized?: () => void;
}): void {
  if (options.getToken) readToken = options.getToken;
  if (options.onUnauthorized) onUnauthorized = options.onUnauthorized;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  signal?: AbortSignal;
}

interface ErrorBody {
  message?: string;
  error?: string;
  fields?: Record<string, string>;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = readToken();

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...rest,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('network', defaultMessage('network'));
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const kind = statusToKind(response.status);
    if (kind === 'unauthorized') onUnauthorized?.();
    const details = (payload ?? {}) as ErrorBody;
    throw new ApiError(kind, details.message ?? details.error ?? defaultMessage(kind), {
      status: response.status,
      fields: details.fields,
    });
  }

  return payload as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
