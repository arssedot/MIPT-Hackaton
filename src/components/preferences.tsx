'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Languages, Monitor, Moon, Sun, Type } from 'lucide-react';
import { translate, type Language } from '@/lib/i18n';

type Theme = 'light' | 'dark' | 'system';
type TextSize = 'standard' | 'large' | 'extra';
type Preferences = { theme: Theme; language: Language; textSize: TextSize };
const defaults: Preferences = { theme: 'system', language: 'ru', textSize: 'standard' };
const storageKey = 'kontur.preferences.v1';
type PreferencesContext = Preferences & {
  resolvedTheme: 'light' | 'dark';
  dateLocale: string;
  t: (message: string, values?: Record<string, string | number>) => string;
  update: (value: Partial<Preferences>) => void;
};
const Context = createContext<PreferencesContext | null>(null);

// Runs before the page is painted. Only validated, non-sensitive preferences are read.
export const preferenceBootstrap = `(function(){try{var p=JSON.parse(localStorage.getItem('${storageKey}')||'{}');var h=document.documentElement;var theme=['light','dark','system'].includes(p.theme)?p.theme:'system';h.dataset.theme=theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;h.dataset.textSize=['standard','large','extra'].includes(p.textSize)?p.textSize:'standard';h.lang=p.language==='en'?'en':'ru'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})();`;

function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '{}');
    return {
      theme: ['light', 'dark', 'system'].includes(value?.theme) ? value.theme : defaults.theme,
      language: value?.language === 'en' ? 'en' : 'ru',
      textSize: ['standard', 'large', 'extra'].includes(value?.textSize)
        ? value.textSize
        : defaults.textSize,
    };
  } catch {
    return defaults;
  }
}

function apply(preferences: Preferences) {
  const root = document.documentElement;
  root.dataset.theme =
    preferences.theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : preferences.theme;
  root.dataset.textSize = preferences.textSize;
  root.lang = preferences.language;
  document.title =
    preferences.language === 'en'
      ? 'Kontur TZ — procurement document review'
      : 'Контур ТЗ — проверка закупочной документации';
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const preferencesRef = useRef<Preferences>(defaults);
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    const initial = readPreferences();
    preferencesRef.current = initial;
    setPreferences(initial);
    apply(initial);
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    const change = () => {
      setSystemDark(media.matches);
      if (preferencesRef.current.theme === 'system')
        document.documentElement.dataset.theme = media.matches ? 'dark' : 'light';
    };
    const storage = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      const next = readPreferences();
      preferencesRef.current = next;
      setPreferences(next);
      apply(next);
    };
    media.addEventListener('change', change);
    window.addEventListener('storage', storage);
    return () => {
      media.removeEventListener('change', change);
      window.removeEventListener('storage', storage);
    };
  }, []);
  const update = useCallback(
    (next: Partial<Preferences>) => {
      const value = { ...preferences, ...next };
      preferencesRef.current = value;
      setPreferences(value);
      apply(value);
      try {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        /* Preferences still work when storage is disabled. */
      }
    },
    [preferences],
  );
  const t = useCallback(
    (message: string, values?: Record<string, string | number>) =>
      translate(message, preferences.language, values),
    [preferences.language],
  );
  const resolvedTheme =
    preferences.theme === 'system' ? (systemDark ? 'dark' : 'light') : preferences.theme;
  return (
    <Context.Provider
      value={{
        ...preferences,
        resolvedTheme,
        dateLocale: preferences.language === 'en' ? 'en-GB' : 'ru-RU',
        update,
        t,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error('PreferencesProvider is required.');
  return value;
}

export function PreferenceControls({ className = '' }: { className?: string }) {
  const { language, textSize, resolvedTheme, t, update } = usePreferences();
  return (
    <div
      className={`preference-controls ${className}`}
      role="group"
      aria-label={t('Настройки интерфейса')}
    >
      <button
        type="button"
        className="preference-theme"
        aria-label={t(resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема')}
        title={t(resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема')}
        onClick={() => update({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' })}
      >
        <span key={resolvedTheme} className="theme-icon">
          {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </span>
      </button>
      <label className="preference-select">
        <Languages size={16} aria-hidden="true" />
        <select
          aria-label={t('Язык интерфейса')}
          value={language}
          onChange={(event) => update({ language: event.target.value as Language })}
        >
          <option value="ru">RU</option>
          <option value="en">EN</option>
        </select>
      </label>
      <label className="preference-select font-select">
        <Type size={17} aria-hidden="true" />
        <select
          aria-label={t('Размер текста')}
          value={textSize}
          onChange={(event) => update({ textSize: event.target.value as TextSize })}
        >
          <option value="standard">100%</option>
          <option value="large">115%</option>
          <option value="extra">130%</option>
        </select>
      </label>
    </div>
  );
}

export function AppearanceSettings() {
  const { t, theme, language, textSize, update } = usePreferences();
  return (
    <section className="card settings-card appearance-settings">
      <div className="appearance-heading">
        <div className="appearance-symbol">
          <SettingsIcon />
        </div>
        <div>
          <h2>{t('Настройки интерфейса')}</h2>
          <p>{t('Сделайте пространство удобным для себя.')}</p>
        </div>
      </div>
      <div className="appearance-fields">
        <fieldset>
          <legend>{t('Оформление')}</legend>
          <div className="segmented-control">
            {(
              [
                { value: 'light', label: 'Светлая', icon: Sun },
                { value: 'dark', label: 'Тёмная', icon: Moon },
                { value: 'system', label: 'Системная', icon: Monitor },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={theme === item.value}
                onClick={() => update({ theme: item.value })}
              >
                <item.icon size={16} />
                {t(item.label)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>{t('Язык интерфейса')}</legend>
          <div className="segmented-control">
            <button
              type="button"
              lang="ru"
              aria-pressed={language === 'ru'}
              onClick={() => update({ language: 'ru' })}
            >
              Русский
            </button>
            <button
              type="button"
              lang="en"
              aria-pressed={language === 'en'}
              onClick={() => update({ language: 'en' })}
            >
              English
            </button>
          </div>
        </fieldset>
        <fieldset>
          <legend>{t('Размер текста')}</legend>
          <div className="segmented-control">
            {(
              [
                { value: 'standard', label: 'Обычный', scale: '100%' },
                { value: 'large', label: 'Крупный', scale: '115%' },
                { value: 'extra', label: 'Очень крупный', scale: '130%' },
              ] as const
            ).map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={textSize === item.value}
                onClick={() => update({ textSize: item.value })}
              >
                {t(item.label)}
                <small>{item.scale}</small>
              </button>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="type-preview">
        <span aria-hidden="true">Aa</span>
        <div>
          <strong>{t('Точный текст. Ясные решения.')}</strong>
          <p>{t('Проверьте, насколько удобно читать этот текст.')}</p>
        </div>
      </div>
      <p className="preference-note">
        {t('Тема, язык и размер текста сохраняются в этом браузере.')}{' '}
        {t('Язык интерфейса не изменяет текст документов и найденных замечаний.')}
      </p>
    </section>
  );
}
function SettingsIcon() {
  return <Type size={23} />;
}
