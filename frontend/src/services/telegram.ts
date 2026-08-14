/**
 * Telegram Mini App qobig'i.
 *
 * Ilova Telegram ichida ochilganda uchta ish bajariladi:
 *   1. `expand()` — mijoz brauzerchasi telefon ekranining to'liq balandligiga
 *      yoyiladi (Telegram uni yarim balandlikda ochadi);
 *   2. `disableVerticalSwipes()` — pastga swipe qilinganda ilova yopilmaydi;
 *   3. ko'rinish balandligi `--app-height` ga uzatiladi — HTML sahifa aynan
 *      brauzercha ko'rsatayotgan maydonni to'ldiradi, ortiq ham, kam ham emas.
 *
 * Bot API 8.0 ning "fullscreen" rejimi ataylab ishlatilmaydi: u mijoz
 * sarlavhasini ilova ustiga qalqitib qo'yadi va tugmalar kontent bilan
 * chalkashadi. Ilova shu rejimda ochilgan bo'lsa — oddiy ko'rinishga qaytaramiz.
 *
 * Mijoz talabi: `disableVerticalSwipes` — Bot API 7.7+. Eski mijozlarda
 * `expand()` bilan cheklanamiz. Oddiy brauzerda modul hech nima qilmaydi.
 */

interface TelegramInset {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface TelegramHapticFeedback {
  impactOccurred?(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  selectionChanged?(): void;
}

interface TelegramWebApp {
  platform?: string;
  version?: string;
  isExpanded?: boolean;
  isFullscreen?: boolean;
  viewportStableHeight?: number;
  safeAreaInset?: TelegramInset;
  contentSafeAreaInset?: TelegramInset;
  HapticFeedback?: TelegramHapticFeedback;
  ready(): void;
  expand(): void;
  disableVerticalSwipes?(): void;
  exitFullscreen?(): void;
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
 *
 * `viewportStableHeight` — klaviatura ochilganda o'zgarmaydigan balandlik;
 * shuning uchun input'ga bosilganda maket sakramaydi.
 */
export function viewportHeight(): number {
  const stable = webApp()?.viewportStableHeight ?? 0;
  return stable > 0 ? Math.min(stable, window.innerHeight) : window.innerHeight;
}

/**
 * Sahifa balandligini mijoz brauzerchasi ko'rsatayotgan maydonga tenglaydi.
 * `100vh` Telegram webview'ida noto'g'ri qiymat berishi mumkin — o'lchovni
 * mijozning o'zidan olamiz.
 */
function applyViewport(): void {
  document.documentElement.style.setProperty('--app-height', `${Math.round(viewportHeight())}px`);
}

/** Telegram chetlarini (notch + mijoz kontent zonasi) CSS'ga uzatadi. */
function applyInsets(app: TelegramWebApp): void {
  const safe = app.safeAreaInset ?? ZERO_INSET;
  const content = app.contentSafeAreaInset ?? ZERO_INSET;
  const root = document.documentElement;
  const px = (value: number) => `${Math.max(0, Math.round(value))}px`;

  // Oddiy (fullscreen'siz) rejimda mijoz sarlavhasi tepani o'zi egallaydi va
  // webview uning ostidan boshlanadi — tepaga qo'shimcha bo'shliq faqat mijoz
  // kontent zonasini siljitgan holatda kerak, qurilma notch'i uchun emas.
  root.style.setProperty('--tg-inset-top', px(content.top ?? 0));
  root.style.setProperty('--tg-inset-bottom', px((safe.bottom ?? 0) + (content.bottom ?? 0)));
  root.style.setProperty('--tg-inset-left', px((safe.left ?? 0) + (content.left ?? 0)));
  root.style.setProperty('--tg-inset-right', px((safe.right ?? 0) + (content.right ?? 0)));
}

/**
 * Bo'lim almashganda yengil tebranish (Bot API 6.1+). Telegram tashqarisida —
 * mavjud bo'lsa — brauzerning `vibrate` API'siga tushadi, bo'lmasa jim o'tadi.
 */
export function hapticSelection(): void {
  const app = webApp();
  if (app) {
    if (versionAtLeast(app, '6.1')) quiet(() => app.HapticFeedback?.selectionChanged?.());
    return;
  }
  quiet(() => navigator.vibrate?.(8));
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

  const swipeGuard = versionAtLeast(app, '7.7');

  /** Ilovani ochiq va to'liq balandlikda ushlab turadi. */
  const hold = () => {
    // Telegram brauzerchani yarim balandlikda ochadi — to'liq ekranga yoyamiz.
    if (app.isExpanded === false) quiet(() => app.expand());
    // Pastga swipe ilovani yopmasin. Mijoz ba'zi holatlarda (fon → oldinga
    // qaytish) sozlamani tiklaydi, shuning uchun har sinxronda takrorlaymiz.
    if (swipeGuard) quiet(() => app.disableVerticalSwipes?.());
    // Fullscreen rejimida mijoz tugmalari kontent ustida qalqiydi — kerak emas.
    if (app.isFullscreen) quiet(() => app.exitFullscreen?.());
  };

  const sync = () => {
    hold();
    applyViewport();
    applyInsets(app);
  };

  quiet(() => app.expand());
  sync();
  applyTelegramChrome();

  for (const event of [
    'viewportChanged',
    'safeAreaChanged',
    'contentSafeAreaChanged',
    'fullscreenChanged',
    'activated',
  ]) {
    quiet(() => app.onEvent(event, sync));
  }

  // Aylantirish yoki klaviatura — mijoz hodisasi kelmasa ham balandlik yangilansin.
  window.addEventListener('resize', applyViewport);
  window.addEventListener('orientationchange', applyViewport);
}
