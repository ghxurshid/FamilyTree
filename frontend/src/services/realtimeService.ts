import type { RealtimeService, TreeEvent } from './types';

/**
 * Tashqi yangilanishlar uchun ulanish nuqtasi. Hozircha jarayon ichidagi
 * kanal — backend WebSocket'i paydo bo'lganda shu yerda ulanadi va store
 * o'zgarmaydi.
 */
function createRealtimeService(): RealtimeService {
  const listeners = new Set<(event: TreeEvent) => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    publish(event) {
      for (const listener of [...listeners]) listener(event);
    },
  };
}

export const realtimeService = createRealtimeService();
