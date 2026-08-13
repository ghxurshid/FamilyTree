/** Muhit sozlamalari — bitta joyda. Hech qanday URL kodga yozilmaydi. */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  useMockApi: (import.meta.env.VITE_USE_MOCK_API ?? 'true') !== 'false',
  mockLatency: Number(import.meta.env.VITE_MOCK_LATENCY ?? 420),
  isDev: import.meta.env.DEV,
} as const;
