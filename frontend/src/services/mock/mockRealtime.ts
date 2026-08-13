import { env } from '@/app/config/env';
import { realtimeService } from '../realtimeService';
import { mockDb } from './mockDb';

/** Backendsiz rejimda tashqi yangilanishni taqlid qiladi (dizayndagi xabar). */
const DEMO_DELAY = 26_000;

export function startMockRealtime(): () => void {
  if (!env.useMockApi) return () => undefined;

  const timer = window.setTimeout(() => {
    const people = mockDb.all();
    const person = people.find((candidate) => candidate.generation >= 9) ?? people[0];
    if (!person) return;
    realtimeService.publish({
      type: 'tree:updated',
      reason: `Shajara yangilandi — ${person.name} oilasi`,
      personId: person.id,
    });
  }, DEMO_DELAY);

  return () => window.clearTimeout(timer);
}
