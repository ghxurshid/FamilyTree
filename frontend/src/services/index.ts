import { env } from '@/app/config/env';
import { mockAuthService } from './mock/authService.mock';
import {
  mockFamilyTreeService,
  mockPersonService,
  mockSearchService,
} from './mock/familyTreeService.mock';
import { httpAuthService } from './rest/authService.http';
import {
  httpFamilyTreeService,
  httpPersonService,
  httpSearchService,
} from './rest/familyTreeService.http';
import type {
  AuthService,
  FamilyTreeService,
  PersonService,
  SearchService,
} from './types';

/**
 * Yagona kirish nuqtasi. `VITE_USE_MOCK_API` bayrog'i mock va real
 * amalga oshirish orasida almashtiradi — interfeys bir xil.
 */
export const authService: AuthService = env.useMockApi ? mockAuthService : httpAuthService;
export const familyTreeService: FamilyTreeService = env.useMockApi
  ? mockFamilyTreeService
  : httpFamilyTreeService;
export const personService: PersonService = env.useMockApi
  ? mockPersonService
  : httpPersonService;
export const searchService: SearchService = env.useMockApi
  ? mockSearchService
  : httpSearchService;

export { realtimeService } from './realtimeService';
export { ApiError, toUserMessage } from './apiError';
export type * from './types';
