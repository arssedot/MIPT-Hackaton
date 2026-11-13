'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
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
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    if (!confirm('Удалить проверку вместе с извлечённым текстом и решениями?')) return;
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
      `# Результат проверки: ${review.name}`,
      `Дата: ${new Date(review.createdAt).toLocaleString('ru-RU')}`,
      `Режим: ${review.engine === 'hybrid' ? 'Локальные проверки и модель' : 'Только локальные проверки'}`,
      `Найдено замечаний: ${review.findings.length}`,
      ...review.warnings,
      ...review.findings.map(
        (f, i) =>
          `\n## ${i + 1}. ${f.title}\nКатегория: ${categoryLabels[f.category]}\nПриоритет: ${f.severity}\nСтатус: ${review.decisions[f.id] || 'не рассмотрено'}\nИсточник: ${review.document.blocks.find((b) => b.id === f.blockId)?.location}\n\n> ${f.quote.replace(/\n/g, '\n> ')}\n\n${f.explanation}\n\nРекомендация: ${f.recommendation}\n${f.sourceIds
            .map((id) => sources.find((s) => s.id === id))
            .filter(Boolean)
            .map((s) => `${s!.title}: ${s!.url}`)
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
        <p>Открываем рабочее пространство</p>
      </main>
    );
  if (!auth)
    return (
      <main className="login-screen">
        <div className="login-art">
          <span className="eyebrow">ИНТЕЛЛЕКТУАЛЬНАЯ ПРОВЕРКА ЗАКУПОК</span>
          <h1>
            Сильное ТЗ
            <br />
            начинается
            <br />с ясности<span>.</span>
          </h1>
          <p>
            Находите противоречия, проверяйте требования
            <br />и дорабатывайте документы в одном пространстве.
          </p>
          <div className="orbital">
            <FileCheck2 size={72} strokeWidth={1} />
          </div>
        </div>
        <form className="login-card" onSubmit={login}>
          <Brand />
          <div>
            <h2>Ваше рабочее пространство</h2>
            <p className="muted">Введите пароль, созданный при настройке проекта.</p>
          </div>
          <label>
            Пароль доступа
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
              {error}
            </div>
          )}
          <button className="primary" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : 'Войти в кабинет'}
            <ArrowRight size={18} />
          </button>
          <p className="small muted">
            <LockKeyhole size={13} /> Пароль хранится в локальном файле .local/access.txt
          </p>
        </form>
      </main>
    );
  return (
    <div className="app-shell">
      <aside id="main-navigation" className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
        <Brand />
        <div className="workspace-label">
          <span className="workspace-avatar">М</span>
          <div>
            Рабочее пространство<small>Команда закупок</small>
          </div>
          <span className="local-dot" />
        </div>
        <p className="nav-heading">РАБОТА С ДОКУМЕНТАМИ</p>
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
              {item.label}
              {tab === item.id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-icon">
            <ShieldCheck size={20} />
          </div>
          <strong>Документы под контролем</strong>
          <p>Обработка остаётся локальной, пока вы сами не включите модель.</p>
          <span>
            Локальная среда <span className="local-dot" />
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
            Настройки
          </button>
          <button
            className={tab === 'help' ? 'nav-item active' : 'nav-item'}
            onClick={() => {
              setTab('help');
              setMobileNav(false);
            }}
          >
            <CircleHelp size={18} />
            Как это работает
          </button>
          <div className="profile">
            <span className="profile-avatar">Э</span>
            <div>
              Эксперт по закупкам<small>Общее пространство</small>
            </div>
            <button
              title="Выйти"
              aria-label="Выйти"
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
            aria-label="Закрыть меню"
            onClick={() => setMobileNav(false)}
          />
        )}
      </>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <button
              className="mobile-menu icon-button"
              aria-label="Меню"
              aria-controls="main-navigation"
              aria-expanded={mobileNav}
              onClick={() => setMobileNav(!mobileNav)}
            >
              <PanelLeftClose size={20} />
            </button>
            <span className="muted">Рабочее пространство</span>
            <ChevronRight size={13} />
            <span>
              {tab === 'new'
                ? 'Проверка документа'
                : tab === 'history'
                  ? 'История проверок'
                  : tab === 'sources'
                    ? 'Нормативные источники'
                    : tab === 'settings'
                      ? 'Настройки'
                      : 'Как это работает'}
            </span>
          </div>
          <span className="environment">
            <span className="local-dot" /> localhost <span className="env-divider">/</span> MVP 0.1
          </span>
        </header>
        <main className="content">
          {error && (
            <div role="alert" className="error global-error">
              {error}
              <button aria-label="Закрыть ошибку" onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {tab === 'new' && !review && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span /> ОТ ТРЕБОВАНИЙ К УВЕРЕННОСТИ
                  </div>
                  <h1>
                    Проверьте ТЗ.
                    <br />
                    <span>До начала закупки.</span>
                  </h1>
                  <p>
                    Замечайте противоречия и спорные требования.
                    <br />
                    Получайте понятные рекомендации с привязкой к документу.
                  </p>
                </div>
                <div className="heading-art">
                  <div className="art-ring" />
                  <div className="art-document">
                    <div className="art-doc-top">
                      <FileText size={22} />
                      <span>ТЕХНИЧЕСКОЕ ЗАДАНИЕ</span>
                    </div>
                    <i />
                    <i />
                    <i />
                    <div className="art-highlight">
                      <Check size={13} /> Требования проверены
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
              <div className="upload-grid">
                <section className="card upload-card">
                  <div className="card-title">
                    <span className="step-number">01</span>
                    <div>
                      <h2>Добавьте техническое задание</h2>
                      <p>Начните с документа, который нужно проверить</p>
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
                        <p>{(file.size / 1024).toFixed(1)} КБ · Готов к проверке</p>
                        <button className="text-button" onClick={() => input.current?.click()}>
                          Выбрать другой файл
                        </button>
                      </>
                    ) : (
                      <>
                        <strong>Перетащите документ сюда</strong>
                        <p>
                          или{' '}
                          <button className="inline-link" onClick={() => input.current?.click()}>
                            выберите файл на компьютере
                          </button>
                        </p>
                        <span className="file-formats">
                          DOCX <span>·</span> TXT <span>·</span> до 8 МБ
                        </span>
                      </>
                    )}
                    <input
                      ref={input}
                      className="sr-only"
                      type="file"
                      accept=".docx,.txt"
                      aria-label="Выберите техническое задание"
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
                          Подключить смысловую проверку <span className="mini-tag">AI</span>
                        </strong>
                        <p>
                          {model.modelConfigured
                            ? `Модель ${model.model} сопоставит требования по смыслу`
                            : 'Добавьте ключ и модель в настройках окружения'}
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
                          Документ открытый, не содержит конфиденциальных данных. Разрешаю отправить
                          его текст во внешний API.
                        </div>
                      </label>
                    )}
                  </div>
                  <div className="upload-footer">
                    <span>
                      <LockKeyhole size={14} />
                      {useModel
                        ? 'Текст будет передан провайдеру модели'
                        : 'Документ обрабатывается локально'}
                    </span>
                    <button
                      className="primary"
                      disabled={!file || busy || (useModel && !publicData)}
                      onClick={analyze}
                    >
                      {busy ? (
                        <>
                          <LoaderCircle size={18} className="spin" />
                          Проверяем документ
                        </>
                      ) : (
                        <>
                          <Sparkles size={17} />
                          Начать проверку
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </div>
                  {busy && (
                    <p className="progress-message" role="status">
                      Извлекаем структуру и сопоставляем требования. Проверка моделью может занять
                      до 90 секунд.
                    </p>
                  )}
                </section>
                <aside className="checklist-card">
                  <div className="mini-eyebrow">ФОКУС ПРОВЕРКИ</div>
                  <h2>
                    Внимание к тому,
                    <br /> что легко упустить
                  </h2>
                  <p>
                    Семь направлений проверки
                    <br /> в одном рабочем процессе.
                  </p>
                  <ul>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <li key={key}>
                        <span>
                          <Check size={12} />
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
                  <div className="checklist-foot">
                    <ShieldCheck size={16} /> Финальное решение — за экспертом
                  </div>
                </aside>
              </div>
              <section className="examples">
                <div className="section-heading">
                  <div>
                    <h2>Сначала попробуйте на примере</h2>
                    <p>Синтетические документы для знакомства с проверкой</p>
                  </div>
                  <span className="small muted">Данные не покидают устройство без разрешения</span>
                </div>
                <div className="example-grid">
                  {demos.map((demo, i) => (
                    <button
                      className="example-card"
                      key={demo.id}
                      disabled={busy}
                      onClick={() => {
                        selectFile(
                          new File([demo.text], `${demo.name}.txt`, { type: 'text/plain' }),
                        );
                        input.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                    >
                      <span className={`example-icon example-${i}`}>
                        <FileText size={23} />
                      </span>
                      <div>
                        <strong>{demo.name}</strong>
                        <p>{demo.description}</p>
                        <span>
                          Выбрать пример <ArrowUpRight size={13} />
                        </span>
                      </div>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              </section>
              <div className="bottom-note">
                <span>✦</span>
                <p>Хорошее техническое задание начинается с точных требований.</p>
                <span>КОНТУР ТЗ / 2026</span>
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
                    ← Новая проверка
                  </button>
                  <h1>Результаты проверки</h1>
                  <p className="muted file-heading">
                    <FileText size={16} />
                    {review.name}
                    <span>·</span>
                    {new Date(review.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
                <div className="result-actions">
                  <button className="secondary" onClick={() => setShowDocument(!showDocument)}>
                    <FileText size={16} />
                    {showDocument ? 'Скрыть документ' : 'Открыть документ'}
                  </button>
                  <button className="primary" onClick={exportReport}>
                    <ArrowDownToLine size={16} />
                    Скачать отчёт
                  </button>
                </div>
              </div>
              <div className="stat-grid">
                <div className="stat-card">
                  <span>Всего замечаний</span>
                  <strong>{review.findings.length.toString().padStart(2, '0')}</strong>
                  <small>По всем категориям</small>
                </div>
                <div className="stat-card">
                  <span>Высокий приоритет</span>
                  <strong className="danger-text">
                    {review.findings
                      .filter((f) => f.severity === 'high')
                      .length.toString()
                      .padStart(2, '0')}
                  </strong>
                  <small>Рекомендуем разобрать первыми</small>
                </div>
                <div className="stat-card">
                  <span>Рассмотрено экспертом</span>
                  <strong className="purple-text">
                    {Object.keys(review.decisions).length.toString().padStart(2, '0')}
                  </strong>
                  <small>Из {review.findings.length} замечаний</small>
                </div>
                <div className="stat-card">
                  <span>Режим проверки</span>
                  <strong className="engine-label">
                    {review.engine === 'hybrid' ? 'Гибридный' : 'Локальный'}
                  </strong>
                  <small>
                    {(review.durationMs / 1000).toFixed(1)} с · {review.document.blocks.length}{' '}
                    фрагментов
                  </small>
                </div>
              </div>
              <div className="notice">
                <ShieldCheck size={19} />
                <div>
                  <strong>Итоговое заключение</strong>
                  <p>
                    {review.findings.length
                      ? `Найдено ${review.findings.length} замечаний, из них ${review.findings.filter((f) => f.confidence === 'review').length} требуют дополнительной проверки. До публикации закупки разберите замечания и согласуйте изменения с ответственным специалистом.`
                      : 'В пределах выполненных проверок замечаний не найдено. Это не подтверждает соответствие всем требованиям.'}
                  </p>
                  {review.warnings.map((w, i) => (
                    <p className="small" key={i}>
                      {w}
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
                        aria-label="Поиск замечаний"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Поиск по замечаниям"
                      />
                    </label>
                    <select
                      aria-label="Категория замечаний"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as Category | 'all')}
                    >
                      <option value="all">Все категории</option>
                      {Object.entries(categoryLabels).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
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
                                ? 'Высокий'
                                : f.severity === 'medium'
                                  ? 'Средний'
                                  : 'Низкий'}{' '}
                              приоритет
                            </span>
                            <span className="category">{categoryLabels[f.category]}</span>
                            <span className="finding-number">{String(i + 1).padStart(2, '0')}</span>
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
                              Связанные фрагменты:{' '}
                              {[...new Set(f.relatedBlockIds)].map((id) => (
                                <button
                                  key={id}
                                  onClick={() => {
                                    setShowDocument(true);
                                    setSelectedBlock(id);
                                  }}
                                >
                                  {review.document.blocks.find((b) => b.id === id)?.location || id}
                                </button>
                              ))}
                            </div>
                          )}
                          <p>{f.explanation}</p>
                          <div className="recommendation">
                            <span>
                              <Sparkles size={14} />
                              Рекомендация
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
                                {s!.title}
                                <ArrowUpRight size={12} />
                              </a>
                            ))}
                          <div className="finding-footer">
                            <span>
                              {f.confidence === 'confirmed'
                                ? 'Прямое противоречие в тексте'
                                : 'Требует проверки экспертом'}{' '}
                              · {f.origin === 'model' ? 'Модель' : 'Локальная проверка'}
                            </span>
                            <div>
                              {review.decisions[f.id] ? (
                                <span className="decision-label">
                                  <CheckCheck size={15} />
                                  {review.decisions[f.id] === 'accepted'
                                    ? 'Принято в работу'
                                    : 'Отклонено'}
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
                                    Изменить
                                  </button>
                                </span>
                              ) : (
                                <>
                                  <button
                                    className="text-button muted"
                                    onClick={() => decision(f.id, 'dismissed')}
                                  >
                                    Отклонить
                                  </button>
                                  <button
                                    className="accept-button"
                                    onClick={() => decision(f.id, 'accepted')}
                                  >
                                    <Check size={14} />
                                    Принять
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
                        <h2>Замечаний по этим условиям нет</h2>
                        <p>Измените поиск или категорию.</p>
                      </div>
                    )}
                  </div>
                </section>
                {showDocument && (
                  <aside className="document-view">
                    <div>
                      <h2>
                        <FileText size={17} />
                        Исходный документ
                      </h2>
                      <button aria-label="Закрыть документ" onClick={() => setShowDocument(false)}>
                        <X size={17} />
                      </button>
                    </div>
                    <p className="small muted">
                      Порядок абзацев и строк таблиц сохранён. Номера страниц не восстанавливаются.
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
                          <small>{b.location}</small>
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
                  Экспортировать полный результат в JSON <ArrowDownToLine size={14} />
                </button>
              </div>
            </>
          )}
          {tab === 'history' && (
            <>
              <SimpleHeading
                eyebrow="РАБОЧИЙ АРХИВ"
                title="История проверок"
                description="Возвращайтесь к документам и сохраняйте решения эксперта."
              />
              <div className="section-heading">
                <span className="muted">Последние 100 проверок</span>
                <button
                  className="primary"
                  onClick={() => {
                    setTab('new');
                    setReview(null);
                  }}
                >
                  <Plus size={16} />
                  Новая проверка
                </button>
              </div>
              {history.length === 0 ? (
                <div className="empty card">
                  <FolderClock size={36} />
                  <h2>Здесь появятся ваши проверки</h2>
                  <p>Загрузите документ или попробуйте один из примеров.</p>
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
                          {new Date(item.createdAt).toLocaleString('ru-RU')} ·{' '}
                          {item.engine === 'hybrid' ? 'С моделью' : 'Локальная проверка'}
                        </small>
                      </button>
                      <span className="count-tag">{item.count} замечаний</span>
                      <button
                        className="icon-button"
                        aria-label={`Удалить ${item.name}`}
                        onClick={() => removeReview(item.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                      <button
                        aria-label={`Открыть ${item.name}`}
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
                eyebrow="ПРОВЕРЯЕМЫЕ ОСНОВАНИЯ"
                title="Нормативные источники"
                description="Открытые официальные ресурсы для проверки выводов и уточнения требований."
              />
              <div className="notice">
                <AlertTriangle size={19} />
                <p>
                  Применимость нормы зависит от предмета и режима закупки. Приложение не проверяет
                  актуальность каждого ГОСТ и не определяет код ОКПД 2 автоматически. Ссылка на
                  каталог — маршрут ручной проверки, а не доказательство нарушения.
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
                    <h2>{s.title}</h2>
                    <p>{s.note}</p>
                    <small>Справочник проекта · {s.checkedAt}</small>
                  </a>
                ))}
              </div>
            </>
          )}
          {tab === 'settings' && (
            <>
              <SimpleHeading
                eyebrow="ВАША СРЕДА"
                title="Настройки проверки"
                description="Подключение модели и управление локальным окружением."
              />
              <section className="card settings-card">
                <div className="section-heading">
                  <h2>Смысловая проверка</h2>
                  <span
                    className={model.modelConfigured ? 'status-badge connected' : 'status-badge'}
                  >
                    {model.modelConfigured ? 'Подключена' : 'Не подключена'}
                  </span>
                </div>
                <p>
                  Модель: <strong>{model.model || 'Не выбрана'}</strong>
                </p>
                <p>
                  Добавьте ключ провайдера и название модели в локальный файл <code>.env</code>,
                  задайте <code>LLM_ENABLED=true</code> и перезапустите приложение. Используется
                  API, совместимый с Chat Completions.
                </p>
                <dl>
                  <div>
                    <dt>LLM_BASE_URL</dt>
                    <dd>Базовый HTTPS-адрес API провайдера</dd>
                  </div>
                  <div>
                    <dt>LLM_MODEL</dt>
                    <dd>Доступная вам модель с поддержкой JSON</dd>
                  </div>
                  <div>
                    <dt>LLM_API_KEY</dt>
                    <dd>Ключ доступа; хранится только на сервере</dd>
                  </div>
                </dl>
                <div className="notice">
                  <LockKeyhole size={18} />
                  <p>
                    Ключ не передаётся браузеру. Каждый запуск модели отдельно требует
                    подтверждения, что документ открытый.
                  </p>
                </div>
              </section>
              <section className="card settings-card">
                <h2>Локальное рабочее пространство</h2>
                <p>
                  Данные проверок, извлечённый текст и решения сохраняются в PostgreSQL. Все
                  пользователи с паролем работают в одном пространстве. Исходные бинарные файлы
                  после извлечения текста не сохраняются.
                </p>
                <p className="small muted">
                  Инструкция по смене пароля, резервному копированию и переносу на сервер — в README
                  и docs/HANDOFF.md.
                </p>
              </section>
            </>
          )}
          {tab === 'help' && (
            <>
              <SimpleHeading
                eyebrow="ОТ ДОКУМЕНТА К РЕШЕНИЮ"
                title="Как работает проверка"
                description="Четыре шага для предметного разбора закупочного ТЗ."
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
                  <div className="card help-step" key={step.title}>
                    <span className="step-number">0{i + 1}</span>
                    <h2>{step.title}</h2>
                    <p>{step.text}</p>
                  </div>
                ))}
              </div>
              <div className="notice">
                <CircleHelp size={20} />
                <p>
                  Без модели это ограниченная локальная проверка. Ошибки API и неподтверждённые
                  цитаты не скрываются: приложение сохраняет локальный результат и показывает
                  предупреждение. Окончательная оценка документа остаётся за специалистом.
                </p>
              </div>
            </>
          )}
        </main>
        <footer className="app-footer">
          <span>Контур ТЗ</span>
          <span>Ясные требования. Обоснованные решения.</span>
          <span>Создано для кейса МФТИ</span>
        </footer>
      </div>
    </div>
  );
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <FileCheck2 size={23} strokeWidth={1.8} />
      </span>
      <strong>
        контур<span>тз</span>
      </strong>
      <small>BETA</small>
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
  return (
    <div className="simple-heading">
      <div className="eyebrow">
        <span />
        {eyebrow}
      </div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
