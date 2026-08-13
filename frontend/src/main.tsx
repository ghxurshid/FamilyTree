import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/app/providers/AppProviders';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { AppRouter } from '@/app/router/AppRouter';
import '@/styles/base.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root topilmadi');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  </StrictMode>,
);
