import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/ui/Field';
import { ROUTES } from '@/app/config/routes';
import { env } from '@/app/config/env';
import { useFormat } from '@/hooks/useFormat';
import { authStore, useAuth } from '@/stores/authStore';
import { familyTreeStore, useFamilyTree } from '@/stores/familyTreeStore';
import { toast } from '@/stores/toastStore';
import styles from '../pages.module.css';
import ui from '@/components/ui/ui.module.css';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

const COPY: Record<AuthMode, { title: string; sub: string; submit: string }> = {
  login: {
    title: 'Xush kelibsiz',
    sub: "Shajarani ko'rish uchun kirish shart emas. Tahrirlash uchun kiring.",
    submit: 'Kirish',
  },
  register: {
    title: "Oilaga qo'shiling",
    sub: "Hisob yarating — o'z avlodlaringizni to'ldirasiz",
    submit: 'Hisob yaratish',
  },
  forgot: {
    title: 'Parolni tiklash',
    sub: 'Emailingizni kiriting, tiklash havolasini yuboramiz',
    submit: 'Havola yuborish',
  },
  reset: {
    title: 'Yangi parol',
    sub: "Havola orqali kelgansiz — yangi parolni o'rnating",
    submit: 'Parolni saqlash',
  },
};

interface AuthPageProps {
  mode: AuthMode;
}

/**
 * Autentifikatsiya oynasi — dizayndagi modal, lekin har bir holat o'z
 * manziliga ega, shuning uchun havola bilan ochsa ham bo'ladi.
 */
export function AuthPage({ mode }: AuthPageProps): JSX.Element {
  const format = useFormat();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const pending = useAuth((state) => state.pending);
  const error = useAuth((state) => state.error);
  const meId = useFamilyTree((state) => state.meId);
  const index = useFamilyTree((state) => state.index);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    authStore.clearError();
    setSent(false);
  }, [mode]);

  const close = () => navigate(ROUTES.tree);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (mode === 'login') {
        await authStore.login({ email, password });
      } else if (mode === 'register') {
        await authStore.register({ email, password, displayName });
      } else if (mode === 'forgot') {
        await authStore.requestPasswordReset(email);
        setSent(true);
        return;
      } else {
        await authStore.resetPassword({ token: params.get('token') ?? '', password });
        toast.success('Parol yangilandi — endi kirishingiz mumkin');
        navigate(ROUTES.login);
        return;
      }

      familyTreeStore.collapseToLine();
      const me = meId ? index.byId[meId] : null;
      toast.success(
        me
          ? `Xush kelibsiz, ${format.name(me)} — avlodlaringizni tahrirlashingiz mumkin`
          : 'Xush kelibsiz',
      );
      navigate(ROUTES.tree);
    } catch {
      /* xato xabari store'da — formada ko'rsatiladi */
    }
  };

  const copy = COPY[mode];

  return (
    <Modal open onClose={close} label={format.t(copy.title)} width={400}>
      <div className={styles.authCard}>
        <Icon name="brand" size={24} className={styles.authIcon} />
        <div className={styles.authTitle}>
          {format.t(sent ? 'Havola yuborildi' : copy.title)}
        </div>
        <div className={styles.authSub}>
          {format.t(
            sent
              ? "Pochtangizni tekshiring va havola orqali yangi parol o'rnating"
              : copy.sub,
          )}
        </div>

        {sent ? (
          <button type="button" className={`${ui.btn} ${ui.btnPrimary} ${styles.authSubmit}`} onClick={() => navigate(ROUTES.login)}>
            {format.t('Kirishga qaytish')}
          </button>
        ) : (
          <form onSubmit={onSubmit}>
            <div className={styles.authFields}>
              {mode === 'register' ? (
                <TextField
                  label={format.t('Ism familiya')}
                  placeholder="Erkin Yusupov"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              ) : null}

              {mode !== 'reset' ? (
                <TextField
                  label="Email"
                  type="email"
                  placeholder="siz@oila.uz"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              ) : null}

              {mode === 'login' || mode === 'register' || mode === 'reset' ? (
                <TextField
                  label={format.t(mode === 'reset' ? 'Yangi parol' : 'Parol')}
                  type="password"
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              ) : null}
            </div>

            {error ? (
              <div className={styles.authError} role="alert">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              className={`${ui.btn} ${ui.btnPrimary} ${styles.authSubmit}`}
              disabled={pending}
            >
              {pending ? <span className={ui.spinner} /> : null}
              {format.t(pending ? 'Tekshirilmoqda…' : copy.submit)}
            </button>
          </form>
        )}

        <div className={styles.authLinks}>
          <Link
            className={styles.authLink}
            to={mode === 'register' ? ROUTES.login : ROUTES.register}
          >
            {format.t(
              mode === 'register'
                ? 'Hisobingiz bormi? Kirish'
                : "Hisobingiz yo'qmi? Ro'yxatdan o'tish",
            )}
          </Link>
          {mode === 'login' ? (
            <Link
              className={`${styles.authLink} ${styles.authLinkMuted}`}
              to={ROUTES.forgotPassword}
            >
              {format.t('Parolni unutdingizmi?')}
            </Link>
          ) : null}
        </div>

        {env.useMockApi ? (
          <div className={styles.authFooter}>
            {format.t('Demo: istalgan email va parol ishlaydi')}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
