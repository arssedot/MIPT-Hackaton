'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  FileText,
  FolderClock,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  BookOpen,
  AlertTriangle,
  CheckCheck,
  PanelLeftClose,
} from 'lucide-react';
import { AppearanceSettings, usePreferences } from '@/components/preferences';
import { translateLocation } from '@/lib/i18n';
import { categoryLabels, type Category, type Review } from '@/contracts/review';
import { demos } from '@/lib/demo';
import { sources } from '@/server/analysis/sources';
type Tab = 'new' | 'history' | 'sources' | 'settings' | 'help';
type History = { id: string; name: string; createdAt: string; count: number; engine: string };
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить запрос.');
  return data;
}
function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function Workspace() {
  const { t, language, dateLocale } = usePreferences();
  const location = (value: string | undefined) => translateLocation(value, language);
  const scrollBehavior = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? ('instant' as const)
      : ('smooth' as const);
  const [auth, setAuth] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('new');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [publicData, setPublicData] = useState(false);
  const [useModel, setUseModel] = useState(false);
  const [model, setModel] = useState({ modelConfigured: false, model: null as string | null });
  const [review, setReview] = useState<Review | null>(null);
  const [history, setHistory] = useState<History[]>([]);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [query, setQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showDocument, setShowDocument] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [showPersonalizationTip, setShowPersonalizationTip] = useState(false);
  function dismissPersonalizationTip() {
    setShowPersonalizationTip(false);
    try {
      localStorage.setItem('kontur.personalization-seen.v1', '1');
    } catch {}
  }
  useEffect(() => {
    try {
      setShowPersonalizationTip(localStorage.getItem('kontur.personalization-seen.v1') !== '1');
    } catch {
      setShowPersonalizationTip(true);
    }
  }, []);
  useEffect(() => {
    if (tab === 'settings') dismissPersonalizationTip();
  }, [tab]);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    api<{ authenticated: boolean }>('/api/auth')
      .then((d) => setAuth(d.authenticated))
      .catch(() => setAuth(false));
  }, []);
  useEffect(() => {
    if (auth)
      api<typeof model>('/api/settings')
        .then(setModel)
        .catch((e) => setError(e.message));
  }, [auth]);
  useEffect(() => {
    if (auth && tab === 'history')
      api<History[]>('/api/reviews')
        .then(setHistory)
        .catch((e) => setError(e.message));
  }, [auth, tab]);
  useEffect(() => {
    if (selectedBlock)
      document
        .getElementById(selectedBlock)
        ?.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
  }, [selectedBlock, showDocument]);
  function selectFile(value: File | undefined) {
    setError('');
    if (!value) return;
    if (!/\.(docx|txt)$/i.test(value.name) || value.size > 8 * 1024 * 1024 || value.size === 0) {
      setError('Выберите DOCX или TXT размером до 8 МБ.');
      return;
    }
    setFile(value);
    setPublicData(false);
  }
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setAuth(true);
      setPassword('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function analyze() {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    const form = new FormData();
    form.set('file', file);
    form.set('useModel', String(useModel));
    form.set('isPublic', String(publicData));
    try {
      const data = await api<Review>('/api/reviews', { method: 'POST', body: form });
      setReview(data);
      setFilter('all');
      setTab('new');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function openReview(id: string) {
    setError('');
    try {
      setReview(await api<Review>(`/api/reviews/${id}`));
      setFilter('all');
      setTab('new');
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function decision(id: string, value: 'accepted' | 'dismissed') {
    if (!review) return;
    try {
      setReview(
        await api<Review>(`/api/reviews/${review.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ findingId: id, decision: value }),
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function removeReview(id: string) {
    if (!confirm(t('Удалить проверку вместе с извлечённым текстом и решениями?'))) return;
    try {
      await api(`/api/reviews/${id}`, { method: 'DELETE' });
      setHistory(history.filter((x) => x.id !== id));
      if (review?.id === id) setReview(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function exportReport() {
    if (!review) return;
    const content = [
      `# ${t('Результат проверки')}: ${review.name}`,
      `${t('Дата')}: ${new Date(review.createdAt).toLocaleString(dateLocale)}`,
      `${t('Режим проверки')}: ${review.engine === 'hybrid' ? t('Локальные проверки и модель') : t('Только локальные проверки')}`,
      `${t('Всего замечаний')}: ${review.findings.length}`,
      ...review.warnings.map((warning) => t(warning)),
      ...review.findings.map(
        (f, i) =>
          `\n## ${i + 1}. ${f.title}\n${t('Категория')}: ${t(categoryLabels[f.category])}\n${t('Приоритет')}: ${t(f.severity === 'high' ? 'Высокий' : f.severity === 'medium' ? 'Средний' : 'Низкий')}\n${t('Статус')}: ${t(review.decisions[f.id] === 'accepted' ? 'Принято в работу' : review.decisions[f.id] === 'dismissed' ? 'Отклонено' : 'не рассмотрено')}\n${t('Источник')}: ${location(review.document.blocks.find((b) => b.id === f.blockId)?.location)}\n\n> ${f.quote.replace(/\n/g, '\n> ')}\n\n${f.explanation}\n\n${t('Рекомендация')}: ${f.recommendation}\n${f.sourceIds
            .map((id) => sources.find((s) => s.id === id))
            .filter(Boolean)
            .map((s) => `${t(s!.title)}: ${s!.url}`)
            .join('\n')}`,
      ),
    ].join('\n\n');
    download('review-report.md', content, 'text/markdown;charset=utf-8');
  }
  const nav = [
    { id: 'new' as const, label: 'Проверка документа', icon: LayoutDashboard },
    { id: 'history' as const, label: 'История проверок', icon: FolderClock },
    { id: 'sources' as const, label: 'Нормативные источники', icon: BookOpen },
  ];
  if (auth === null)
    return (
      <main className="loading">
        <LoaderCircle className="spin" />
        <p>{t('Открываем рабочее пространство')}</p>
      </main>
    );
  if (!auth)
    return (
      <main className="login-screen">
        <div className="login-art">
          <span className="eyebrow">{t('ИНТЕЛЛЕКТУАЛЬНАЯ ПРОВЕРКА ЗАКУПОК')}</span>
          <h1>
            {t('Сильное ТЗ')}
            <br /> {t('начинается')}
            <br /> {t('с ясности')}
            <span>.</span>
          </h1>
          <p>
            {t('Находите противоречия, проверяйте требования')}
            <br /> {t('и дорабатывайте документы в одном пространстве.')}
          </p>
          <div className="orbital">
            <FileCheck2 size={72} strokeWidth={1} />
          </div>
        </div>
        <form className="login-card" onSubmit={login}>
          <Brand />
          <div>
            <h2>{t('Ваше рабочее пространство')}</h2>
            <p className="muted">{t('Введите пароль для доступа к проверке документов.')}</p>
          </div>
          <label>
            {t('Пароль доступа')}
            <input
              autoComplete="current-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <div role="alert" className="error">
              {t(error)}
            </div>
          )}
          <button className="primary" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : t('Войти в кабинет')}
            <ArrowRight size={18} />
          </button>
          <p className="small muted">
            <LockKeyhole size={13} /> {t('Доступ к вашему рабочему пространству')}
          </p>
        </form>
      </main>
    );
  return (
    <div className="app-shell">
      <aside id="main-navigation" className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <Brand />
        <div className="workspace-label">
          <span className="workspace-avatar">{t('М')}</span>
          <div>
            {t('Рабочее пространство')}
            <small>{t('Команда закупок')}</small>
          </div>
          <span className="local-dot" />
        </div>
        <p className="nav-heading">{t('РАБОТА С ДОКУМЕНТАМИ')}</p>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => {
                setTab(item.id);
                setError('');
                setMobileNav(false);
              }}
            >
              <item.icon size={18} />
              {t(item.label)}
              {tab === item.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-icon">
            <ShieldCheck size={20} />
          </div>
          <strong>{t('Документы под контролем')}</strong>
          <p>{t('Обработка остаётся локальной, пока вы сами не включите модель.')}</p>
          <span>
            {t('Локальная среда')} <span className="local-dot" />
          </span>
        </div>
        <div className="sidebar-bottom">
          <button
            className={tab === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setTab('settings');
              setMobileNav(false);
            }}
          >
            <Settings2 size={18} />
            {t('Настройки')}
          </button>
          <button
            className={tab === 'help' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setTab('help');
              setMobileNav(false);
            }}
          >
            <CircleHelp size={18} />
            {t('Как это работает')}
          </button>
          <div className="profile">
            <span className="profile-avatar">{t('Э')}</span>
            <div>
              {t('Эксперт по закупкам')}
              <small>{t('Общее пространство')}</small>
            </div>
            <button
              title={t('Выйти')}
              aria-label={t('Выйти')}
              onClick={async () => {
                await api('/api/auth', { method: 'DELETE' });
                setAuth(false);
                setReview(null);
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <>
        {mobileNav && (
          <button
            className="nav-backdrop"
            aria-label={t('Закрыть меню')}
            onClick={() => setMobileNav(false)}
          />
        )}
      </>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label={t('Меню')}
              aria-controls="main-navigation"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <PanelLeftClose size={20} />
            </button>
            <span className="muted">{t('Рабочее пространство')}</span>
            <ChevronRight size={13} />
            <span>
              {tab === 'new'
                ? t('Проверка документа')
                : tab === 'history'
                  ? t('История проверок')
                  : tab === 'sources'
                    ? t('Нормативные источники')
                    : tab === 'settings'
                      ? t('Настройки')
                      : t('Как это работает')}
            </span>
          </div>
        </header>
        <main className="content">
          <div className="view-transition" key={`${tab}-${review?.id || 'new'}`}>
            {error && (
              <div role="alert" className="error global-error">
                {t(error)}
                <button aria-label={t('Закрыть ошибку')} onClick={() => setError('')}>
                  <X size={16} />
                </button>
              </div>
            )}
            {tab === 'new' && !review && (
              <>
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      <span /> {t('ОТ ТРЕБОВАНИЙ К УВЕРЕННОСТИ')}
                    </div>
                    <h1>
                      {t('Проверьте ТЗ.')}
                      <br /> <span>{t('До начала закупки.')}</span>
                    </h1>
                    <p>
                      {t('Замечайте противоречия и спорные требования.')}
                      <br /> {t('Получайте понятные рекомендации с привязкой к документу.')}
                    </p>
                  </div>
                  <div className="heading-art">
                    <div className="art-ring" />
                    <div className="art-document">
                      <div className="art-doc-top">
                        <FileText size={22} />
                        <span>{t('ТЕХНИЧЕСКОЕ ЗАДАНИЕ')}</span>
                      </div>
                      <i />
                      <i />
                      <i />
                      <div className="art-highlight">
                        <Check size={13} /> {t('Требования проверены')}
                      </div>
                      <i />
                      <i />
                    </div>
                    <span className="sparkle s1">✦</span>
                    <span className="sparkle s2">✦</span>
                    <div className="art-shield">
                      <ShieldCheck size={24} />
                    </div>
                  </div>
                </div>
                {showPersonalizationTip && (
                  <aside className="personalization-tip" aria-label={t('Подсказка о настройках')}>
                    <Settings2 size={17} aria-hidden="true" />
                    <p>{t('Тема, язык и размер текста — в настройках.')}</p>
                    <button className="text-button" onClick={() => setTab('settings')}>
                      {t('Настроить интерфейс')}
                      <ArrowRight size={14} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={t('Не показывать подсказку')}
                      onClick={dismissPersonalizationTip}
                    >
                      <X size={15} />
                    </button>
                  </aside>
                )}
                <div className="upload-grid">
                  <section className="card upload-card">
                    <div className="card-title">
                      <span className="step-number">01</span>
                      <div>
                        <h2>{t('Добавьте техническое задание')}</h2>
                        <p>{t('Начните с документа, который нужно проверить')}</p>
                      </div>
                    </div>
                    <div
                      className={`dropzone ${drag ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                      }}
                      onDragLeave={() => setDrag(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDrag(false);
                        selectFile(e.dataTransfer.files[0]);
                      }}
                    >
                      <div className="upload-symbol">
                        {file ? <FileCheck2 size={29} /> : <UploadCloud size={29} />}
                      </div>
                      {file ? (
                        <>
                          <strong>{file.name}</strong>
                          <p>
                            {(file.size / 1024).toFixed(1)} {t('КБ · Готов к проверке')}
                          </p>
                          <button className="text-button" onClick={() => input.current?.click()}>
                            {t('Выбрать другой файл')}
                          </button>
                        </>
                      ) : (
                        <>
                          <strong>{t('Перетащите документ сюда')}</strong>
                          <p>
                            {t('или')}{' '}
                            <button className="inline-link" onClick={() => input.current?.click()}>
                              {t('выберите файл на компьютере')}
                            </button>
                          </p>
                          <span className="file-formats">
                            DOCX <span>·</span> TXT <span>·</span> {t('до 8 МБ')}
                          </span>
                        </>
                      )}
                      <input
                        ref={input}
                        className="sr-only"
                        type="file"
                        accept=".docx,.txt"
                        aria-label={t('Выберите техническое задание')}
                        onChange={(e) => selectFile(e.target.files?.[0])}
                      />
                    </div>
                    <div className="analysis-options">
                      <label className="check-row">
                        <input
                          type="checkbox"
                          checked={useModel}
                          disabled={!model.modelConfigured || busy}
                          onChange={(e) => setUseModel(e.target.checked)}
                        />
                        <div>
                          <strong>
                            {t('Подключить смысловую проверку')}{' '}
                            <span className="mini-tag">AI</span>
                          </strong>
                          <p>
                            {model.modelConfigured
                              ? t('Модель {model} сопоставит требования по смыслу', {
                                  model: model.model || '',
                                })
                              : t('Добавьте ключ и модель в настройках окружения')}
                          </p>
                        </div>
                      </label>
                      {useModel && (
                        <label className="check-row disclosure">
                          <input
                            type="checkbox"
                            checked={publicData}
                            onChange={(e) => setPublicData(e.target.checked)}
                          />
                          <div>
                            {t(
                              'Документ открытый, не содержит конфиденциальных данных. Разрешаю отправить его текст во внешний API.',
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                    <div className="upload-footer">
                      <span>
                        <LockKeyhole size={14} />
                        {useModel
                          ? t('Текст будет передан провайдеру модели')
                          : t('Документ обрабатывается локально')}
                      </span>
                      <button
                        className="primary"
                        disabled={!file || busy || (useModel && !publicData)}
                        onClick={analyze}
                      >
                        {busy ? (
                          <>
                            <LoaderCircle size={18} className="spin" />
                            {t('Проверяем документ')}
                          </>
                        ) : (
                          <>
                            <Sparkles size={17} />
                            {t('Начать проверку')}
                            <ArrowRight size={16} />
                          </>
                        )}
                      </button>
                    </div>
                    {busy && (
                      <p className="progress-message" role="status">
                        {t(
                          'Извлекаем структуру и сопоставляем требования. Проверка моделью может занять до 90 секунд.',
                        )}
                      </p>
                    )}
                  </section>
                  <aside className="checklist-card">
                    <div className="mini-eyebrow">{t('ФОКУС ПРОВЕРКИ')}</div>
                    <h2>
                      {t('Внимание к тому,')}
                      <br /> {t('что легко упустить')}
                    </h2>
                    <p>
                      {t('Семь направлений проверки')}
                      <br /> {t('в одном рабочем процессе.')}
                    </p>
                    <ul>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <li key={key}>
                          <span>
                            <Check size={12} />
                          </span>
                          {t(label)}
                        </li>
                      ))}
                    </ul>
                    <div className="checklist-foot">
                      <ShieldCheck size={16} /> {t('Финальное решение — за экспертом')}
                    </div>
                  </aside>
                </div>
                <section className="examples">
                  <div className="section-heading">
                    <div>
                      <h2>{t('Сначала попробуйте на примере')}</h2>
                      <p>{t('Синтетические документы для знакомства с проверкой')}</p>
                    </div>
                    <span className="small muted">
                      {t('Данные не покидают устройство без разрешения')}
                    </span>
                  </div>
                  <div className="example-grid">
                    {demos.map((demo, i) => (
                      <button
                        className="example-card"
                        key={demo.id}
                        disabled={busy}
                        onClick={() => {
                          selectFile(
                            new File([demo.text], `${t(demo.name)}.txt`, { type: 'text/plain' }),
                          );
                          input.current?.scrollIntoView({
                            behavior: scrollBehavior(),
                            block: 'center',
                          });
                        }}
                      >
                        <span className={`example-icon example-${i}`}>
                          <FileText size={23} />
                        </span>
                        <div>
                          <strong>{t(demo.name)}</strong>
                          <p>{t(demo.description)}</p>
                          <span>
                            {t('Выбрать пример')} <ArrowUpRight size={13} />
                          </span>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                </section>
                <div className="bottom-note">
                  <span>✦</span>
                  <p>{t('Хорошее техническое задание начинается с точных требований.')}</p>
                  <span>{t('КОНТУР ТЗ / 2026')}</span>
                </div>
              </>
            )}
            {tab === 'new' && review && (
              <>
                <div className="results-heading">
                  <div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setReview(null);
                        setFile(null);
                      }}
                    >
                      {t('← Новая проверка')}
                    </button>
                    <h1>{t('Результаты проверки')}</h1>
                    <p className="muted file-heading">
                      <FileText size={16} />
                      {review.name}
                      <span>·</span>
                      {new Date(review.createdAt).toLocaleString(dateLocale)}
                    </p>
                  </div>
                  <div className="result-actions">
                    <button className="secondary" onClick={() => setShowDocument(!showDocument)}>
                      <FileText size={16} />
                      {showDocument ? t('Скрыть документ') : t('Открыть документ')}
                    </button>
                    <button className="primary" onClick={exportReport}>
                      <ArrowDownToLine size={16} />
                      {t('Скачать отчёт')}
                    </button>
                  </div>
                </div>
                <div className="stat-grid">
                  <div className="stat-card">
                    <span>{t('Всего замечаний')}</span>
                    <strong>{review.findings.length.toString().padStart(2, '0')}</strong>
                    <small>{t('По всем категориям')}</small>
                  </div>
                  <div className="stat-card">
                    <span>{t('Высокий приоритет')}</span>
                    <strong className="danger-text">
                      {review.findings
                        .filter((f) => f.severity === 'high')
                        .length.toString()
                        .padStart(2, '0')}
                    </strong>
                    <small>{t('Рекомендуем разобрать первыми')}</small>
                  </div>
                  <div className="stat-card">
                    <span>{t('Рассмотрено экспертом')}</span>
                    <strong className="purple-text">
                      {Object.keys(review.decisions).length.toString().padStart(2, '0')}
                    </strong>
                    <small>
                      {t('Из')} {review.findings.length} {t('замечаний')}
                    </small>
                  </div>
                  <div className="stat-card">
                    <span>{t('Режим проверки')}</span>
                    <strong className="engine-label">
                      {review.engine === 'hybrid' ? t('Гибридный') : t('Локальный')}
                    </strong>
                    <small>
                      {(review.durationMs / 1000).toFixed(1)} {t('с ·')}{' '}
                      {review.document.blocks.length} {t('фрагментов')}
                    </small>
                  </div>
                </div>
                <div className="notice">
                  <ShieldCheck size={19} />
                  <div>
                    <strong>{t('Итоговое заключение')}</strong>
                    <p>
                      {review.findings.length
                        ? t(
                            'Найдено {total} замечаний, из них {pending} требуют дополнительной проверки. До публикации закупки разберите замечания и согласуйте изменения с ответственным специалистом.',
                            {
                              total: review.findings.length,
                              pending: review.findings.filter((f) => f.confidence === 'review')
                                .length,
                            },
                          )
                        : t(
                            'В пределах выполненных проверок замечаний не найдено. Это не подтверждает соответствие всем требованиям.',
                          )}
                    </p>
                    {review.warnings.map((w, i) => (
                      <p className="small" key={i}>
                        {t(w)}
                      </p>
                    ))}
                  </div>
                </div>
                <div className={`results-layout ${showDocument ? 'with-document' : ''}`}>
                  <section>
                    <div className="filterbar">
                      <label className="search">
                        <Search size={16} />
                        <input
                          aria-label={t('Поиск замечаний')}
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder={t('Поиск по замечаниям')}
                        />
                      </label>
                      <select
                        aria-label={t('Категория замечаний')}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as Category | 'all')}
                      >
                        <option value="all">{t('Все категории')}</option>
                        {Object.entries(categoryLabels).map(([k, v]) => (
                          <option key={k} value={k}>
                            {t(v)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="findings">
                      {review.findings
                        .filter(
                          (f) =>
                            (filter === 'all' || f.category === filter) &&
                            `${f.title} ${f.explanation} ${f.quote}`
                              .toLowerCase()
                              .includes(query.toLowerCase()),
                        )
                        .map((f, i) => (
                          <article
                            className={`finding ${review.decisions[f.id] ? 'decided' : ''}`}
                            key={f.id}
                          >
                            <div className="finding-top">
                              <span className={`severity ${f.severity}`}>
                                <span />
                                {f.severity === 'high'
                                  ? t('Высокий')
                                  : f.severity === 'medium'
                                    ? t('Средний')
                                    : t('Низкий')}{' '}
                                {t('приоритет')}
                              </span>
                              <span className="category">{t(categoryLabels[f.category])}</span>
                              <span className="finding-number">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                            </div>
                            <h2>{f.title}</h2>
                            <button
                              className="quote"
                              onClick={() => {
                                setShowDocument(true);
                                setSelectedBlock(f.blockId);
                              }}
                            >
                              <span>
                                {review.document.blocks.find((b) => b.id === f.blockId)?.location}
                                <ArrowUpRight size={12} />
                              </span>
                              <q>{f.quote}</q>
                            </button>
                            {f.relatedBlockIds.length > 0 && (
                              <div className="related">
                                {t('Связанные фрагменты:')}{' '}
                                {[...new Set(f.relatedBlockIds)].map((id) => (
                                  <button
                                    key={id}
                                    onClick={() => {
                                      setShowDocument(true);
                                      setSelectedBlock(id);
                                    }}
                                  >
                                    {location(
                                      review.document.blocks.find((b) => b.id === id)?.location,
                                    ) || id}
                                  </button>
                                ))}
                              </div>
                            )}
                            <p>{f.explanation}</p>
                            <div className="recommendation">
                              <span>
                                <Sparkles size={14} />
                                {t('Рекомендация')}
                              </span>
                              <p>{f.recommendation}</p>
                            </div>
                            {f.sourceIds
                              .map((id) => sources.find((s) => s.id === id))
                              .filter(Boolean)
                              .map((s) => (
                                <a
                                  key={s!.id}
                                  href={s!.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="source-link"
                                >
                                  <BookOpen size={14} />
                                  {t(s!.title)}
                                  <ArrowUpRight size={12} />
                                </a>
                              ))}
                            <div className="finding-footer">
                              <span>
                                {f.confidence === 'confirmed'
                                  ? t('Прямое противоречие в тексте')
                                  : t('Требует проверки экспертом')}{' '}
                                · {f.origin === 'model' ? t('Модель') : t('Локальная проверка')}
                              </span>
                              <div>
                                {review.decisions[f.id] ? (
                                  <span className="decision-label">
                                    <CheckCheck size={15} />
                                    {review.decisions[f.id] === 'accepted'
                                      ? t('Принято в работу')
                                      : t('Отклонено')}
                                    <button
                                      className="text-button"
                                      onClick={() =>
                                        decision(
                                          f.id,
                                          review.decisions[f.id] === 'accepted'
                                            ? 'dismissed'
                                            : 'accepted',
                                        )
                                      }
                                    >
                                      {t('Изменить')}
                                    </button>
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      className="text-button muted"
                                      onClick={() => decision(f.id, 'dismissed')}
                                    >
                                      {t('Отклонить')}
                                    </button>
                                    <button
                                      className="accept-button"
                                      onClick={() => decision(f.id, 'accepted')}
                                    >
                                      <Check size={14} />
                                      {t('Принять')}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </article>
                        ))}
                      {review.findings.filter(
                        (f) =>
                          (filter === 'all' || f.category === filter) &&
                          `${f.title} ${f.explanation} ${f.quote}`
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                      ).length === 0 && (
                        <div className="empty">
                          <Search size={30} />
                          <h2>{t('Замечаний по этим условиям нет')}</h2>
                          <p>{t('Измените поиск или категорию.')}</p>
                        </div>
                      )}
                    </div>
                  </section>
                  {showDocument && (
                    <aside className="document-view">
                      <div>
                        <h2>
                          <FileText size={17} />
                          {t('Исходный документ')}
                        </h2>
                        <button
                          aria-label={t('Закрыть документ')}
                          onClick={() => setShowDocument(false)}
                        >
                          <X size={17} />
                        </button>
                      </div>
                      <p className="small muted">
                        {t(
                          'Порядок абзацев и строк таблиц сохранён. Номера страниц не восстанавливаются.',
                        )}
                      </p>
                      <div className="document-blocks">
                        {review.document.blocks.map((b) => (
                          <div
                            id={b.id}
                            key={b.id}
                            className={
                              selectedBlock === b.id ? 'document-block selected' : 'document-block'
                            }
                          >
                            <small>{location(b.location)}</small>
                            <p>{b.text}</p>
                          </div>
                        ))}
                      </div>
                    </aside>
                  )}
                </div>
                <div className="export-footer">
                  <button
                    className="text-button"
                    onClick={() =>
                      download('review.json', JSON.stringify(review, null, 2), 'application/json')
                    }
                  >
                    {t('Экспортировать полный результат в JSON')} <ArrowDownToLine size={14} />
                  </button>
                </div>
              </>
            )}
            {tab === 'history' && (
              <>
                <SimpleHeading
                  eyebrow={t('РАБОЧИЙ АРХИВ')}
                  title={t('История проверок')}
                  description={t('Возвращайтесь к документам и сохраняйте решения эксперта.')}
                />
                <div className="section-heading">
                  <span className="muted">{t('Последние 100 проверок')}</span>
                  <button
                    className="primary"
                    onClick={() => {
                      setTab('new');
                      setReview(null);
                    }}
                  >
                    <Plus size={16} />
                    {t('Новая проверка')}
                  </button>
                </div>
                {history.length === 0 ? (
                  <div className="empty card">
                    <FolderClock size={36} />
                    <h2>{t('Здесь появятся ваши проверки')}</h2>
                    <p>{t('Загрузите документ или попробуйте один из примеров.')}</p>
                  </div>
                ) : (
                  <div className="history-list">
                    {history.map((item) => (
                      <div className="history-row" key={item.id}>
                        <span className="example-icon">
                          <FileCheck2 size={23} />
                        </span>
                        <button onClick={() => openReview(item.id)}>
                          <strong>{item.name}</strong>
                          <small>
                            {new Date(item.createdAt).toLocaleString(dateLocale)} ·{' '}
                            {item.engine === 'hybrid' ? t('С моделью') : t('Локальная проверка')}
                          </small>
                        </button>
                        <span className="count-tag">
                          {item.count} {t('замечаний')}
                        </span>
                        <button
                          className="icon-button"
                          aria-label={t('Удалить {name}', { name: item.name })}
                          onClick={() => removeReview(item.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                        <button
                          aria-label={t('Открыть {name}', { name: item.name })}
                          className="icon-button"
                          onClick={() => openReview(item.id)}
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {tab === 'sources' && (
              <>
                <SimpleHeading
                  eyebrow={t('ПРОВЕРЯЕМЫЕ ОСНОВАНИЯ')}
                  title={t('Нормативные источники')}
                  description={t(
                    'Открытые официальные ресурсы для проверки выводов и уточнения требований.',
                  )}
                />
                <div className="notice">
                  <AlertTriangle size={19} />
                  <p>
                    {t(
                      'Применимость нормы зависит от предмета и режима закупки. Приложение не проверяет актуальность каждого ГОСТ и не определяет код ОКПД 2 автоматически. Ссылка на каталог — маршрут ручной проверки, а не доказательство нарушения.',
                    )}
                  </p>
                </div>
                <div className="source-grid">
                  {sources.map((s) => (
                    <a
                      className="card source-card"
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <BookOpen size={25} />
                      <ArrowUpRight className="source-arrow" size={20} />
                      <h2>{t(s.title)}</h2>
                      <p>{t(s.note)}</p>
                      <small>
                        {t('Справочник проекта ·')} {s.checkedAt}
                      </small>
                    </a>
                  ))}
                </div>
              </>
            )}
            {tab === 'settings' && (
              <>
                <SimpleHeading
                  eyebrow={t('ВАША СРЕДА')}
                  title={t('Настройки проверки')}
                  description={t('Оформление, язык и подключённая модель.')}
                />
                <AppearanceSettings />
                <section className="card settings-card model-card">
                  <div className="section-heading">
                    <h2>{t('Смысловая проверка')}</h2>
                    <span
                      className={model.modelConfigured ? 'status-badge connected' : 'status-badge'}
                    >
                      {model.modelConfigured ? t('Подключена') : t('Не подключена')}
                    </span>
                  </div>
                  <p className="model-name">
                    <span>{t('Модель:')}</span>
                    <strong>{model.model || t('Не выбрана')}</strong>
                  </p>
                  <a
                    className="model-guide-link"
                    href="https://github.com/arssedot/MIPT-Hackaton/blob/main/docs/MODEL.md"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BookOpen size={15} />
                    {t('Как работает модель')}
                    <ArrowUpRight size={13} />
                  </a>
                </section>
              </>
            )}
            {tab === 'help' && (
              <>
                <SimpleHeading
                  eyebrow={t('ОТ ДОКУМЕНТА К РЕШЕНИЮ')}
                  title={t('Как работает проверка')}
                  description={t('Четыре шага для предметного разбора закупочного ТЗ.')}
                />
                <div className="help-steps">
                  {[
                    {
                      title: 'Загрузите DOCX или TXT',
                      text: 'Система извлечёт абзацы и строки таблиц. Каждый фрагмент получит устойчивый идентификатор и адрес в документе.',
                    },
                    {
                      title: 'Выберите режим проверки',
                      text: 'Локальные правила сопоставляют отдельные требования. Подключённая модель выполняет смысловой анализ; для неё необходимы ключ API и разрешение на передачу открытого документа.',
                    },
                    {
                      title: 'Разберите замечания',
                      text: 'Откройте цитату и связанные фрагменты. Сверьте объяснение, рекомендацию и источник. Отметьте замечание принятым в работу или отклонённым.',
                    },
                    {
                      title: 'Передайте результат',
                      text: 'Скачайте отчёт Markdown или полный JSON. Отчёт содержит замечания и рекомендации; исходный DOCX автоматически не изменяется.',
                    },
                  ].map((step, i) => (
                    <div className="card help-step" key={t(step.title)}>
                      <span className="step-number">0{i + 1}</span>
                      <h2>{t(step.title)}</h2>
                      <p>{t(step.text)}</p>
                    </div>
                  ))}
                </div>
                <div className="notice">
                  <CircleHelp size={20} />
                  <p>
                    {t(
                      'Без модели это ограниченная локальная проверка. Ошибки API и неподтверждённые цитаты не скрываются: приложение сохраняет локальный результат и показывает предупреждение. Окончательная оценка документа остаётся за специалистом.',
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
        <footer className="app-footer">
          <span>{t('Контур ТЗ')}</span>
          <span>{t('Ясные требования. Обоснованные решения.')}</span>
        </footer>
      </div>
    </div>
  );
}
function Brand() {
  const { t } = usePreferences();
  return (
    <div className="brand">
      <span className="brand-mark">
        <FileCheck2 size={23} strokeWidth={1.8} />
      </span>
      <strong>
        {t('контур')}
        <span>{t('тз')}</span>
      </strong>
    </div>
  );
}
function SimpleHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const { t } = usePreferences();
  return (
    <div className="simple-heading">
      <div className="eyebrow">
        <span />
        {t(eyebrow)}
      </div>
      <h1>{t(title)}</h1>
      <p>{t(description)}</p>
    </div>
  );
}
