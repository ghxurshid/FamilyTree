import { useEffect, type ReactNode } from 'react';
import { authStore } from '@/stores/authStore';
import { familyTreeStore } from '@/stores/familyTreeStore';
import { preferencesStore } from '@/stores/preferencesStore';
import { realtimeService } from '@/services';

/**
 * Ilova ishga tushishi: sozlamalarni qo'llash, seansni tiklash, shajarani
 * yuklash va tashqi yangilanishlarga obuna bo'lish.
 */
export function AppProviders({ children }: { children: ReactNode }): JSX.Element {
  useEffect(() => {
    preferencesStore.applyToDocument();
    void authStore.restore();
    void familyTreeStore.load();
  }, []);

  // Tizim mavzusi va harakat sozlamasi o'zgarsa — darhol moslashamiz.
  useEffect(() => {
    const themeQuery = window.matchMedia('(prefers-color-scheme: light)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => preferencesStore.syncWithSystem();
    themeQuery.addEventListener('change', sync);
    motionQuery.addEventListener('change', sync);
    return () => {
      themeQuery.removeEventListener('change', sync);
      motionQuery.removeEventListener('change', sync);
    };
  }, []);

  // Tashqaridan kelgan yozuv o'zgarishlari holatga singadi.
  useEffect(
    () =>
      realtimeService.subscribe((event) => {
        if (event.type === 'person:created' || event.type === 'person:updated') {
          familyTreeStore.applyPerson(event.person);
        }
        if (event.type === 'person:deleted') {
          familyTreeStore.removePerson(event.id);
        }
      }),
    [],
  );

  return <>{children}</>;
}
