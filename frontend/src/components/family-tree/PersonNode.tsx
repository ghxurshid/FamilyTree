import { memo, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { genderTone } from '@/features/family-tree/lib/format';
import type { TreeNodeModel } from '@/features/family-tree/lib/nodes';
import type { PersonId } from '@/types/person';
import styles from './tree.module.css';

interface PersonNodeProps {
  model: TreeNodeModel;
  name: string;
  years: string;
  relation: string;
  ariaLabel: string;
  addLabel: string;
  toggleLabel: string;
  /** "Siz" belgisi — tanlangan alifboda. */
  meLabel: string;
  onSelect(id: PersonId): void;
  onAdd(id: PersonId): void;
  onToggle(id: PersonId): void;
}

/**
 * Yagona shaxs kartasi — daraxtdagi barcha holatlar (erkak/ayol, tanlangan,
 * juft, tahrirlanadigan, yangi qo'shilgan) shu bitta komponentda.
 */
function PersonNodeImpl({
  model,
  name,
  years,
  relation,
  ariaLabel,
  addLabel,
  toggleLabel,
  meLabel,
  onSelect,
  onAdd,
  onToggle,
}: PersonNodeProps): JSX.Element {
  const { person } = model;
  const tone =
    model.isSelected || model.onPath || model.isMe
      ? 'var(--color-accent)'
      : genderTone(person.gender);

  const wrapperStyle: CSSProperties = {
    transform: `translate3d(${model.x}px, ${model.y}px, 0)`,
    width: model.width,
    height: model.height,
    zIndex: model.zIndex,
  };

  const cardClass = [
    styles.card,
    model.isSelected ? styles.cardSelected : '',
    model.onPath ? styles.cardOnPath : '',
    model.isSpouse ? (model.spouseActive ? styles.cardSpouseActive : styles.cardSpouse) : '',
    person.isNew ? styles.cardNew : '',
  ]
    .filter(Boolean)
    .join(' ');

  const nameClass = [
    styles.cardName,
    model.isSpouse ? styles.cardNameSpouse : '',
    !model.isSpouse && !model.showRelation ? styles.cardNameLarge : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    onSelect(person.id);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(person.id);
    }
  };

  return (
    <div
      className={[
        styles.node,
        model.dimmed ? styles.nodeDimmed : '',
        model.isSpouse && !model.spouseActive ? styles.nodeSpouseIdle : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={wrapperStyle}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-pressed={model.isSelected}
        className={cardClass}
        style={{ '--tone': tone } as CSSProperties}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.toneBar} />

        {model.showAvatar ? (
          <Avatar
            initials={name.charAt(0).toUpperCase()}
            tone={genderTone(person.gender)}
            size={model.isSpouse ? 30 : 34}
            bordered
          />
        ) : null}

        <div
          className={[styles.cardBody, model.isSpouse && !model.spouseActive ? styles.cardBodyRight : '']
            .filter(Boolean)
            .join(' ')}
        >
          <div className={nameClass}>{name}</div>
          {model.showMeta && years ? <div className={styles.cardYears}>{years}</div> : null}
          {model.showRelation && relation ? (
            <div className={styles.cardRelation}>
              <span className={styles.cardRelationDot} />
              <span
                className={[styles.cardRelationText, model.isMe ? styles.cardRelationMe : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {relation}
              </span>
            </div>
          ) : null}
        </div>

        {model.showStatus ? (
          <div className={styles.cardStatus}>
            {model.isMe ? <span className={styles.meBadge}>{meLabel}</span> : null}
            <span
              className={[styles.statusDot, person.deathYear ? styles.statusDotGone : '']
                .filter(Boolean)
                .join(' ')}
            />
          </div>
        ) : null}

        {model.editable && model.isSelected && !model.isSpouse ? (
          <button
            type="button"
            className={styles.addButton}
            aria-label={addLabel}
            onClick={(event) => {
              event.stopPropagation();
              onAdd(person.id);
            }}
          >
            <Icon name="plus" size={12} />
          </button>
        ) : null}

        {model.saving ? <span className={styles.savingBar} /> : null}
      </div>

      {model.childCount > 0 && !model.isSpouse && model.showRelation ? (
        <button
          type="button"
          className={[styles.collapseButton, model.collapsed ? styles.collapseButtonOn : '']
            .filter(Boolean)
            .join(' ')}
          aria-label={toggleLabel}
          aria-expanded={!model.collapsed}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(person.id);
          }}
        >
          {model.collapsed ? (
            <>
              <Icon name="plus" size={9} />
              {model.collapsedCount}
            </>
          ) : (
            <Icon name="minus" size={11} />
          )}
        </button>
      ) : null}
    </div>
  );
}

export const PersonNode = memo(PersonNodeImpl);
