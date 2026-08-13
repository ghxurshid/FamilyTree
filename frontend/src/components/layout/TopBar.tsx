import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { ROUTES } from '@/app/config/routes';
import { useFormat } from '@/hooks/useFormat';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAuth } from '@/stores/authStore';
import { useFamilyTree } from '@/stores/familyTreeStore';
import { preferencesStore, usePreferences } from '@/stores/preferencesStore';
import { searchStore } from '@/stores/searchStore';
import { useCurrentPerson } from '@/features/auth/useCurrentPerson';
import styles from './layout.module.css';
import ui from '@/components/ui/ui.module.css';

const THEME_ICON = {
  system: 'theme-system',
  dark: 'theme-dark',
  light: 'theme-light',
} as const;

const THEME_TITLE = {
  system: 'Tizim',
  dark: 'Tungi',
  light: "Yorug'",
} as const;

export function TopBar(): JSX.Element {
  const navigate = useNavigate();
  const format = useFormat();
  const isMobile = useIsMobile();

  const family = useFamilyTree((state) => state.family);
  const peopleCount = useFamilyTree((state) => state.people.length);
  const generations = useFamilyTree((state) => state.generations);

  const theme = usePreferences((state) => state.theme);
  const alphabet = usePreferences((state) => state.alphabet);

  const authenticated = useAuth((state) => state.status === 'authenticated');
  const me = useCurrentPerson();

  const navClass = ({ isActive }: { isActive: boolean }) =>
    [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ');

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.brand}
        onClick={() => navigate(ROUTES.tree)}
        aria-label={format.t('Shajara — bosh sahifa')}
      >
        <Icon name="brand" size={22} className={styles.brandIcon} />
        <span className={styles.brandText}>
          <span className={styles.brandTitle}>
            {format.t(`${family.name}lar shajarasi`)}
          </span>
          <span className={styles.brandSub}>
            {format.t(
              [family.place.split(' ')[0] || 'Shajara', `${peopleCount} a'zo`, `${generations} avlod`]
                .filter(Boolean)
                .join(' · '),
            )}
          </span>
        </span>
      </button>

      {!isMobile ? (
        <nav className={styles.nav} aria-label={format.t('Asosiy bo‘limlar')}>
          <NavLink to={ROUTES.tree} className={navClass}>
            {format.t('Shajara')}
          </NavLink>
          <NavLink to={ROUTES.people} className={navClass}>
            {format.t('Odamlar')}
          </NavLink>
          <NavLink to={ROUTES.profile} className={navClass}>
            {format.t('Mening oilam')}
          </NavLink>
        </nav>
      ) : null}

      <div className={styles.spacer} />

      {isMobile ? (
        <button
          type="button"
          className={ui.iconBtn}
          aria-label={format.t('Qidirish')}
          onClick={() => searchStore.open()}
        >
          <Icon name="search" size={17} />
        </button>
      ) : (
        <button type="button" className={styles.searchTrigger} onClick={() => searchStore.open()}>
          <Icon name="search" size={15} />
          <span className={styles.searchTriggerText}>
            {format.t('Ism, kasb, shahar yoki yil…')}
          </span>
          <kbd className={styles.kbd}>/</kbd>
        </button>
      )}

      {!isMobile ? (
        <div className={styles.alphabet} role="radiogroup" aria-label={format.t('Alifbo')}>
          <button
            type="button"
            role="radio"
            aria-checked={alphabet === 'latin'}
            className={[styles.alphabetOption, alphabet === 'latin' ? styles.alphabetActive : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => preferencesStore.set({ alphabet: 'latin' })}
          >
            Lotin
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={alphabet === 'cyrillic'}
            className={[
              styles.alphabetOption,
              alphabet === 'cyrillic' ? styles.alphabetActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => preferencesStore.set({ alphabet: 'cyrillic' })}
          >
            Кирилл
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={ui.iconBtn}
        aria-label={format.t('Mavzu')}
        title={format.t(THEME_TITLE[theme])}
        onClick={() => preferencesStore.cycleTheme()}
      >
        <Icon name={THEME_ICON[theme]} size={16} />
      </button>

      <button
        type="button"
        className={[styles.identity, authenticated ? '' : styles.identityGuest]
          .filter(Boolean)
          .join(' ')}
        onClick={() => navigate(authenticated ? ROUTES.profile : ROUTES.login)}
      >
        <span className={styles.identityAvatar}>
          {authenticated && me ? format.initials(me) : '?'}
        </span>
        {!isMobile ? (
          <span className={styles.identityLabel}>
            {authenticated && me ? format.name(me) : format.t('Kirish')}
          </span>
        ) : null}
      </button>
    </header>
  );
}
