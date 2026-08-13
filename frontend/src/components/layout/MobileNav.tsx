import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ROUTES } from '@/app/config/routes';
import { useFormat } from '@/hooks/useFormat';
import styles from './layout.module.css';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: ROUTES.tree, label: 'Shajara', icon: 'brand' },
  { to: ROUTES.people, label: 'Odamlar', icon: 'users' },
  { to: ROUTES.profile, label: 'Oilam', icon: 'heart' },
  { to: ROUTES.settings, label: 'Sozlama', icon: 'gear' },
];

export function MobileNav(): JSX.Element {
  const format = useFormat();
  return (
    <nav className={styles.mobileNav} aria-label={format.t('Asosiy bo‘limlar')}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            [styles.mobileTab, isActive ? styles.mobileTabActive : ''].filter(Boolean).join(' ')
          }
        >
          <Icon name={tab.icon} size={19} />
          <span>{format.t(tab.label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
