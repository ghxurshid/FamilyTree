import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { FamilyTreeCanvas } from '@/components/family-tree/FamilyTreeCanvas';
import { SyncBanner } from '@/components/family-tree/SyncBanner';
import { MobileNav } from '@/components/layout/MobileNav';
import { TopBar } from '@/components/layout/TopBar';
import { PersonDetailPanel } from '@/components/person/PersonDetailPanel';
import { PersonFormPanel } from '@/components/person/PersonFormPanel';
import { SearchCommand } from '@/components/search/SearchCommand';
import { Toaster } from '@/components/ui/Toaster';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { familyTreeStore } from '@/stores/familyTreeStore';
import { personEditorStore } from '@/stores/personEditorStore';
import { searchStore } from '@/stores/searchStore';
import styles from '@/components/layout/layout.module.css';

/**
 * Ilova qobig'i: kanvas doimo mavjud, sahifalar esa uning ustidagi qatlam.
 * Shuning uchun bo'limlar orasida yurganda kamera holati saqlanadi.
 */
export function AppLayout(): JSX.Element {
  const isMobile = useIsMobile();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target ? /input|textarea|select/i.test(target.tagName) : false;

      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchStore.open();
        return;
      }

      if (event.key !== 'Escape') return;
      // Modal o'z Esc'ini o'zi boshqaradi.
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      if (personEditorStore.getState().session) {
        personEditorStore.close();
        return;
      }
      if (familyTreeStore.getState().panelOpen) familyTreeStore.closePanel();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className={styles.shell}>
      <TopBar />

      <main className={styles.main}>
        <FamilyTreeCanvas />
        <Outlet />
      </main>

      {isMobile ? <MobileNav /> : null}

      <PersonDetailPanel />
      <PersonFormPanel />
      <SearchCommand />
      <SyncBanner />
      <Toaster />
    </div>
  );
}
