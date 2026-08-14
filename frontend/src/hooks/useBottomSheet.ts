import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react';
import { viewportHeight } from '@/services/telegram';
import type { PanelSnap } from '@/types/ui';

/**
 * Mobil pastki varaq: ochilganda ekranning pastki ~22% ini egallaydi, tepasidagi
 * tutqichdan yuqoriga sudralsa to'liq ochiladi, pastga sudralsa qisqaradi yoki
 * yopiladi. Desktopda (o'ng yon panel) o'chirilgan bo'ladi.
 *
 * Varaq React holati bilan emas, to'g'ridan-to'g'ri DOM `transform`'i bilan
 * suriladi — sudrash paytida panel ichidagi ro'yxatlar qayta renderlanmaydi.
 */

/** Qisqa ko'rinishning balandligi — ekran balandligining ulushi. */
const PEEK_RATIO = 0.22;
/** Sarlavha (avatar, ism, belgilar) to'liq sig'ishi uchun chegaralar. */
const PEEK_MIN = 148;
const PEEK_MAX = 240;
/** Shu masofadan keyin harakat "sudrash" deb hisoblanadi. */
const DRAG_THRESHOLD = 6;
/** Tezlikni masofaga o'giramiz — keskin otish ham to'g'ri nuqtaga tushsin. */
const FLICK_PROJECTION = 90;
/** Sudrashdan keyingi tasodifiy bosishni to'sish oynasi (ms). */
const CLICK_GUARD = 320;

/** Qisqa ko'rinishda varaqning ko'rinadigan balandligi (px). */
export function peekHeight(): number {
  return Math.min(PEEK_MAX, Math.max(PEEK_MIN, viewportHeight() * PEEK_RATIO));
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  height: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  offset: number;
  active: boolean;
}

interface BottomSheetOptions {
  /** Faqat mobil ko'rinishda — desktopda panel yon tomonda turadi. */
  enabled: boolean;
  open: boolean;
  snap: PanelSnap;
  onSnap(snap: PanelSnap): void;
  onClose(): void;
}

interface BottomSheet {
  ref: RefObject<HTMLElement>;
  dragging: boolean;
  /** Varaq ildiziga qo'yiladigan hodisa ulagichlari. */
  rootProps: {
    onPointerDown(event: ReactPointerEvent<HTMLElement>): void;
    onPointerMove(event: ReactPointerEvent<HTMLElement>): void;
    onPointerUp(event: ReactPointerEvent<HTMLElement>): void;
    onPointerCancel(event: ReactPointerEvent<HTMLElement>): void;
    onClickCapture(event: ReactMouseEvent<HTMLElement>): void;
  };
}

export function useBottomSheet({
  enabled,
  open,
  snap,
  onSnap,
  onClose,
}: BottomSheetOptions): BottomSheet {
  const ref = useRef<HTMLElement>(null);
  const drag = useRef<DragState | null>(null);
  const draggedAt = useRef(0);
  const [dragging, setDragging] = useState(false);

  /** Tanlangan nuqta uchun varaqning pastga surilishi (px). */
  const offsetFor = useCallback(
    (value: PanelSnap, height: number) =>
      value === 'full' ? 0 : Math.max(0, height - peekHeight()),
    [],
  );

  /** Varaqni tanlangan nuqtaga qo'yadi; yopiq bo'lsa CSS'ning o'ziga qaytaradi. */
  const settle = useCallback(
    (target: PanelSnap = snap) => {
      const el = ref.current;
      if (!el) return;
      el.style.transition = '';
      if (!enabled || !open) {
        el.style.transform = '';
        return;
      }
      el.style.transform = `translateY(${offsetFor(target, el.offsetHeight)}px)`;
    },
    [enabled, offsetFor, open, snap],
  );

  useEffect(() => {
    settle();
    if (!enabled || !open) return undefined;
    // Ekran o'lchami (yoki Telegram ko'rinishi) o'zgarsa — qayta hisoblaymiz.
    const onResize = () => settle();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled, open, settle]);

  const finish = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const state = drag.current;
      const el = ref.current;
      if (!state || !el || event.pointerId !== state.pointerId) return;

      drag.current = null;
      if (el.hasPointerCapture(state.pointerId)) el.releasePointerCapture(state.pointerId);
      if (!state.active) return;

      setDragging(false);
      draggedAt.current = performance.now();

      const projected = state.offset + state.velocity * FLICK_PROJECTION;
      const stops: { at: number; snap: PanelSnap | null }[] = [
        { at: 0, snap: 'full' },
        { at: offsetFor('peek', state.height), snap: 'peek' },
        { at: state.height, snap: null },
      ];
      const nearest = stops.reduce((best, stop) =>
        Math.abs(stop.at - projected) < Math.abs(best.at - projected) ? stop : best,
      );

      if (!nearest.snap) {
        onClose();
        return;
      }
      // Nuqta o'zgarmasa React qayta renderlamaydi — varaqni o'zimiz qo'yamiz.
      onSnap(nearest.snap);
      settle(nearest.snap);
    },
    [offsetFor, onClose, onSnap, settle],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const el = ref.current;
      if (!enabled || !open || !el || drag.current) return;

      const target = event.target as HTMLElement | null;
      const grip = Boolean(target?.closest('[data-sheet-grip]'));
      const control = Boolean(target?.closest('button, a, input, textarea, select'));
      const fromHandle = Boolean(target?.closest('[data-sheet-handle]')) && (!control || grip);

      // To'liq ochiq varaqda matn erkin aylanadi — sudrash faqat tepadagi tutqichdan.
      if (!fromHandle && snap !== 'peek') return;

      const start = offsetFor(snap, el.offsetHeight);
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startOffset: start,
        height: el.offsetHeight,
        lastY: event.clientY,
        lastTime: event.timeStamp || performance.now(),
        velocity: 0,
        offset: start,
        active: false,
      };
    },
    [enabled, offsetFor, open, snap],
  );

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const state = drag.current;
    const el = ref.current;
    if (!state || !el || event.pointerId !== state.pointerId) return;

    const dy = event.clientY - state.startY;
    const dx = event.clientX - state.startX;

    if (!state.active) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      // Ko'ndalang harakat varaqniki emas.
      if (Math.abs(dx) > Math.abs(dy)) {
        drag.current = null;
        return;
      }
      state.active = true;
      setDragging(true);
      el.setPointerCapture(state.pointerId);
      el.style.transition = 'none';
    }

    const now = event.timeStamp || performance.now();
    const dt = now - state.lastTime;
    if (dt > 0) state.velocity = (event.clientY - state.lastY) / dt;
    state.lastY = event.clientY;
    state.lastTime = now;

    // Tepaga ortiqcha tortishga qarshilik; pastda varaq balandligidan oshmaydi.
    const raw = state.startOffset + dy;
    state.offset = Math.min(raw < 0 ? raw / 3 : raw, state.height);
    el.style.transform = `translateY(${state.offset}px)`;
  }, []);

  const onClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    // Sudrash tugagach kelgan bosish — qarindosh kartasi tanlanib ketmasin.
    if (performance.now() - draggedAt.current > CLICK_GUARD) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return {
    ref,
    dragging,
    rootProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: finish,
      onPointerCancel: finish,
      onClickCapture,
    },
  };
}
