import { familyTreeService, personService, realtimeService } from '@/services';
import { toUserMessage } from '@/services/apiError';
import {
  ancestorsOf,
  buildTreeIndex,
  carrierOf,
  isDescendantOf,
  type TreeIndex,
} from '@/features/family-tree/lib/treeIndex';
import type {
  CreatePersonInput,
  FamilyMeta,
  Person,
  PersonId,
  UpdatePersonInput,
} from '@/types/person';
import type { TreeViewMode } from '@/types/ui';
import { createStore, useStore } from './createStore';

export type TreeStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Kameraga "shu odamga uch" degan so'rov — kanvas shu belgiga javob beradi. */
export interface FocusRequest {
  personId: PersonId;
  token: number;
  zoom?: number;
}

interface FamilyTreeState {
  status: TreeStatus;
  error: string | null;
  family: FamilyMeta;
  generations: number;
  people: Person[];
  index: TreeIndex;
  /** Shajaradagi "men" — autentifikatsiya shu shaxsga bog'lanadi. */
  meId: PersonId | null;
  selectedId: PersonId | null;
  panelOpen: boolean;
  collapsed: ReadonlySet<PersonId>;
  viewMode: TreeViewMode;
  focusRequest: FocusRequest | null;
  /** Yozuv saqlanayotganda kartaga qo'yiladigan optimistik belgi. */
  savingIds: ReadonlySet<PersonId>;
}

const EMPTY_INDEX = buildTreeIndex([]);

const store = createStore<FamilyTreeState>({
  status: 'idle',
  error: null,
  family: { name: 'Oila', nameCyr: 'Оила', place: '' },
  generations: 0,
  people: [],
  index: EMPTY_INDEX,
  meId: null,
  selectedId: null,
  panelOpen: false,
  collapsed: new Set(),
  viewMode: 'all',
  focusRequest: null,
  savingIds: new Set(),
});

let focusToken = 0;

/** Boshlanish holati: faqat "men"gacha bo'lgan chiziq ochiq turadi. */
function collapsedForLine(index: TreeIndex, meId: PersonId | null): Set<PersonId> {
  const open = new Set<PersonId>();
  if (meId) {
    open.add(meId);
    for (const ancestor of ancestorsOf(index, meId)) open.add(ancestor);
  }
  return new Set(Object.keys(index.childrenOf).filter((id) => !open.has(id)));
}

function reindex(people: Person[]): Pick<FamilyTreeState, 'people' | 'index'> {
  return { people, index: buildTreeIndex(people) };
}

function withSaving(id: PersonId, on: boolean) {
  const next = new Set(store.getState().savingIds);
  if (on) next.add(id);
  else next.delete(id);
  store.setState({ savingIds: next });
}

export const familyTreeStore = {
  ...store,

  async load() {
    store.setState({ status: 'loading', error: null });
    try {
      const snapshot = await familyTreeService.getTree();
      const index = buildTreeIndex(snapshot.people);
      store.setState({
        status: 'ready',
        family: snapshot.family,
        generations: snapshot.generations,
        people: snapshot.people,
        index,
        meId: snapshot.meId,
        collapsed: collapsedForLine(index, snapshot.meId),
      });
    } catch (error) {
      store.setState({ status: 'error', error: toUserMessage(error) });
    }
  },

  /** Tanlash: kerak bo'lsa yashiringan shoxni ochadi va kamerani so'raydi. */
  select(id: PersonId | null, options: { fly?: boolean; zoom?: number } = {}) {
    const { index, collapsed } = store.getState();
    if (!id) {
      store.setState({ selectedId: null, panelOpen: false });
      return;
    }

    let nextCollapsed = collapsed;
    const hidden = [...collapsed].filter(
      (node) => node === id || isDescendantOf(index, node, id),
    );
    if (hidden.length) {
      const next = new Set(collapsed);
      for (const node of hidden) next.delete(node);
      nextCollapsed = next;
    }

    focusToken += 1;
    store.setState({
      selectedId: id,
      panelOpen: true,
      collapsed: nextCollapsed,
      focusRequest:
        options.fly === false
          ? store.getState().focusRequest
          : { personId: id, token: focusToken, zoom: options.zoom },
    });
  },

  /** Kamerani ko'chirish uchun alohida so'rov (tanlovni o'zgartirmaydi). */
  requestFocus(id: PersonId, zoom?: number) {
    focusToken += 1;
    store.setState({ focusRequest: { personId: id, token: focusToken, zoom } });
  },

  closePanel() {
    store.setState({ panelOpen: false, selectedId: null });
  },

  toggleCollapse(id: PersonId) {
    const next = new Set(store.getState().collapsed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    store.setState({ collapsed: next });
  },

  expandAll() {
    store.setState({ collapsed: new Set() });
  },

  collapseToLine() {
    const { index, meId } = store.getState();
    store.setState({ collapsed: collapsedForLine(index, meId) });
  },

  setViewMode(viewMode: TreeViewMode) {
    store.setState({ viewMode });
  },

  async createPerson(input: CreatePersonInput): Promise<Person> {
    withSaving(input.anchorId, true);
    try {
      const { person, affected } = await personService.createPerson(input);
      // Avval yondosh o'zgarishlar (masalan, juftning qarshi bog'lanishi).
      for (const related of affected) familyTreeStore.applyPerson(related);
      familyTreeStore.applyPerson(person);
      realtimeService.publish({ type: 'person:created', person });
      return person;
    } finally {
      withSaving(input.anchorId, false);
    }
  },

  async updatePerson(input: UpdatePersonInput): Promise<Person> {
    withSaving(input.id, true);
    try {
      const { person, affected } = await personService.updatePerson(input);
      for (const related of affected) familyTreeStore.applyPerson(related);
      familyTreeStore.applyPerson(person);
      realtimeService.publish({ type: 'person:updated', person });
      return person;
    } finally {
      withSaving(input.id, false);
    }
  },

  /** Serverdan yoki real-time kanalidan kelgan yozuvni holatga singdiradi. */
  applyPerson(person: Person) {
    const { people, collapsed } = store.getState();
    const existing = people.findIndex((candidate) => candidate.id === person.id);
    const nextPeople =
      existing >= 0
        ? people.map((candidate, i) => (i === existing ? person : candidate))
        : [...people, person];

    const patch: Partial<FamilyTreeState> = reindex(nextPeople);

    // Yangi farzand qo'shilganda otasining shoxi ochiq bo'lishi kerak.
    const anchor = person.spouseOf ?? person.fatherId;
    if (existing < 0 && anchor && collapsed.has(anchor)) {
      const next = new Set(collapsed);
      next.delete(anchor);
      patch.collapsed = next;
    }
    store.setState(patch);
  },

  removePerson(id: PersonId) {
    const { people, selectedId } = store.getState();
    store.setState({
      ...reindex(people.filter((person) => person.id !== id)),
      selectedId: selectedId === id ? null : selectedId,
      panelOpen: selectedId === id ? false : store.getState().panelOpen,
    });
  },

  /** Tanlangan odamning shox egasi — juftlar otasining kartasiga bog'lanadi. */
  selectedCarrier(): PersonId | null {
    const { selectedId, index } = store.getState();
    return selectedId ? carrierOf(index, selectedId) : null;
  },
};

export function useFamilyTree<S>(selector: (state: FamilyTreeState) => S): S {
  return useStore(store, selector);
}

export type { FamilyTreeState };
