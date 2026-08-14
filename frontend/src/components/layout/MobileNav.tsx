import type { CSSProperties } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ROUTES } from '@/app/config/routes';
import { useFormat } from '@/hooks/useFormat';
import { hapticSelection } from '@/services/telegram';
import styles from './layout.module.css';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: ROUTES.tree, label: 'Shajara', icon: 'brand' },
  { to: ROUTES.people, label: 'Odamlar', icon: 'users' },
  { to: ROUTES.profile, label: 'Oilam', icon: 'heart' },
  { to: ROUTES.settings, label: 'Sozlamalar', icon: 'gear' },
];

/**
 * Faol bo'lim indeksi. `/` daraxtga tushadi, ichki yo'llar esa o'z ildizini
 * saqlaydi (`/people/42` → Odamlar). Mos tab bo'lmasa −1.
 */
function activeIndex(pathname: string): number {
  if (pathname === ROUTES.home) return 0;
  return TABS.findIndex((tab) => pathname === tab.to || pathname.startsWith(`${tab.to}/`));
}

/**
 * Mobil pastki navigatsiya. Faol bo'limni tab ortida suriladigan yagona
 * "tabletka" ko'rsatadi — har tabda alohida fon yoqib-o'chirilsa, almashuv
 * sakrab ko'rinardi.
 */
export function MobileNav(): JSX.Element {
  const format = useFormat();
  const active = activeIndex(useLocation().pathname);

  return (
    <nav
      className={styles.mobileNav}
      aria-label={format.t('Asosiy bo‘limlar')}
      data-active={active}
      style={{ '--nav-count': TABS.length, '--nav-active': active } as CSSProperties}
    >
      <span className={styles.mobileNavPill} aria-hidden="true" />

      {TABS.map((tab, index) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={[styles.mobileTab, index === active ? styles.mobileTabActive : '']
            .filter(Boolean)
            .join(' ')}
          aria-current={index === active ? 'page' : undefined}
          onClick={() => {
            if (index !== active) hapticSelection();
          }}
        >
          <span className={styles.mobileTabIcon}>
            <Icon name={tab.icon} size={20} />
          </span>
          <span className={styles.mobileTabLabel}>{format.t(tab.label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
