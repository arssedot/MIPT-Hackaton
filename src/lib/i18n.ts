export type Language = 'ru' | 'en';
export const english: Record<string, string> = {
  'Введите пароль для доступа к проверке документов.':
    'Enter your password to access document review.',
  'Доступ к вашему рабочему пространству': 'Access to your workspace',
  'Подсказка о настройках': 'Workspace customization tip',
  'Тема, язык и размер текста — в настройках.':
    'Theme, language and text size are available in Settings.',
  'Настроить интерфейс': 'Customize workspace',
  'Не показывать подсказку': 'Dismiss customization tip',
  'Оформление, язык и подключённая модель.': 'Appearance, language and your connected model.',
  'Как работает модель': 'How the model works',
  'Не удалось выполнить запрос.': 'The request could not be completed.',
  'Выберите DOCX или TXT размером до 8 МБ.': 'Choose a DOCX or TXT file up to 8 MB.',
  'Удалить проверку вместе с извлечённым текстом и решениями?':
    'Delete this review, its extracted text and all decisions?',
  'Локальные проверки и модель': 'Local checks and AI analysis',
  'Только локальные проверки': 'Local checks only',
  'не рассмотрено': 'not reviewed',
  'Проверка документа': 'Document review',
  'История проверок': 'Review history',
  'Нормативные источники': 'Reference sources',
  'Открываем рабочее пространство': 'Opening your workspace',
  'ИНТЕЛЛЕКТУАЛЬНАЯ ПРОВЕРКА ЗАКУПОК': 'INTELLIGENT PROCUREMENT REVIEW',
  'Сильное ТЗ': 'Better specifications',
  начинается: 'begin with',
  'с ясности': 'clarity',
  'Находите противоречия, проверяйте требования': 'Find contradictions, check requirements',
  'и дорабатывайте документы в одном пространстве.': 'and refine documents in one workspace.',
  'Ваше рабочее пространство': 'Your workspace',
  'Пароль доступа': 'Access password',
  'Войти в кабинет': 'Sign in',
  М: 'W',
  'Рабочее пространство': 'Workspace',
  'Команда закупок': 'Procurement team',
  'РАБОТА С ДОКУМЕНТАМИ': 'DOCUMENT WORKSPACE',
  'Документы под контролем': 'Your documents, in focus',
  'Обработка остаётся локальной, пока вы сами не включите модель.':
    'Processing stays local until you enable AI analysis.',
  'Локальная среда': 'Local environment',
  Настройки: 'Settings',
  'Как это работает': 'How it works',
  Э: 'R',
  'Эксперт по закупкам': 'Procurement reviewer',
  'Общее пространство': 'Shared workspace',
  Выйти: 'Sign out',
  'Закрыть меню': 'Close menu',
  Меню: 'Menu',
  'Закрыть ошибку': 'Dismiss error',
  'ОТ ТРЕБОВАНИЙ К УВЕРЕННОСТИ': 'FROM REQUIREMENTS TO CONFIDENCE',
  'Проверьте ТЗ.': 'Review your specs.',
  'До начала закупки.': 'Before procurement.',
  'Замечайте противоречия и спорные требования.': 'Spot contradictions and ambiguous requirements.',
  'Получайте понятные рекомендации с привязкой к документу.':
    'Get clear recommendations linked to the source.',
  'ТЕХНИЧЕСКОЕ ЗАДАНИЕ': 'TECHNICAL SPECIFICATION',
  'Требования проверены': 'Requirements reviewed',
  'Добавьте техническое задание': 'Add a technical specification',
  'Начните с документа, который нужно проверить': 'Start with the document you want to review',
  'КБ · Готов к проверке': 'KB · Ready to review',
  'Выбрать другой файл': 'Choose another file',
  'Перетащите документ сюда': 'Drop your document here',
  или: 'or',
  'выберите файл на компьютере': 'choose a file from your computer',
  'до 8 МБ': 'up to 8 MB',
  'Выберите техническое задание': 'Choose a technical specification',
  'Подключить смысловую проверку': 'Enable AI analysis',
  'Добавьте ключ и модель в настройках окружения':
    'Add an API key and model to the environment settings',
  'Документ открытый, не содержит конфиденциальных данных. Разрешаю отправить его текст во внешний API.':
    'This document is public and contains no confidential data. I allow its text to be sent to an external API.',
  'Текст будет передан провайдеру модели': 'Text will be sent to the AI provider',
  'Документ обрабатывается локально': 'Document processing stays local',
  'Проверяем документ': 'Reviewing document',
  'Начать проверку': 'Start review',
  'Извлекаем структуру и сопоставляем требования. Ждём ответ модели до 60 секунд; при сбое покажем локальные результаты.':
    'Extracting the structure and comparing requirements. Waiting up to 60 seconds for AI; local results will be shown if it fails.',
  'Извлекаем структуру документа и выполняем локальные проверки.':
    'Extracting the document structure and running local checks.',
  'Прервать ожидание': 'Stop waiting',
  'Время ожидания ответа истекло. Проверьте историю перед повторным запуском.':
    'The response timed out. Check review history before starting again.',
  'Ожидание прервано. Проверка могла сохраниться в истории; проверьте её перед повторным запуском.':
    'Waiting stopped. The review may have been saved in history; check it before starting again.',
  'Модель не ответила за 60 секунд. Выполнены только локальные проверки.':
    'The model did not respond within 60 seconds. Only local checks were completed.',
  'Ответ модели не является корректным JSON. Выполнены только локальные проверки.':
    'The model response is not valid JSON. Only local checks were completed.',
  'Не удалось связаться с провайдером модели. Выполнены только локальные проверки.':
    'The model provider could not be reached. Only local checks were completed.',
  'Провайдер модели ограничил запросы (HTTP 429). Повторите позже или выберите другую модель.':
    'The model provider rate-limited this request (HTTP 429). Try again later or choose another model.',
  'Провайдер модели отклонил запрос из-за баланса или лимита расходов (HTTP 402).':
    'The model provider rejected the request because of the balance or spending limit (HTTP 402).',
  'Провайдер модели не принял API-ключ (HTTP 401). Проверьте ключ в настройках окружения.':
    'The model provider rejected the API key (HTTP 401). Check the key in the environment settings.',
  'ФОКУС ПРОВЕРКИ': 'WHAT WE LOOK FOR',
  'Внимание к тому,': 'A closer look at',
  'что легко упустить': 'the details that matter',
  'Семь направлений проверки': 'Seven review categories',
  'в одном рабочем процессе.': 'in one workflow.',
  'Финальное решение — за экспертом': 'The final decision is yours',
  'Сначала попробуйте на примере': 'Explore with a sample first',
  'Синтетические документы для знакомства с проверкой':
    'Synthetic documents to try the review workflow',
  'Данные не покидают устройство без разрешения':
    'Data stays on your device unless you allow sharing',
  'Выбрать пример': 'Choose sample',
  'Хорошее техническое задание начинается с точных требований.':
    'A good specification starts with precise requirements.',
  'КОНТУР ТЗ / 2026': 'KONTUR TZ / 2026',
  '← Новая проверка': '← New review',
  'Результаты проверки': 'Review results',
  'Скрыть документ': 'Hide document',
  'Открыть документ': 'View document',
  'Скачать отчёт': 'Download report',
  'Всего замечаний': 'Total findings',
  'По всем категориям': 'Across all categories',
  'Высокий приоритет': 'High priority',
  'Рекомендуем разобрать первыми': 'Recommended to review first',
  'Рассмотрено экспертом': 'Reviewed by an expert',
  Из: 'Of',
  замечаний: 'findings',
  'Режим проверки': 'Review mode',
  Гибридный: 'Hybrid',
  Локальный: 'Local',
  'с ·': 's ·',
  фрагментов: 'fragments',
  'Итоговое заключение': 'Review summary',
  'В пределах выполненных проверок замечаний не найдено. Это не подтверждает соответствие всем требованиям.':
    'No findings were identified within the checks performed. This does not confirm compliance with all requirements.',
  'Поиск замечаний': 'Search findings',
  'Поиск по замечаниям': 'Search findings',
  'Категория замечаний': 'Finding category',
  'Все категории': 'All categories',
  Высокий: 'High',
  Средний: 'Medium',
  Низкий: 'Low',
  приоритет: 'priority',
  'Связанные фрагменты:': 'Related fragments:',
  Рекомендация: 'Recommendation',
  'Прямое противоречие в тексте': 'Direct contradiction in the text',
  'Требует проверки экспертом': 'Requires expert review',
  Модель: 'AI model',
  'Локальная проверка': 'Local checks',
  'Принято в работу': 'Accepted for action',
  Отклонено: 'Dismissed',
  Изменить: 'Change',
  Отклонить: 'Dismiss',
  Принять: 'Accept',
  'Замечаний по этим условиям нет': 'No matching findings',
  'Измените поиск или категорию.': 'Try another search or category.',
  'Исходный документ': 'Source document',
  'Закрыть документ': 'Close document',
  'Порядок абзацев и строк таблиц сохранён. Номера страниц не восстанавливаются.':
    'Paragraph and table row order is preserved. Page numbers are not reconstructed.',
  'Экспортировать полный результат в JSON': 'Export the full result as JSON',
  'РАБОЧИЙ АРХИВ': 'YOUR REVIEW ARCHIVE',
  'Возвращайтесь к документам и сохраняйте решения эксперта.':
    'Revisit documents and keep track of review decisions.',
  'Последние 100 проверок': 'Latest 100 reviews',
  'Новая проверка': 'New review',
  'Здесь появятся ваши проверки': 'Your reviews will appear here',
  'Загрузите документ или попробуйте один из примеров.':
    'Upload a document or try one of the samples.',
  'С моделью': 'AI-assisted',
  'ПРОВЕРЯЕМЫЕ ОСНОВАНИЯ': 'TRACEABLE REFERENCES',
  'Открытые официальные ресурсы для проверки выводов и уточнения требований.':
    'Official public resources to verify findings and clarify requirements.',
  'Применимость нормы зависит от предмета и режима закупки. Приложение не проверяет актуальность каждого ГОСТ и не определяет код ОКПД 2 автоматически. Ссылка на каталог — маршрут ручной проверки, а не доказательство нарушения.':
    'Applicable rules depend on the subject and procurement framework. The app does not automatically verify each GOST standard or assign OKPD 2 codes. Catalog links support manual verification and are not proof of a violation.',
  'Справочник проекта ·': 'Project reference catalog ·',
  'ВАША СРЕДА': 'YOUR ENVIRONMENT',
  'Настройки проверки': 'Review settings',
  'Смысловая проверка': 'AI analysis',
  Подключена: 'Configured',
  'Не подключена': 'Not configured',
  'Модель:': 'Model:',
  'Не выбрана': 'Not selected',
  'ОТ ДОКУМЕНТА К РЕШЕНИЮ': 'FROM DOCUMENT TO DECISION',
  'Как работает проверка': 'How document review works',
  'Четыре шага для предметного разбора закупочного ТЗ.':
    'Four steps to a clear, actionable procurement review.',
  'Загрузите DOCX или TXT': 'Upload a DOCX or TXT file',
  'Система извлечёт абзацы и строки таблиц. Каждый фрагмент получит устойчивый идентификатор и адрес в документе.':
    'The app extracts paragraphs and table rows, giving each fragment an identifier and a location in the document.',
  'Выберите режим проверки': 'Choose a review mode',
  'Локальные правила сопоставляют отдельные требования. Подключённая модель выполняет смысловой анализ; для неё необходимы ключ API и разрешение на передачу открытого документа.':
    'Local rules compare specific requirements. AI analysis checks meaning and relationships; it requires an API key and permission to share a public document.',
  'Разберите замечания': 'Review the findings',
  'Откройте цитату и связанные фрагменты. Сверьте объяснение, рекомендацию и источник. Отметьте замечание принятым в работу или отклонённым.':
    'Open the quote and related fragments. Check the explanation, recommendation and reference. Accept the finding for action or dismiss it.',
  'Передайте результат': 'Share the result',
  'Скачайте отчёт Markdown или полный JSON. Отчёт содержит замечания и рекомендации; исходный DOCX автоматически не изменяется.':
    'Download a Markdown report or the full JSON result. Reports include findings and recommendations; the original DOCX is not modified automatically.',
  'Без модели это ограниченная локальная проверка. Ошибки API и неподтверждённые цитаты не скрываются: приложение сохраняет локальный результат и показывает предупреждение. Окончательная оценка документа остаётся за специалистом.':
    'Without a model, only a limited set of local checks is performed. API failures and unverified quotes are reported: the app saves local results with a warning. The final assessment remains with the reviewer.',
  'Контур ТЗ': 'Kontur TZ',
  'Ясные требования. Обоснованные решения.': 'Clear requirements. Informed decisions.',
  контур: 'kontur',
  тз: 'tz',
  'Поставка оборудования': 'Equipment procurement',
  'Противоречие в характеристиках и незаполненное поле':
    'Conflicting specifications and a missing value',
  'Оснащение лаборатории': 'Laboratory equipment',
  'Состав комплекта, происхождение и нормативы': 'Kit contents, origin requirements and standards',
  '44-ФЗ, статья 33 — описание объекта закупки':
    'Federal Law 44-FZ, Article 33 — procurement specifications',
  'Применимость зависит от режима закупки. Перед применением сверить действующую редакцию и исключения.':
    'Applicability depends on the procurement framework. Verify the current version and exceptions before applying it.',
  'Росстат — общероссийские классификаторы, ОКПД 2':
    'Rosstat — national classifications and OKPD 2',
  'Подбор кода требует описания конкретной позиции и проверки актуальной версии классификатора.':
    'Code selection requires a description of the specific item and the current classifier version.',
  'Росстандарт — каталог национальных стандартов': 'Rosstandart — national standards catalog',
  'Каталог для ручной проверки статуса, названия и области применения. Статус конкретного ГОСТ автоматически не подтверждается.':
    'A catalog for manually checking status, title and scope. The status of a particular GOST standard is not automatically verified.',
  Противоречия: 'Contradictions',
  Конкуренция: 'Competition',
  Характеристики: 'Specifications',
  'Коды ОКПД 2': 'OKPD 2 codes',
  Гарантии: 'Warranty terms',
  Нормативы: 'Standards',
  Комплектность: 'Completeness',
  'Неверный пароль.': 'Incorrect password.',
  'Некорректное решение.': 'Invalid review decision.',
  'Замечание не найдено.': 'Finding not found.',
  'Размер документа должен быть от 1 байта до 8 МБ.':
    'Document size must be between 1 byte and 8 MB.',
  'Распакованный DOCX превышает лимит 12 МБ.': 'The extracted DOCX exceeds the 12 MB limit.',
  'В DOCX отсутствует основной документ.': 'The DOCX file is missing its main document.',
  'DOCX с XML-сущностями не поддерживается.':
    'DOCX files with XML entity declarations are not supported.',
  'DOCX содержит повреждённый XML.': 'The DOCX file contains invalid XML.',
  'Не удалось прочитать структуру DOCX.': 'The DOCX structure could not be read.',
  'Документ слишком большой: максимум 160 000 символов и 3000 фрагментов.':
    'The document is too large: maximum 160,000 characters and 3,000 fragments.',
  'Некорректный размер запроса. Максимум 8 МБ.':
    'Invalid request size. The maximum file size is 8 MB.',
  'Отправлять во внешний API можно только открытые документы. Подтвердите это перед проверкой.':
    'Only public documents may be sent to an external API. Confirm this before starting the review.',
  'Модель не настроена: добавьте LLM_API_KEY, LLM_MODEL и LLM_ENABLED=true в .env.':
    'AI analysis is not configured. Add LLM_API_KEY, LLM_MODEL and LLM_ENABLED=true to .env.',
  'Внешний API должен использовать HTTPS.': 'External APIs must use HTTPS.',
  'Модель вернула неподдерживаемый ответ.': 'The model returned an unsupported response.',
  'Требуется вход.': 'Please sign in.',
  'Недопустимый источник запроса.': 'This request origin is not allowed.',
  'Слишком много попыток. Повторите через минуту.': 'Too many attempts. Try again in a minute.',
  'Слишком много проверок. Повторите через минуту.': 'Too many reviews. Try again in a minute.',
  'Не удалось выполнить операцию. Проверьте подключение к базе и настройки приложения.':
    'The operation failed. Check the database connection and application settings.',
  'Проверка не найдена.': 'Review not found.',
  'Выберите файл DOCX или TXT.': 'Choose a DOCX or TXT file.',
  'Поддерживаются только DOCX и TXT.': 'Only DOCX and TXT files are supported.',
  'TXT должен быть в кодировке UTF-8.': 'TXT files must use UTF-8 encoding.',
  'Файл DOCX повреждён, защищён паролем или имеет неверный формат.':
    'The DOCX file is corrupted, password-protected or invalid.',
  'Недостаточно текста для проверки. Нужен документ с текстовым слоем.':
    'There is not enough text to review. Choose a document with a text layer.',
  'Результат помогает доработать ТЗ и требует проверки специалистом. Отсутствие замечаний не подтверждает соответствие требованиям.':
    'This result supports document revision and requires expert review. An absence of findings does not confirm compliance.',
  'Смысловой анализ моделью не выполнялся. Локальные проверки покрывают ограниченный набор правил.':
    'AI analysis was not performed. Local checks cover a limited set of rules.',
  'Ответ модели не прошёл проверку структуры. Использованы только локальные проверки.':
    'The model response failed validation. Only local checks were used.',
  'Ответ модели не прошёл проверку цитат и привязок. Результат модели отклонён.':
    'The model response failed quote or source-location validation and was rejected.',
  'Ответ модели содержит непроверенный нормативный источник.':
    'The model response contains an unverified reference.',
  'Найдено {total} замечаний, из них {pending} требуют дополнительной проверки. До публикации закупки разберите замечания и согласуйте изменения с ответственным специалистом.':
    '{total} findings identified; {pending} require further verification. Review the findings and agree on changes with the responsible specialist before publishing the procurement.',
  'Модель {model} сопоставит требования по смыслу':
    'Model {model} will compare requirements by meaning',
  'Удалить {name}': 'Delete {name}',
  'Открыть {name}': 'Open {name}',
  'Результат проверки': 'Review report',
  Дата: 'Date',
  Категория: 'Category',
  Приоритет: 'Priority',
  Статус: 'Status',
  Источник: 'Source',
  'Настройки интерфейса': 'Workspace preferences',
  Оформление: 'Appearance',
  Светлая: 'Light',
  Тёмная: 'Dark',
  Системная: 'System',
  'Светлая тема': 'Light theme',
  'Тёмная тема': 'Dark theme',
  'Язык интерфейса': 'Interface language',
  'Размер текста': 'Text size',
  Обычный: 'Standard',
  Крупный: 'Large',
  'Очень крупный': 'Extra large',
  'Сделайте пространство удобным для себя.': 'Make this workspace your own.',
  'Тема, язык и размер текста сохраняются в этом браузере.':
    'Theme, language and text size are saved in this browser.',
  'Язык интерфейса не изменяет текст документов и найденных замечаний.':
    'Interface language does not change document text or the language of findings.',
  'Точный текст. Ясные решения.': 'Precise text. Clear decisions.',
  'Проверьте, насколько удобно читать этот текст.': 'Check how comfortable this text is to read.',
};

export function translate(
  message: string,
  language: Language,
  values: Record<string, string | number> = {},
) {
  const key = message.replace(/\s+/g, ' ').trim();
  if (language === 'en') {
    const status = key.match(/^API модели вернул HTTP (\d+)\./);
    if (status)
      return `The model API returned HTTP ${status[1]}. Check the model, API key and provider quota.`;
  }
  const text = language === 'en' ? (english[key] ?? key) : key;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(values[name] ?? match));
}

export function translateLocation(location: string | undefined, language: Language) {
  if (!location || language === 'ru') return location;
  return location
    .replace(/^Абзац /, 'Paragraph ')
    .replace(/^Таблица (\d+), строка /, 'Table $1, row ')
    .replace(/^Строка /, 'Line ')
    .replace(/^Начало документа$/, 'Start of document');
}
