import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/app/config/routes';
import { useFormat } from '@/hooks/useFormat';
import styles from './pages.module.css';
import layout from '@/components/layout/layout.module.css';
import ui from '@/components/ui/ui.module.css';

export function NotFoundPage(): JSX.Element {
  const format = useFormat();
  const navigate = useNavigate();
  return (
    <div className={`${layout.screen} ${layout.screenScroll}`}>
      <div className={styles.narrow}>
        <EmptyState
          title={format.t('Sahifa topilmadi')}
          description={format.t("Manzil noto'g'ri bo'lishi mumkin.")}
          action={
            <button
              type="button"
              className={`${ui.btn} ${ui.btnOutline}`}
              onClick={() => navigate(ROUTES.tree)}
            >
              {format.t('Shajaraga qaytish')}
            </button>
          }
        />
      </div>
    </div>
  );
}
