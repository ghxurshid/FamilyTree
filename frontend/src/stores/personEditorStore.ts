import type { NewPersonRelation, Person, PersonId } from '@/types/person';
import {
  emptyPersonForm,
  type PersonFormErrors,
  type PersonFormValues,
} from '@/features/people/lib/validation';
import { createStore, useStore } from './createStore';

export type EditorMode = 'add' | 'edit';

interface EditorSession {
  mode: EditorMode;
  /** `edit` rejimida — tahrirlanayotgan odam. */
  personId: PersonId | null;
  /** `add` rejimida — kimga nisbatan qo'shilyapti. */
  anchorId: PersonId | null;
  relation: NewPersonRelation;
  values: PersonFormValues;
  errors: PersonFormErrors;
  showMore: boolean;
  busy: boolean;
}

interface EditorState {
  session: EditorSession | null;
}

const store = createStore<EditorState>({ session: null });

export const personEditorStore = {
  ...store,

  startAdd(anchor: Person, relation: NewPersonRelation = 'child') {
    store.setState({
      session: {
        mode: 'add',
        personId: null,
        anchorId: anchor.id,
        relation,
        values: emptyPersonForm(anchor.city),
        errors: {},
        showMore: false,
        busy: false,
      },
    });
  },

  startEdit(person: Person) {
    store.setState({
      session: {
        mode: 'edit',
        personId: person.id,
        anchorId: null,
        relation: 'child',
        values: {
          name: person.name,
          gender: person.gender,
          birth: person.birthYear ? String(person.birthYear) : '',
          death: person.deathYear ? String(person.deathYear) : '',
          city: person.city,
          profession: person.profession,
          biography: person.biography,
        },
        errors: {},
        showMore: Boolean(person.biography || person.deathYear || person.profession),
        busy: false,
      },
    });
  },

  setField<K extends keyof PersonFormValues>(key: K, value: PersonFormValues[K]) {
    const { session } = store.getState();
    if (!session) return;
    const errors = { ...session.errors };
    delete errors[key];
    store.setState({
      session: { ...session, errors, values: { ...session.values, [key]: value } },
    });
  },

  setErrors(errors: PersonFormErrors) {
    const { session } = store.getState();
    if (!session) return;
    store.setState({ session: { ...session, errors } });
  },

  showMore() {
    const { session } = store.getState();
    if (session) store.setState({ session: { ...session, showMore: true } });
  },

  setBusy(busy: boolean) {
    const { session } = store.getState();
    if (session) store.setState({ session: { ...session, busy } });
  },

  close() {
    store.setState({ session: null });
  },
};

export function usePersonEditor<S>(selector: (state: EditorState) => S): S {
  return useStore(store, selector);
}

export type { EditorSession };
