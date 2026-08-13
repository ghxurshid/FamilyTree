import { useRef } from 'react';
import { TextArea, TextField } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFormat } from '@/hooks/useFormat';
import { familyTreeStore, useFamilyTree } from '@/stores/familyTreeStore';
import { personEditorStore, usePersonEditor } from '@/stores/personEditorStore';
import { toast } from '@/stores/toastStore';
import { ApiError, toUserMessage } from '@/services';
import {
  sanitizeYear,
  toDraft,
  validatePersonForm,
  type PersonFormErrors,
} from '@/features/people/lib/validation';
import type { Gender } from '@/types/person';
import styles from './person.module.css';
import ui from '@/components/ui/ui.module.css';

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Erkak' },
  { value: 'female', label: 'Ayol' },
];

/**
 * Qo'shish va tahrirlash — bitta forma. Daraxt, Odamlar va Profil sahifalari
 * shu komponentni ishlatadi, shuning uchun xatti-harakat hamma joyda bir xil.
 */
export function PersonFormPanel(): JSX.Element {
  const format = useFormat();
  const session = usePersonEditor((state) => state.session);
  const index = useFamilyTree((state) => state.index);
  const panelRef = useRef<HTMLElement>(null);
  useFocusTrap(panelRef, Boolean(session));

  const anchor = session?.anchorId ? index.byId[session.anchorId] : null;
  const target = session?.personId ? index.byId[session.personId] : null;
  const values = session?.values;

  const submit = async () => {
    if (!session || session.busy) return;

    const errors = validatePersonForm(session.values);
    if (Object.keys(errors).length) {
      personEditorStore.setErrors(errors);
      return;
    }

    personEditorStore.setBusy(true);
    const draft = toDraft(session.values);

    try {
      if (session.mode === 'edit' && session.personId) {
        const person = await familyTreeStore.updatePerson({ id: session.personId, ...draft });
        personEditorStore.close();
        toast.success(`${format.name(person)} yangilandi`);
      } else if (session.anchorId) {
        const person = await familyTreeStore.createPerson({
          ...draft,
          anchorId: session.anchorId,
          relation: session.relation,
        });
        personEditorStore.close();
        familyTreeStore.select(person.id);
        toast.success(`${format.name(person)} shajaraga qo'shildi`);
      }
    } catch (error) {
      personEditorStore.setBusy(false);
      if (error instanceof ApiError && Object.keys(error.fields).length) {
        personEditorStore.setErrors(error.fields as PersonFormErrors);
      }
      toast.error(toUserMessage(error));
    }
  };

  const title = session
    ? session.mode === 'edit'
      ? "Ma'lumotni tahrirlash"
      : session.relation === 'spouse'
        ? "Turmush o'rtog'ini qo'shish"
        : "Farzand qo'shish"
    : '';

  const subtitle = session
    ? session.mode === 'edit'
      ? format.name(target)
      : `${session.relation === 'spouse' ? 'Juft: ' : 'Otasi: '}${format.name(anchor)}`
    : '';

  return (
    <aside
      ref={panelRef}
      className={[
        styles.panel,
        styles.panelForm,
        session ? styles.panelOpen : '',
        session?.busy ? styles.panelBusy : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={format.t("Ma'lumot formasi")}
      aria-hidden={!session}
    >
      {session && values ? (
        <>
          <div className={styles.panelHeader}>
            <div className={styles.grabber} />
            <div className={styles.formTitle}>{format.t(title)}</div>
            <div className={styles.formSub}>{format.t(subtitle)}</div>
          </div>

          <form
            className={styles.formBody}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            id="person-form"
          >
            <TextField
              label={format.t("To'liq ism")}
              placeholder={format.t('Masalan: Nodira')}
              value={values.name}
              error={session.errors.name ? format.t(session.errors.name) : undefined}
              autoFocus
              onChange={(event) => personEditorStore.setField('name', event.target.value)}
            />

            <div>
              <span className={ui.fieldLabel}>{format.t('Jinsi')}</span>
              <Segmented
                label={format.t('Jinsi')}
                stretch
                value={values.gender === 'female' ? 'female' : 'male'}
                options={GENDERS.map((option) => ({
                  value: option.value,
                  label: format.t(option.label),
                }))}
                onChange={(gender) => personEditorStore.setField('gender', gender)}
              />
            </div>

            <div className={styles.formRow}>
              <TextField
                label={format.t("Tug'ilgan yil")}
                inputMode="numeric"
                placeholder="1998"
                value={values.birth}
                error={session.errors.birth ? format.t(session.errors.birth) : undefined}
                onChange={(event) =>
                  personEditorStore.setField('birth', sanitizeYear(event.target.value))
                }
              />
              <TextField
                label={format.t('Shahar')}
                placeholder={format.t('Toshkent')}
                value={values.city}
                onChange={(event) => personEditorStore.setField('city', event.target.value)}
              />
            </div>

            {!session.showMore ? (
              <button
                type="button"
                className={styles.moreToggle}
                onClick={personEditorStore.showMore}
              >
                {format.t("+ Qo'shimcha ma'lumot")}
              </button>
            ) : (
              <div className={styles.moreBlock}>
                <TextField
                  label={format.t('Kasbi')}
                  placeholder={format.t("Masalan: o'qituvchi")}
                  value={values.profession}
                  onChange={(event) =>
                    personEditorStore.setField('profession', event.target.value)
                  }
                />
                <TextField
                  label={format.t("Vafot yili (agar bo'lsa)")}
                  inputMode="numeric"
                  placeholder="—"
                  value={values.death}
                  error={session.errors.death ? format.t(session.errors.death) : undefined}
                  onChange={(event) =>
                    personEditorStore.setField('death', sanitizeYear(event.target.value))
                  }
                />
                <TextArea
                  label={format.t('Qisqa biografiya')}
                  rows={4}
                  placeholder={format.t('Hayoti, kasbi, oila haqida bir-ikki jumla…')}
                  value={values.biography}
                  onChange={(event) =>
                    personEditorStore.setField('biography', event.target.value)
                  }
                />
              </div>
            )}
          </form>

          <div className={styles.formFooter}>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnQuiet} ${styles.formCancel}`}
              onClick={personEditorStore.close}
              disabled={session.busy}
            >
              {format.t('Bekor')}
            </button>
            <button
              type="submit"
              form="person-form"
              className={`${ui.btn} ${ui.btnPrimary} ${styles.formSave}`}
              disabled={session.busy}
            >
              {session.busy ? <span className={ui.spinner} /> : null}
              {format.t(
                session.busy
                  ? 'Saqlanmoqda…'
                  : session.mode === 'edit'
                    ? 'Saqlash'
                    : "Qo'shish",
              )}
            </button>
          </div>
        </>
      ) : null}
    </aside>
  );
}
