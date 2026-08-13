import type { Toast, ToastKind } from '@/types/ui';
import { createStore, useStore } from './createStore';

interface ToastState {
  toasts: Toast[];
}

const store = createStore<ToastState>({ toasts: [] });
const timers = new Map<string, number>();
const LIFETIME = 3200;

function dismiss(id: string) {
  const timer = timers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
  store.setState((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
}

function show(text: string, kind: ToastKind = 'ok') {
  const id = `t${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
  store.setState((state) => ({ toasts: [...state.toasts.slice(-2), { id, text, kind }] }));
  timers.set(id, window.setTimeout(() => dismiss(id), LIFETIME));
  return id;
}

/** Markazlashgan bildirishnoma tizimi — hech kim `alert` chaqirmaydi. */
export const toast = {
  show,
  success: (text: string) => show(text, 'ok'),
  warn: (text: string) => show(text, 'warn'),
  error: (text: string) => show(text, 'error'),
  dismiss,
};

export function useToasts(): Toast[] {
  return useStore(store, (state) => state.toasts);
}
