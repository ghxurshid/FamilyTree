import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { genderTone } from '@/features/family-tree/lib/format';
import type { Person } from '@/types/person';
import styles from './person.module.css';

interface PersonRelationRowProps {
  person: Person;
  name: string;
  initials: string;
  meta: string;
  onSelect(): void;
}

/** Panel va profil ro'yxatlaridagi qatorlar — bitta komponent. */
export function PersonRelationRow({
  person,
  name,
  initials,
  meta,
  onSelect,
}: PersonRelationRowProps): JSX.Element {
  return (
    <button type="button" className={styles.relationRow} onClick={onSelect}>
      <Avatar initials={initials} tone={genderTone(person.gender)} size={28} />
      <span className={styles.relationBody}>
        <span className={styles.relationName}>{name}</span>
        {meta ? <span className={styles.relationMeta}>{meta}</span> : null}
      </span>
      <span className={styles.relationArrow}>
        <Icon name="arrow-right" size={12} />
      </span>
    </button>
  );
}
