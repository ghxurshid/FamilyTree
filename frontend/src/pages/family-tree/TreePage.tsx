import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { familyTreeStore, useFamilyTree } from '@/stores/familyTreeStore';

/**
 * Daraxt kanvasi doimo ilova qobig'ida turadi — bu sahifa faqat manzil bilan
 * tanlovni sinxronlaydi: `/tree?person=<id>` havolasi odamni ochadi.
 */
export function TreePage(): null {
  const [params, setParams] = useSearchParams();
  const selectedId = useFamilyTree((state) => state.selectedId);
  const status = useFamilyTree((state) => state.status);
  const byId = useFamilyTree((state) => state.index.byId);
  const requested = params.get('person');
  const appliedRef = useRef<string | null>(null);

  // Havoladan tanlovga.
  useEffect(() => {
    if (status !== 'ready' || !requested) return;
    if (requested === selectedId || appliedRef.current === requested) return;
    if (!byId[requested]) return;
    appliedRef.current = requested;
    familyTreeStore.select(requested);
  }, [byId, requested, selectedId, status]);

  // Tanlovdan havolaga.
  useEffect(() => {
    if (status !== 'ready') return;
    if (selectedId === requested) return;
    const next = new URLSearchParams(params);
    if (selectedId) next.set('person', selectedId);
    else next.delete('person');
    appliedRef.current = selectedId;
    setParams(next, { replace: true });
    // `params` bilan bog'lash tsiklga olib keladi — faqat tanlovga qaraymiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, status]);

  return null;
}
