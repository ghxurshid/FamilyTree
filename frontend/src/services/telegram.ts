/**
 * Telegram Mini App qobig'i.
 *
 * Ilova Telegram ichida ochilganda: to'liq ekranga chiqadi, pastga swipe bilan
 * yopilib ketishi to'xtatiladi va Telegram interfeysi egallagan zonalar CSS
 * o'zgaruvchilariga uzatiladi. Oddiy brauzerda modul hech nima qilmaydi.
 *
 * Mijoz talablari: `disableVerticalSwipes` — Bot API 7.7+, `requestFullscreen`
 * — Bot API 8.0+. Eski mijozlarda `expand()` bilan cheklanamiz.
 */

interface TelegramInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramWebApp {
  platform?: string;
  version?: string;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  viewportStableHeight?: number;
  safeAreaInset?: TelegramInset;
  contentSafeAreaInset?: TelegramInset;
  ready(): void;
  expand(): void;
  disableVerticalSwipes?(): void;
  requestFullscreen?(): void;
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  setBottomBarColor?(color: string): void;
  onEvent(event: string, handler: () => void): void;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

const ZERO_INSET: TelegramInset = { top: 0, bottom: 0, left: 0, right: 0 };

/** Eski mijozlarda metod bo'lmasligi yoki xato qaytarishi mumkin — ilova buzilmasin. */
function quiet(run: () => void): void {
  try {
    run();
  } catch {
    /* qo'llab-quvvatlanmagan mijoz — o'tkazib yuboramiz */
  }
}

function webApp(): TelegramWebApp | null {
  const app = typeof window === 'undefined' ? undefined : window.Telegram?.WebApp;
  if (!app || typeof app.platform !== 'string' || app.platform === 'unknown') return null;
  return app;
}

/** Mijoz versiyasi kerakli Bot API darajasiga yetadimi. */
function versionAtLeast(app: TelegramWebApp, target: string): boolean {
  const current = String(app.version ?? '6.0').split('.').map(Number);
  const needed = target.split('.').map(Number);
  for (let i = 0; i < Math.max(current.length, needed.length); i += 1) {
    const a = Number.isFinite(current[i]) ? current[i] : 0;
    const b = Number.isFinite(needed[i]) ? needed[i] : 0;
    if (a !== b) return a > b;
  }
  return true;
}

/** Ilova Telegram ichida ochilganmi. */
export function isTelegram(): boolean {
  return webApp() !== null;
}

/**
 * Ko'rinadigan balandlik. Telegramda `window.innerHeight` haqiqiy ko'rinishdan
 * katta bo'lishi mumkin — ikkovidan kichigini olamiz, shunda pastki varaq
 * hech qachon ekrandan chiqib ketmaydi.
 */
export function viewportHeight(): number {
  const stable = webApp()?.viewportStableHeight ?? 0;
  return stable > 0 ? Math.min(stable, window.innerHeight) : window.innerHeight;
}

/** Telegram chetlarini (notch + mijoz tugmalari zonasi) CSS'ga uzatadi. */
function applyInsets(app: TelegramWebApp): void {
  const safe = app.safeAreaInset ?? ZERO_INSET;
  const content = app.contentSafeAreaInset ?? ZERO_INSET;
  const root = document.documentElement;
  const px = (a?: number, b?: number) => `${Math.max(0, (a ?? 0) + (b ?? 0))}px`;

  root.style.setProperty('--tg-inset-top', px(safe.top, content.top));
  root.style.setProperty('--tg-inset-bottom', px(safe.bottom, content.bottom));
  root.style.setProperty('--tg-inset-left', px(safe.left, content.left));
  root.style.setProperty('--tg-inset-right', px(safe.right, content.right));
  root.dataset.tgFullscreen = app.isFullscreen ? '1' : '0';
}

/** Telegram chrome'ini ilova mavzusiga moslaydi (mavzu almashganda ham). */
export function applyTelegramChrome(): void {
  const app = webApp();
  if (!app) return;
  const styles = getComputedStyle(document.documentElement);
  const bg = styles.getPropertyValue('--color-bg').trim();
  const surface = styles.getPropertyValue('--color-surface').trim();
  if (!/^#[0-9a-f]{6}$/i.test(bg)) return;

  quiet(() => app.setHeaderColor?.(bg));
  quiet(() => app.setBackgroundColor?.(bg));
  quiet(() => app.setBottomBarColor?.(/^#[0-9a-f]{6}$/i.test(surface) ? surface : bg));
}

let started = false;

/**
 * Telegram ichida ishga tushirish. `main.tsx`'da bir marta chaqiriladi.
 * Telegram tashqarisida darhol qaytadi.
 */
export function initTelegram(): void {
  if (started) return;

  const app = webApp();
  if (!app) {
    // SDK kechikib yuklangan bo'lishi mumkin — bir marta qayta urinamiz.
    if (typeof window !== 'undefined' && document.readyState !== 'complete') {
      window.addEventListener('load', () => initTelegram(), { once: true });
    }
    return;
  }

  started = true;
  document.documentElement.dataset.tg = '1';

  quiet(() => app.ready());
  quiet(() => app.expand());

  // 1-vazifa: pastga swipe qilinganda miniapp yopilib/pastga tushib ketmasin.
  if (versionAtLeast(app, '7.7')) quiet(() => app.disableVerticalSwipes?.());

  // 2-vazifa: to'liq ekran. Qo'llab-quvvatlamasa `expand()` holicha qoladi.
  if (versionAtLeast(app, '8.0')) quiet(() => app.requestFullscreen?.());

  const sync = () => {
    // Eski mijozda swipe baribir ilovani pastga tushirsa — darhol qaytaramiz.
    if (app.isExpanded === false) quiet(() => app.expand());
    applyInsets(app);
  };
  sync();
  applyTelegramChrome();

  for (const event of [
    'fullscreenChanged',
    'safeAreaChanged',
    'contentSafeAreaChanged',
    'viewportChanged',
  ]) {
    quiet(() => app.onEvent(event, sync));
  }

  // To'liq ekran ochilmasa ham ilova kengaytirilgan holda qolishi kerak.
  quiet(() => app.onEvent('fullscreenFailed', () => quiet(() => app.expand())));
}
