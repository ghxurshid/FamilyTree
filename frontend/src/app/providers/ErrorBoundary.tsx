import { Component, type ErrorInfo, type ReactNode } from 'react';
import ui from '@/components/ui/ui.module.css';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Oxirgi himoya chizig'i — oq ekran o'rniga tushunarli xabar. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      // Ishlab chiqishda sababni ko'rish uchun.
      console.error('Ilovada xatolik:', error, info.componentStack);
    }
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          height: '100%',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          textAlign: 'center',
          color: 'var(--color-text)',
        }}
      >
        <div style={{ display: 'grid', gap: 12, maxWidth: 380 }}>
          <h1 style={{ fontSize: 20 }}>Kutilmagan xatolik</h1>
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            Ilovani qayta yuklang. Muammo takrorlansa, oila administratoriga xabar bering.
          </p>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnOutline}`}
            onClick={() => window.location.reload()}
          >
            Qayta yuklash
          </button>
        </div>
      </div>
    );
  }
}
