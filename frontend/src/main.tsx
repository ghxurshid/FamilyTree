import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from '@/app/providers/AppProviders';
import { ErrorBoundary } from '@/app/providers/ErrorBoundary';
import { AppRouter } from '@/app/router/AppRouter';
import { initTelegram } from '@/services/telegram';
import '@/styles/base.css';

// Telegram ichida bo'lsak — brauzercha to'liq balandlikka yoyiladi va swipe
// himoyasi yoqiladi; ikkovi ham birinchi renderdan oldin bo'lishi kerak.
initTelegram();

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
