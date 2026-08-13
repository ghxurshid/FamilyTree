import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';
import { ROUTES } from '@/app/config/routes';
import { ProtectedRoute } from './ProtectedRoute';
import { TreePage } from '@/pages/family-tree/TreePage';
import { PeoplePage } from '@/pages/people/PeoplePage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { AuthPage } from '@/pages/auth/AuthPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to={ROUTES.tree} replace /> },
      { path: 'tree', element: <TreePage /> },
      { path: 'people', element: <PeoplePage /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      { path: 'login', element: <AuthPage mode="login" /> },
      { path: 'register', element: <AuthPage mode="register" /> },
      { path: 'forgot-password', element: <AuthPage mode="forgot" /> },
      { path: 'reset-password', element: <AuthPage mode="reset" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter(): JSX.Element {
  return <RouterProvider router={router} />;
}
