import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { genderTone } from '@/features/family-tree/lib/format';
import { relationLabel } from '@/features/family-tree/lib/relations';
import { useCurrentPersonId } from '@/features/auth/useCurrentPerson';
import { usePersonActions } from '@/features/people/usePersonActions';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFormat } from '@/hooks/useFormat';
import { useFamilyTree } from '@/stores/familyTreeStore';
import { searchStore, useSearch } from '@/stores/searchStore';
import styles from './search.module.css';
import ui from '@/components/ui/ui.module.css';

/** Global qidiruv — `/` bilan ochiladi, klaviatura bilan boshqariladi. */
export function SearchCommand(): JSX.Element | null {
  const format = useFormat();
  const actions = usePersonActions();
  const index = useFamilyTree((state) => state.index);
  const meId = useCurrentPersonId();

  const open = useSearch((state) => state.open);
  const query = useSearch((state) => state.query);
  const results = useSearch((state) => state.results);
  const highlight = useSearch((state) => state.highlight);
  const loading = useSearch((state) => state.loading);

  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const choose = (id: string) => {
    searchStore.close();
    actions.open(id);
  };

  return (
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) searchStore.close();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={format.t('Qidiruv')}
      >
        <div className={styles.header}>
          <Icon name="search" size={17} />
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            placeholder={format.t('Ism, kasb, shahar yoki yil…')}
            aria-label={format.t('Qidirish')}
            onChange={(event) => searchStore.setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                searchStore.moveHighlight(1);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                searchStore.moveHighlight(-1);
              } else if (event.key === 'Enter') {
                const person = searchStore.highlighted();
                if (person) choose(person.id);
              } else if (event.key === 'Escape') {
                searchStore.close();
              }
            }}
          />
          <kbd className={styles.kbd}>Esc</kbd>
        </div>

        <div className={styles.results}>
          {results.map((person, i) => (
            <button
              key={person.id}
              type="button"
              className={[styles.result, i === highlight ? styles.resultActive : '']
                .filter(Boolean)
                .join(' ')}
              onMouseEnter={() => searchStore.setState({ highlight: i })}
              onClick={() => choose(person.id)}
            >
              <Avatar
                initials={format.initials(person)}
                tone={genderTone(person.gender)}
                size={32}
              />
              <span className={styles.resultBody}>
                <span className={styles.resultName}>{format.name(person)}</span>
                <span className={styles.resultMeta}>
                  {[format.years(person), format.t(person.city), format.t(person.profession)]
                    .filter(Boolean)
                    .join(' · ') || format.generation(person.generation)}
                </span>
              </span>
              <span className={styles.resultSide}>
                {meId ? (
                  <span className={styles.resultRelation}>
                    {format.t(relationLabel(index, meId, person.id))}
                  </span>
                ) : null}
                <span className={styles.resultGen}>{format.generation(person.generation)}</span>
              </span>
            </button>
          ))}

          {loading && !results.length ? (
            <div className={styles.loading}>
              <span className={ui.spinner} />
            </div>
          ) : null}

          {!loading && query.trim() && !results.length ? (
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>{format.t('Hech kim topilmadi')}</div>
              <div className={styles.emptyText}>
                {format.t("Ismning bir qismini, kasbni yoki tug'ilgan yilni yozib ko'ring.")}
              </div>
            </div>
          ) : null}

          {!query.trim() ? (
            <div className={styles.hint}>
              <div>
                {format.t('↑ ↓ — tanlash · Enter — kameraga olib borish · Esc — yopish')}
              </div>
              <div>{format.t('Masalan: «Karim», «mirob», «Gurlan», «1924»')}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
