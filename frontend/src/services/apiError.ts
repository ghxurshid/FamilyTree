export type ApiErrorKind =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'conflict'
  | 'server'
  | 'unknown';

/** Yagona xato shakli — komponentlar backend istisnosini ko'rmaydi. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly fields: Record<string, string>;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options: { status?: number | null; fields?: Record<string, string> } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options.status ?? null;
    this.fields = options.fields ?? {};
  }
}

const MESSAGES: Record<ApiErrorKind, string> = {
  network: "Internet aloqasi yo'q — keyinroq urinib ko'ring",
  unauthorized: 'Avval tizimga kiring',
  forbidden: "Bu amalni bajarish huquqingiz yo'q",
  'not-found': 'Ma’lumot topilmadi',
  validation: "Ma'lumotlarni tekshirib qayta yuboring",
  conflict: 'Bu yozuv boshqa joyda o’zgargan — sahifani yangilang',
  server: 'Serverda xatolik — birozdan keyin urinib ko’ring',
  unknown: 'Kutilmagan xatolik yuz berdi',
};

export function statusToKind(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 422 || status === 400) return 'validation';
  if (status >= 500) return 'server';
  return 'unknown';
}

/** Har qanday xatoni foydalanuvchiga ko'rsatsa bo'ladigan matnga aylantiradi. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || MESSAGES[error.kind];
  if (error instanceof Error && error.message) return error.message;
  return MESSAGES.unknown;
}

export function defaultMessage(kind: ApiErrorKind): string {
  return MESSAGES[kind];
}
