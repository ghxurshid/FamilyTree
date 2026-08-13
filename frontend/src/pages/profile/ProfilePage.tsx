import { useNavigate } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { PersonRelationRow } from '@/components/person/PersonRelationRow';
import { ROUTES } from '@/app/config/routes';
import { genderTone } from '@/features/family-tree/lib/format';
import { editableCount } from '@/features/family-tree/lib/permissions';
import { ancestorsOf, childrenOf } from '@/features/family-tree/lib/treeIndex';
import { useCurrentPerson, useCurrentPersonId } from '@/features/auth/useCurrentPerson';
import { usePersonActions } from '@/features/people/usePersonActions';
import { useFormat } from '@/hooks/useFormat';
import { useFamilyTree } from '@/stores/familyTreeStore';
import styles from '../pages.module.css';
import layout from '@/components/layout/layout.module.css';
import ui from '@/components/ui/ui.module.css';

/** "Mening oilam" — foydalanuvchi shajaradagi oddiy shaxs sifatida. */
export function ProfilePage(): JSX.Element {
  const format = useFormat();
  const navigate = useNavigate();
  const actions = usePersonActions();
  const index = useFamilyTree((state) => state.index);
  const me = useCurrentPerson();
  const meId = useCurrentPersonId();

  if (!me || !meId) {
    return (
      <div className={`${layout.screen} ${layout.screenScroll}`}>
        <div className={styles.narrow}>
          <EmptyState
            title={format.t('Profil topilmadi')}
            description={format.t("Hisobingiz shajaradagi shaxsga bog'lanmagan.")}
            action={
              <button type="button" className={ui.btn} onClick={() => navigate(ROUTES.tree)}>
                {format.t('Shajaraga qaytish')}
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const parents = [me.fatherId, me.fatherId ? index.spouseOf[me.fatherId] : null]
    .filter((id): id is string => Boolean(id))
    .map((id) => index.byId[id])
    .filter(Boolean);
  const kids = childrenOf(index, meId).map((id) => index.byId[id]);
  const line = [meId, ...ancestorsOf(index, meId)].reverse().map((id) => index.byId[id]);

  return (
    <div className={`${layout.screen} ${layout.screenScroll}`}>
      <div className={styles.narrow}>
        <div className={styles.profileHead}>
          <Avatar
            initials={format.initials(me)}
            tone="var(--color-accent)"
            size={56}
            bordered
          />
          <div>
            <div className={styles.profileName}>{format.name(me)}</div>
            <div className={styles.profileMeta}>
              {[format.t(me.profession), format.t(me.city), format.generation(me.generation)]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>
        </div>

        <div className={styles.profileActions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary}`}
            onClick={() => actions.open(meId)}
          >
            {format.t("Daraxtda menga o'tish")}
          </button>
          <button type="button" className={ui.btn} onClick={() => navigate(ROUTES.settings)}>
            {format.t('Sozlamalar')}
          </button>
        </div>

        <div className={styles.infoBox}>
          {format.t(`${editableCount(index, meId)} ta yozuvni tahrirlay olasiz`)}
        </div>

        <div className={styles.section}>
          <div className={styles.groupTitle}>{format.t('Ota-onam')}</div>
          {parents.length ? (
            <div className={styles.stack}>
              {parents.map((person) => (
                <PersonRelationRow
                  key={person.id}
                  person={person}
                  name={format.name(person)}
                  initials={format.initials(person)}
                  meta={[format.years(person), format.t(person.city)].filter(Boolean).join(' · ')}
                  onSelect={() => actions.open(person.id)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.note}>{format.t("Ma'lumot kiritilmagan")}</div>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles.groupTitle}>{format.t('Farzandlarim')}</div>
          {kids.length ? (
            <div className={styles.stack}>
              {kids.map((person) => (
                <PersonRelationRow
                  key={person.id}
                  person={person}
                  name={format.name(person)}
                  initials={format.initials(person)}
                  meta={[format.years(person), format.t(person.city)].filter(Boolean).join(' · ')}
                  onSelect={() => actions.open(person.id)}
                />
              ))}
            </div>
          ) : (
            <div className={styles.note}>
              {format.t("Hali farzand qo'shilmagan — daraxtdan qo'shishingiz mumkin")}
            </div>
          )}
          <div className={styles.buttonRow} style={{ marginTop: 9 }}>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnOutline}`}
              onClick={() => actions.add(meId, 'child')}
            >
              {format.t("+ Farzand qo'shish")}
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.groupTitle}>{format.t("To'g'ri chiziq — ajdodlarim")}</div>
          <div className={styles.chipRow}>
            {line.map((person) => (
              <button
                key={person.id}
                type="button"
                className={styles.chip}
                style={{ '--tone': genderTone(person.gender) } as CSSProperties}
                onClick={() => actions.open(person.id)}
              >
                <span className={styles.chipDot} />
                {format.name(person)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
