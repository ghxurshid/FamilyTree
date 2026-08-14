import { useMemo } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { ageOf, genderTone } from '@/features/family-tree/lib/format';
import { relationGroups, relationLabel } from '@/features/family-tree/lib/relations';
import {
  ancestorsOf,
  carrierOf,
  descendantCount,
} from '@/features/family-tree/lib/treeIndex';
import { useCanEdit, useCurrentPersonId } from '@/features/auth/useCurrentPerson';
import { usePersonActions } from '@/features/people/usePersonActions';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { useFormat } from '@/hooks/useFormat';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { familyTreeStore, useFamilyTree } from '@/stores/familyTreeStore';
import { useAuth } from '@/stores/authStore';
import { PersonRelationRow } from './PersonRelationRow';
import styles from './person.module.css';
import ui from '@/components/ui/ui.module.css';

/**
 * Tanlangan odam haqidagi panel — desktopda o'ng yon panel, mobilda pastki
 * varaq. Ma'lumot store'dan olinadi, daraxt bilan bir manba.
 *
 * Mobil varaq ikki nuqtada to'xtaydi: `peek` — ekranning pastki ~22% i (faqat
 * sarlavha ko'rinadi), `full` — hozirgidek katta panel. Tutqichdan sudrash yoki
 * bosish nuqtalar orasida almashtiradi.
 */
export function PersonDetailPanel(): JSX.Element {
  const format = useFormat();
  const actions = usePersonActions();
  const canEdit = useCanEdit();
  const isMobile = useIsMobile();

  const open = useFamilyTree((state) => state.panelOpen);
  const snap = useFamilyTree((state) => state.panelSnap);
  const selectedId = useFamilyTree((state) => state.selectedId);
  const index = useFamilyTree((state) => state.index);
  const meId = useCurrentPersonId();
  const authenticated = useAuth((state) => state.status === 'authenticated');

  const person = selectedId ? index.byId[selectedId] ?? null : null;
  const visible = open && Boolean(person);
  const peeking = isMobile && snap === 'peek';

  const sheet = useBottomSheet({
    enabled: isMobile,
    open: visible,
    snap,
    onSnap: familyTreeStore.setPanelSnap,
    onClose: familyTreeStore.closePanel,
  });

  const groups = useMemo(
    () => (person ? relationGroups(index, person.id) : []),
    [index, person],
  );

  const facts = useMemo(() => {
    if (!person) return [];
    const age = ageOf(person);
    return [
      { label: "Tug'ilgan", value: person.birthYear ? String(person.birthYear) : '—' },
      {
        label: person.deathYear ? 'Vafot etgan' : 'Yoshi',
        value: person.deathYear
          ? String(person.deathYear)
          : age
            ? format.t(`${age} yosh`)
            : '—',
      },
      { label: 'Shahar', value: format.t(person.city || '—') },
      { label: 'Kasbi', value: format.t(person.profession || '—') },
      { label: 'Avlod', value: format.generation(person.generation) },
      {
        label: 'Sizga nisbatan',
        value: meId
          ? format.t(relationLabel(index, meId, person.id))
          : format.t("Kirsangiz ko'rinadi"),
      },
    ];
  }, [format, index, meId, person]);

  const carrier = person ? carrierOf(index, person.id) : null;
  const editable = canEdit(person?.id ?? null);
  const tone = person ? genderTone(person.gender) : 'var(--hair)';

  return (
    <aside
      ref={sheet.ref}
      {...sheet.rootProps}
      className={[
        styles.panel,
        visible ? styles.panelOpen : '',
        sheet.dragging ? styles.sheetDragging : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={format.t("Shaxs ma'lumotlari")}
      aria-hidden={!visible}
    >
      {person ? (
        <>
          <div className={styles.panelHeader} data-sheet-handle>
            <button
              type="button"
              className={styles.grabber}
              data-sheet-grip
              aria-label={format.t(peeking ? 'Panelni kengaytirish' : 'Panelni kichraytirish')}
              aria-expanded={!peeking}
              onClick={() => familyTreeStore.setPanelSnap(peeking ? 'full' : 'peek')}
            />
            <button
              type="button"
              className={ui.closeBtn}
              aria-label={format.t('Yopish')}
              onClick={familyTreeStore.closePanel}
            >
              <Icon name="close" size={12} />
            </button>

            <div className={styles.panelIdentity}>
              <Avatar initials={format.initials(person)} tone={tone} size={52} bordered />
              <div style={{ minWidth: 0 }}>
                <div className={styles.panelName}>{format.name(person)}</div>
                <div className={styles.panelRelation}>
                  {meId
                    ? format.t(relationLabel(index, meId, person.id))
                    : [format.generation(person.generation), format.t(person.profession || person.city)]
                        .filter(Boolean)
                        .join(' · ')}
                </div>
              </div>
            </div>

            <div className={styles.panelBadges}>
              <span
                className={[styles.statusBadge, person.deathYear ? styles.statusBadgeGone : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {format.t(person.deathYear ? 'Vafot etgan' : 'Tirik')}
              </span>
              <button
                type="button"
                className={styles.ghostChip}
                onClick={() => familyTreeStore.requestFocus(person.id, 1.05)}
              >
                {format.t('Kartaga fokus')}
              </button>
            </div>
          </div>

          <div
            className={[styles.panelBody, peeking ? styles.panelBodyPeek : '']
              .filter(Boolean)
              .join(' ')}
          >
            <div className={styles.factGrid}>
              {facts.map((fact) => (
                <div key={fact.label} className={styles.fact}>
                  <div className={styles.factLabel}>{format.t(fact.label)}</div>
                  <div className={styles.factValue}>{fact.value}</div>
                </div>
              ))}
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>{format.t('Biografiya')}</div>
              {person.biography ? (
                <p className={styles.bio}>{format.t(person.biography)}</p>
              ) : (
                <div className={styles.bioEmpty}>
                  <span>
                    {format.t("Ma'lumot hali qo'shilmagan. Oila a'zolari to'ldirishi mumkin.")}
                  </span>
                </div>
              )}
            </div>

            {groups.map((group) => (
              <div key={group.title} className={styles.section}>
                <div className={styles.sectionTitle}>{format.t(group.title)}</div>
                <div className={styles.relationList}>
                  {group.ids.map((id) => {
                    const relative = index.byId[id];
                    if (!relative) return null;
                    return (
                      <PersonRelationRow
                        key={id}
                        person={relative}
                        name={format.name(relative)}
                        initials={format.initials(relative)}
                        meta={[
                          meId
                            ? format.t(relationLabel(index, meId, id))
                            : format.t(relative.profession || relative.city),
                          relative.birthYear ? String(relative.birthYear) : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                        onSelect={() => familyTreeStore.select(id)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            <div className={styles.countRow}>
              <div className={styles.countCard}>
                <div className={styles.factLabel}>{format.t('Ajdodlari')}</div>
                <div className={styles.countValue}>{ancestorsOf(index, person.id).length}</div>
              </div>
              <div className={styles.countCard}>
                <div className={styles.factLabel}>{format.t('Avlodlari')}</div>
                <div className={styles.countValue}>
                  {carrier ? descendantCount(index, carrier) : 0}
                </div>
              </div>
            </div>

            {editable ? (
              <div className={styles.actions}>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnOutline}`}
                  onClick={() => actions.edit(person.id)}
                >
                  {format.t('Tahrirlash')}
                </button>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  onClick={() => actions.add(person.id, 'child')}
                >
                  {format.t('+ Farzand')}
                </button>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnQuiet}`}
                  onClick={() => actions.add(person.id, 'spouse')}
                >
                  {format.t("+ Turmush o'rtoq")}
                </button>
              </div>
            ) : (
              <div className={styles.lockNote}>
                <Icon name="lock" size={14} />
                <span>
                  {format.t(
                    authenticated
                      ? "Faqat o'zingiz va avlodlaringizni tahrirlaysiz"
                      : 'Tahrirlash uchun tizimga kiring',
                  )}
                </span>
              </div>
            )}
          </div>
        </>
      ) : null}
    </aside>
  );
}
