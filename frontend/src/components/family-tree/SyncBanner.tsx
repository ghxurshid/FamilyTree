import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { realtimeService } from '@/services';
import { startMockRealtime } from '@/services/mock/mockRealtime';
import { usePersonActions } from '@/features/people/usePersonActions';
import { useFormat } from '@/hooks/useFormat';
import type { PersonId } from '@/types/person';
import styles from './tree.module.css';

interface Notice {
  reason: string;
  personId?: PersonId;
}

/**
 * Tashqi yangilanish xabari. Hodisalar real-time qatlamidan keladi —
 * WebSocket ulanganda shu joyning o'zi ishlaydi.
 */
export function SyncBanner(): JSX.Element | null {
  const format = useFormat();
  const actions = usePersonActions();
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const stopMock = startMockRealtime();
    const unsubscribe = realtimeService.subscribe((event) => {
      if (event.type === 'tree:updated') {
        setNotice({ reason: event.reason, personId: event.personId });
      }
    });
    return () => {
      stopMock();
      unsubscribe();
    };
  }, []);

  if (!notice) return null;

  return (
    <div className={styles.syncBanner} role="status">
      <span className={styles.syncIcon}>
        <Icon name="bell" size={14} />
      </span>
      <span>{format.t(notice.reason)}</span>
      {notice.personId ? (
        <button
          type="button"
          className={styles.syncAction}
          onClick={() => {
            const id = notice.personId;
            setNotice(null);
            if (id) actions.open(id);
          }}
        >
          {format.t("Ko'rish")}
        </button>
      ) : null}
      <button
        type="button"
        className={styles.syncDismiss}
        aria-label={format.t('Yopish')}
        onClick={() => setNotice(null)}
      >
        <Icon name="close" size={12} />
      </button>
    </div>
  );
}
