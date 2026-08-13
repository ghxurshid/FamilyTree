import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/app/config/routes';
import { useAuth } from '@/stores/authStore';

interface ProtectedRouteProps {
  children: ReactNode;
}

/** Kirishni talab qiluvchi sahifalar. Shajaraning o'zi ochiq qoladi. */
export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element | null {
  const status = useAuth((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') return null;
  if (status !== 'authenticated') {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
