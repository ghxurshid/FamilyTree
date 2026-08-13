import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  CAMERA_MARGIN,
  DEFAULT_ZOOM,
  DENSITY_MID_BELOW,
  DENSITY_MIN_BELOW,
  FIT_DURATION,
  FLY_DURATION,
  MAX_ZOOM,
  MIN_ZOOM,
  ROW_H,
} from '@/constants/tree';
import type { TreeDensity } from '@/types/ui';

export interface CameraState {
  x: number;
  y: number;
  k: number;
}

export interface CameraBounds {
  width: number;
  height: number;
}

/** Ekranning kamera markazini siljituvchi zonalar (panel, avlod navigatori). */
export interface CameraInsets {
  left: number;
  right: number;
  bottom: number;
}

export interface ViewportRect {
  width: number;
  height: number;
  /** Foydali maydonning markazi. */
  cx: number;
  cy: number;
}

export interface TreeCamera {
  wrapRef: React.RefObject<HTMLDivElement>;
  contentRef: React.RefObject<HTMLDivElement>;
  get(): CameraState;
  subscribe(listener: (state: CameraState) => void): () => void;
  viewportRect(): ViewportRect;
  flyTo(x: number, y: number, k: number, duration?: number): void;
  zoomAt(factor: number, clientX: number, clientY: number): void;
  zoomIn(): void;
  zoomOut(): void;
  fitAll(duration?: number): void;
  /** Nuqtani foydali maydon markaziga olib keladi. */
  focusPoint(x: number, y: number, zoom?: number, duration?: number): void;
  /** Dizayndagi "uy" ko'rinishi — odam pastroqda, ajdodlari ko'rinadi. */
  homeView(x: number, y: number): void;
  panBy(dx: number, dy: number): void;
  /** Oxirgi bosishda haqiqiy surish bo'lganmi — kartaga click o'tkazish uchun. */
  didDrag(): boolean;
}

interface Options {
  boundsRef: React.MutableRefObject<CameraBounds>;
  insetsRef: React.MutableRefObject<CameraInsets>;
  reducedMotionRef: React.MutableRefObject<boolean>;
  onDensityChange(density: TreeDensity): void;
}

const densityFor = (k: number): TreeDensity =>
  k < DENSITY_MIN_BELOW ? 'min' : k < DENSITY_MID_BELOW ? 'mid' : 'full';

const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

/**
 * Xarita kabi navigatsiya: surish, inersiya, chimchilab kattalashtirish,
 * kursor atrofida zoom va yumshoq kamera parvozi. Kamera holati React
 * holatida emas — har kadrda faqat transform yoziladi.
 */
export function useTreeCamera({
  boundsRef,
  insetsRef,
  reducedMotionRef,
  onDensityChange,
}: Options): TreeCamera {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cam = useRef<CameraState>({ x: 0, y: 0, k: DEFAULT_ZOOM });
  const listeners = useRef(new Set<(state: CameraState) => void>());
  const density = useRef<TreeDensity>(densityFor(DEFAULT_ZOOM));

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ dist: number; time: number } | null>(null);
  const pinch = useRef<{ d: number; cx: number; cy: number } | null>(null);
  const velocity = useRef({ x: 0, y: 0 });
  const inertia = useRef<number | null>(null);
  const tween = useRef<number | null>(null);
  const captured = useRef(false);
  const onDensity = useRef(onDensityChange);
  onDensity.current = onDensityChange;

  const apply = useCallback(() => {
    const node = contentRef.current;
    const { x, y, k } = cam.current;
    if (node) node.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${k})`;
    const next = densityFor(k);
    if (next !== density.current) {
      density.current = next;
      onDensity.current(next);
    }
    for (const listener of listeners.current) listener(cam.current);
  }, []);

  const clamp = useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect();
    const width = rect?.width ?? window.innerWidth;
    const height = rect?.height ?? window.innerHeight;
    const w = boundsRef.current.width * cam.current.k;
    const h = boundsRef.current.height * cam.current.k;
    cam.current.x = Math.min(width - CAMERA_MARGIN, Math.max(CAMERA_MARGIN - w, cam.current.x));
    cam.current.y = Math.min(height - CAMERA_MARGIN, Math.max(CAMERA_MARGIN - h, cam.current.y));
  }, [boundsRef]);

  const stopInertia = useCallback(() => {
    if (inertia.current !== null) cancelAnimationFrame(inertia.current);
    inertia.current = null;
  }, []);

  const stopTween = useCallback(() => {
    if (tween.current !== null) cancelAnimationFrame(tween.current);
    tween.current = null;
  }, []);

  const viewportRect = useCallback((): ViewportRect => {
    const rect = wrapRef.current?.getBoundingClientRect();
    const width = rect?.width ?? window.innerWidth;
    const height = rect?.height ?? window.innerHeight;
    const { left, right, bottom } = insetsRef.current;
    return {
      width,
      height,
      cx: left + (width - left - right) / 2,
      cy: (height - bottom) / 2,
    };
  }, [insetsRef]);

  const flyTo = useCallback(
    (x: number, y: number, k: number, duration = FLY_DURATION) => {
      stopTween();
      stopInertia();
      const from = { ...cam.current };
      const total = reducedMotionRef.current ? 1 : duration;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / total);
        const e = easeOutCubic(p);
        cam.current = {
          x: from.x + (x - from.x) * e,
          y: from.y + (y - from.y) * e,
          k: from.k + (k - from.k) * e,
        };
        apply();
        tween.current = p < 1 ? requestAnimationFrame(step) : null;
      };
      tween.current = requestAnimationFrame(step);
    },
    [apply, reducedMotionRef, stopInertia, stopTween],
  );

  const zoomAt = useCallback(
    (factor: number, clientX: number, clientY: number) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, cam.current.k * factor));
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      cam.current.x = px - (px - cam.current.x) * (next / cam.current.k);
      cam.current.y = py - (py - cam.current.y) * (next / cam.current.k);
      cam.current.k = next;
      clamp();
      apply();
    },
    [apply, clamp],
  );

  const zoomFromCenter = useCallback(
    (factor: number) => {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [zoomAt],
  );

  const fitAll = useCallback(
    (duration = FIT_DURATION) => {
      const view = viewportRect();
      const bounds = boundsRef.current;
      const k = Math.max(
        MIN_ZOOM,
        Math.min((view.width - 120) / bounds.width, (view.height - 120) / bounds.height, 1),
      );
      flyTo((view.width - bounds.width * k) / 2, 60, k, duration);
    },
    [boundsRef, flyTo, viewportRect],
  );

  const focusPoint = useCallback(
    (x: number, y: number, zoom?: number, duration = FLY_DURATION) => {
      const view = viewportRect();
      const k = zoom ?? Math.max(cam.current.k, 0.9);
      flyTo(view.cx - x * k, view.cy - y * k, k, duration);
    },
    [flyTo, viewportRect],
  );

  const homeView = useCallback(
    (x: number, y: number) => {
      const view = viewportRect();
      const k = Math.max(0.44, Math.min(0.92, view.height / (ROW_H * 3.4)));
      flyTo(view.cx - x * k, view.height * 0.62 - y * k, k, 760);
    },
    [flyTo, viewportRect],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      cam.current.x += dx;
      cam.current.y += dy;
      clamp();
      apply();
    },
    [apply, clamp],
  );

  // Boshlang'ich transformni darhol yozamiz — kartalar sakramaydi.
  useEffect(() => {
    apply();
  }, [apply]);

  // — kirish hodisalari —
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      stopInertia();
      stopTween();
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      drag.current = { dist: 0, time: performance.now() };
      velocity.current = { x: 0, y: 0 };
      captured.current = false;
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinch.current = {
          d: Math.hypot(a.x - b.x, a.y - b.y),
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
        };
        try {
          wrap.setPointerCapture(event.pointerId);
          captured.current = true;
        } catch {
          /* ba'zi brauzerlarda capture rad etiladi */
        }
      }
      wrap.style.cursor = 'grabbing';
    };

    const onPointerMove = (event: PointerEvent) => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.current.size === 2 && pinch.current) {
        const [a, b] = [...pointers.current.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const cx = (a.x + b.x) / 2;
        const cy = (a.y + b.y) / 2;
        if (pinch.current.d > 0) zoomAt(distance / pinch.current.d, cx, cy);
        cam.current.x += cx - pinch.current.cx;
        cam.current.y += cy - pinch.current.cy;
        pinch.current = { d: distance, cx, cy };
        clamp();
        apply();
        return;
      }

      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      const now = performance.now();
      const dt = Math.max(1, now - (drag.current?.time ?? now));
      velocity.current = {
        x: velocity.current.x * 0.6 + (dx / dt) * 0.4,
        y: velocity.current.y * 0.6 + (dy / dt) * 0.4,
      };
      if (drag.current) {
        drag.current.time = now;
        drag.current.dist += Math.abs(dx) + Math.abs(dy);
        // Pointer faqat haqiqiy surishda ushlanadi — aks holda kartaga
        // bosish hodisasi yetib bormaydi.
        if (!captured.current && drag.current.dist > 6) {
          try {
            wrap.setPointerCapture(event.pointerId);
            captured.current = true;
          } catch {
            /* e'tiborsiz */
          }
        }
      }
      panBy(dx, dy);
    };

    const onPointerUp = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId);
      if (captured.current) {
        try {
          wrap.releasePointerCapture(event.pointerId);
        } catch {
          /* e'tiborsiz */
        }
        captured.current = false;
      }
      if (pointers.current.size < 2) pinch.current = null;
      wrap.style.cursor = 'grab';

      const moved = (drag.current?.dist ?? 0) > 8;
      if (pointers.current.size === 0 && moved && !reducedMotionRef.current) {
        let v = { ...velocity.current };
        const speed = Math.hypot(v.x, v.y);
        if (speed > 3.2) v = { x: (v.x / speed) * 3.2, y: (v.y / speed) * 3.2 };
        if (speed > 0.06) {
          let last = performance.now();
          const step = (now: number) => {
            const dt = Math.min(32, now - last);
            last = now;
            const decay = Math.pow(0.938, dt / 16);
            v.x *= decay;
            v.y *= decay;
            panBy(v.x * dt, v.y * dt);
            inertia.current =
              Math.hypot(v.x, v.y) > 0.02 ? requestAnimationFrame(step) : null;
          };
          inertia.current = requestAnimationFrame(step);
        }
      }
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      stopInertia();
      const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0022));
      zoomAt(factor, event.clientX, event.clientY);
    };

    const onDoubleClick = (event: MouseEvent) => zoomAt(1.6, event.clientX, event.clientY);

    wrap.addEventListener('pointerdown', onPointerDown);
    wrap.addEventListener('pointermove', onPointerMove);
    wrap.addEventListener('pointerup', onPointerUp);
    wrap.addEventListener('pointercancel', onPointerUp);
    wrap.addEventListener('wheel', onWheel, { passive: false });
    wrap.addEventListener('dblclick', onDoubleClick);

    return () => {
      wrap.removeEventListener('pointerdown', onPointerDown);
      wrap.removeEventListener('pointermove', onPointerMove);
      wrap.removeEventListener('pointerup', onPointerUp);
      wrap.removeEventListener('pointercancel', onPointerUp);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('dblclick', onDoubleClick);
      stopInertia();
      stopTween();
    };
  }, [apply, clamp, panBy, reducedMotionRef, stopInertia, stopTween, zoomAt]);

  return useMemo<TreeCamera>(
    () => ({
      wrapRef,
      contentRef,
      get: () => cam.current,
      subscribe(listener) {
        listeners.current.add(listener);
        listener(cam.current);
        return () => listeners.current.delete(listener);
      },
      viewportRect,
      flyTo,
      zoomAt,
      zoomIn: () => zoomFromCenter(1.25),
      zoomOut: () => zoomFromCenter(0.8),
      fitAll,
      focusPoint,
      homeView,
      panBy,
      didDrag: () => (drag.current?.dist ?? 0) > 8,
    }),
    [fitAll, flyTo, focusPoint, homeView, panBy, viewportRect, zoomAt, zoomFromCenter],
  );
}
