export const ROUTES = {
  home: '/',
  tree: '/tree',
  people: '/people',
  profile: '/profile',
  settings: '/settings',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/** Daraxtdagi odamga chuqur havola. */
export const treeLink = (personId: string): string =>
  `${ROUTES.tree}?person=${encodeURIComponent(personId)}`;

export const AUTH_ROUTES: string[] = [
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
];
