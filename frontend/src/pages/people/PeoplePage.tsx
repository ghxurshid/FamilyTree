import { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Segmented } from '@/components/ui/Segmented';
import { genderTone } from '@/features/family-tree/lib/format';
import { relationLabel } from '@/features/family-tree/lib/relations';
import { countByGeneration } from '@/features/family-tree/lib/treeIndex';
import { filterDirectory, type DirectorySort } from '@/features/family-tree/lib/search';
import { useCurrentPersonId } from '@/features/auth/useCurrentPerson';
import { usePersonActions } from '@/features/people/usePersonActions';
import { useFormat } from '@/hooks/useFormat';
import { useFamilyTree } from '@/stores/familyTreeStore';
import styles from '../pages.module.css';
import layout from '@/components/layout/layout.module.css';
import ui from '@/components/ui/ui.module.css';

const GENDERS = [
  { value: 'all', label: 'Hammasi' },
  { value: 'male', label: 'Erkak' },
  { value: 'female', label: 'Ayol' },
] as const;

/** Odamlar katalogi — daraxt bilan bitta normallashtirilgan modeldan. */
export function PeoplePage(): JSX.Element {
  const format = useFormat();
  const actions = usePersonActions();

  const people = useFamilyTree((state) => state.people);
  const index = useFamilyTree((state) => state.index);
  const status = useFamilyTree((state) => state.status);
  const meId = useCurrentPersonId();

  const [query, setQuery] = useState('');
  const [generation, setGeneration] = useState('all');
  const [gender, setGender] = useState<string>('all');
  const [sort, setSort] = useState<DirectorySort>('gen');

  const rows = useMemo(
    () => filterDirectory(people, { query, generation, gender, sort }),
    [gender, generation, people, query, sort],
  );

  const generationOptions = useMemo(() => {
    const counts = [...countByGeneration(index).entries()].sort((a, b) => a[0] - b[0]);
    return [
      { value: 'all', label: format.t('Barcha avlodlar') },
      ...counts.map(([gen, count]) => ({
        value: String(gen),
        label: format.t(`${gen}-avlod · ${count} kishi`),
      })),
    ];
  }, [format, index]);

  return (
    <div className={`${layout.screen} ${layout.screenColumn}`}>
      <div className={styles.directoryHeader}>
        <h1 className={styles.pageTitle}>{format.t('Odamlar')}</h1>
        <div className={styles.pageSub}>
          {format.t(`${rows.length} ta natija · jami ${people.length}`)}
        </div>

        <div className={styles.filters}>
          <input
            className={`${ui.input} ${styles.filterSearch}`}
            value={query}
            placeholder={format.t('Qidirish…')}
            aria-label={format.t('Odamlar orasidan qidirish')}
            onChange={(event) => setQuery(event.target.value)}
          />

          <select
            className={ui.input}
            style={{ width: 'auto' }}
            value={generation}
            aria-label={format.t('Avlod')}
            onChange={(event) => setGeneration(event.target.value)}
          >
            {generationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <Segmented
            label={format.t('Jinsi')}
            value={gender}
            options={GENDERS.map((option) => ({
              value: option.value,
              label: format.t(option.label),
            }))}
            onChange={setGender}
          />

          <select
            className={ui.input}
            style={{ width: 'auto' }}
            value={sort}
            aria-label={format.t('Tartib')}
            onChange={(event) => setSort(event.target.value as DirectorySort)}
          >
            <option value="gen">{format.t("Avlod bo'yicha")}</option>
            <option value="name">{format.t("Ism bo'yicha")}</option>
            <option value="birth">{format.t("Yil bo'yicha")}</option>
          </select>
        </div>
      </div>

      <div className={styles.directoryBody}>
        {status === 'loading' ? (
          <div className={styles.directoryGrid}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className={`${ui.skeleton} ${styles.skeletonCard}`} />
            ))}
          </div>
        ) : rows.length ? (
          <div className={styles.directoryGrid}>
            {rows.map((person) => (
              <button
                key={person.id}
                type="button"
                className={styles.directoryCard}
                onClick={() => actions.open(person.id)}
              >
                <Avatar
                  initials={format.initials(person)}
                  tone={genderTone(person.gender)}
                  size={36}
                  bordered
                />
                <span className={styles.directoryBody2}>
                  <span className={styles.directoryName}>{format.name(person)}</span>
                  <span className={styles.directoryMeta}>
                    {[format.years(person), format.t(person.profession), format.t(person.city)]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </span>
                </span>
                <span className={styles.directorySide}>
                  {meId ? (
                    <span className={styles.directoryRelation}>
                      {format.t(relationLabel(index, meId, person.id))}
                    </span>
                  ) : null}
                  <span className={styles.directoryGen}>
                    {format.generation(person.generation)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            title={format.t('Hech kim topilmadi')}
            description={format.t("Filtrlarni yumshatib ko'ring yoki boshqa ism kiriting.")}
          />
        )}
      </div>
    </div>
  );
}
