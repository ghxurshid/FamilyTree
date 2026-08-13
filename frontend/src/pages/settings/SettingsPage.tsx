import { useNavigate } from 'react-router-dom';
import { Segmented } from '@/components/ui/Segmented';
import { SwitchRow } from '@/components/ui/SwitchRow';
import { ROUTES } from '@/app/config/routes';
import { useFormat } from '@/hooks/useFormat';
import { authStore, useAuth } from '@/stores/authStore';
import { familyTreeStore } from '@/stores/familyTreeStore';
import { preferencesStore, usePreferences } from '@/stores/preferencesStore';
import { toast } from '@/stores/toastStore';
import type { Preferences, ThemePreference } from '@/types/ui';
import styles from '../pages.module.css';
import layout from '@/components/layout/layout.module.css';
import ui from '@/components/ui/ui.module.css';

const FONT_SIZES = [0.92, 1, 1.14];

const TOGGLE_GROUPS: {
  group: string;
  items: { key: keyof Preferences; label: string; sub: string }[];
}[] = [
  {
    group: "Ko'rinish",
    items: [
      {
        key: 'genLabels',
        label: 'Avlod belgilari',
        sub: 'Kanvasda avlod nomlari va chiziqlari',
      },
      {
        key: 'relLabels',
        label: 'Qarindoshlik yozuvi',
        sub: 'Kartada "Otangiz", "Nabirangiz"…',
      },
      { key: 'photos', label: 'Avatarlar', sub: 'Kartalarda bosh harf doirasi' },
      { key: 'minimap', label: 'Mini xarita', sub: "O'ng pastdagi umumiy ko'rinish" },
    ],
  },
  {
    group: 'Qulaylik',
    items: [
      {
        key: 'reduceMotion',
        label: 'Animatsiyani kamaytirish',
        sub: 'Kamera va kartalar bir zumda harakatlanadi',
      },
      { key: 'contrast', label: 'Yuqori kontrast', sub: "Chegaralar quyuqroq ko'rinadi" },
    ],
  },
];

export function SettingsPage(): JSX.Element {
  const format = useFormat();
  const navigate = useNavigate();
  const prefs = usePreferences((state) => state);
  const authenticated = useAuth((state) => state.status === 'authenticated');

  return (
    <div className={`${layout.screen} ${layout.screenScroll}`}>
      <div className={styles.narrow}>
        <h1 className={styles.pageTitle}>{format.t('Sozlamalar')}</h1>

        <div className={styles.section}>
          <div className={styles.groupTitle}>{format.t('Mavzu')}</div>
          <Segmented
            label={format.t('Mavzu')}
            stretch
            value={prefs.theme}
            options={(['system', 'dark', 'light'] as ThemePreference[]).map((value) => ({
              value,
              label: format.t(
                value === 'system' ? 'Tizim' : value === 'dark' ? 'Tungi' : "Yorug'",
              ),
            }))}
            onChange={(theme) => preferencesStore.set({ theme })}
          />

          <div className={styles.settingsRow}>
            <div>
              <div className={styles.settingsRowTitle}>{format.t('Matn kattaligi')}</div>
              <div className={styles.settingsRowSub}>
                {format.t("Panel va ro'yxatlardagi matn")}
              </div>
            </div>
            <div className={styles.fontSizes} role="radiogroup" aria-label={format.t('Matn kattaligi')}>
              {FONT_SIZES.map((scale) => (
                <button
                  key={scale}
                  type="button"
                  role="radio"
                  aria-checked={prefs.fontScale === scale}
                  className={[styles.fontSize, prefs.fontScale === scale ? styles.fontSizeActive : '']
                    .filter(Boolean)
                    .join(' ')}
                  style={{ fontSize: `${11 + scale * 4}px` }}
                  onClick={() => preferencesStore.set({ fontScale: scale })}
                >
                  A
                </button>
              ))}
            </div>
          </div>
        </div>

        {TOGGLE_GROUPS.map((group) => (
          <div key={group.group} className={styles.section}>
            <div className={styles.groupTitle}>{format.t(group.group)}</div>
            <div className={styles.stack}>
              {group.items.map((item) => (
                <SwitchRow
                  key={item.key}
                  label={format.t(item.label)}
                  description={format.t(item.sub)}
                  checked={Boolean(prefs[item.key])}
                  onChange={(next) => preferencesStore.set({ [item.key]: next })}
                />
              ))}
            </div>
          </div>
        ))}

        <div className={styles.section}>
          <div className={styles.groupTitle}>{format.t('Alifbo')}</div>
          <Segmented
            label={format.t('Alifbo')}
            stretch
            value={prefs.alphabet}
            options={[
              { value: 'latin', label: 'Lotin' },
              { value: 'cyrillic', label: 'Кирилл' },
            ]}
            onChange={(alphabet) => preferencesStore.set({ alphabet })}
          />
        </div>

        <div className={styles.section}>
          <div className={styles.groupTitle}>{format.t('Hisob')}</div>
          {authenticated ? (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnDanger} ${ui.btnBlock}`}
              style={{ minHeight: 44 }}
              onClick={() => {
                void authStore.logout().then(() => {
                  familyTreeStore.closePanel();
                  toast.success('Hisobdan chiqdingiz');
                  navigate(ROUTES.tree);
                });
              }}
            >
              {format.t('Hisobdan chiqish')}
            </button>
          ) : (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnOutline} ${ui.btnBlock}`}
              style={{ minHeight: 44 }}
              onClick={() => navigate(ROUTES.login)}
            >
              {format.t('Tizimga kirish')}
            </button>
          )}
          <div className={styles.note}>
            {format.t(
              "Shajarani hamma ko'ra oladi. Faqat o'zingiz va avlodlaringiz yozuvini tahrirlaysiz.",
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
