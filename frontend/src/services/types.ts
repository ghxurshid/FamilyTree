import type {
  AuthSession,
  LoginCredentials,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/types/auth';
import type {
  CreatePersonInput,
  FamilyTreeSnapshot,
  Person,
  PersonId,
  UpdatePersonInput,
} from '@/types/person';

/**
 * Servis shartnomalari. Mock va real amalga oshirishlar bir xil interfeysga
 * ega — UI'ni o'zgartirmasdan backendga ulanadi.
 */
export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(payload: RegisterPayload): Promise<AuthSession>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  resetPassword(payload: ResetPasswordPayload): Promise<void>;
  restoreSession(): Promise<AuthSession | null>;
}

export interface FamilyTreeService {
  getTree(): Promise<FamilyTreeSnapshot>;
}

/**
 * Yozuv o'zgarishi natijasi. Ba'zi amallar bir nechta yozuvga tegadi —
 * masalan, juft qo'shilganda uning juftida ham qarshi bog'lanish paydo
 * bo'ladi. Server o'zgartirgan hamma narsa `affected` orqali qaytadi.
 */
export interface PersonMutationResult {
  person: Person;
  affected: Person[];
}

export interface PersonService {
  getPerson(id: PersonId): Promise<Person>;
  createPerson(input: CreatePersonInput): Promise<PersonMutationResult>;
  updatePerson(input: UpdatePersonInput): Promise<PersonMutationResult>;
  deletePerson(id: PersonId): Promise<void>;
}

export interface SearchService {
  searchPeople(query: string, limit?: number): Promise<Person[]>;
}

/** Kelajakdagi real-time uchun tayyor hodisalar. */
export type TreeEvent =
  | { type: 'person:created'; person: Person }
  | { type: 'person:updated'; person: Person }
  | { type: 'person:deleted'; id: PersonId }
  | {
      type: 'tree:updated';
      /** Foydalanuvchiga ko'rsatiladigan sabab. */
      reason: string;
      /** "Ko'rish" tugmasi olib boradigan odam. */
      personId?: PersonId;
    };

export interface RealtimeService {
  subscribe(listener: (event: TreeEvent) => void): () => void;
  publish(event: TreeEvent): void;
}
