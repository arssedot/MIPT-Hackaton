import { randomUUID } from 'node:crypto';
import type { Block, Document, Finding, Category } from '@/contracts/review';
export function localAnalysis(document: Document): Finding[] {
  const findings: Finding[] = [];
  function flag(
    block: Block,
    title: string,
    category: Category,
    explanation: string,
    recommendation: string,
    options: Partial<Finding> = {},
  ) {
    findings.push({
      id: randomUUID(),
      title,
      category,
      severity: 'medium',
      confidence: 'review',
      blockId: block.id,
      quote: block.text.slice(0, 1800),
      relatedBlockIds: [],
      explanation,
      recommendation,
      sourceIds: [],
      origin: 'local',
      ...options,
    });
  }
  const { blocks } = document;
  // Compare values within the same attribute, not arbitrary numbers across a document.
  const attributes = [
    {
      label: 'грузоподъёмность',
      pattern: /грузопод[ъь]?е?ё?мност[ьи]?[^\d|]{0,16}(?:кг\s*)?\|?\s*(\d+(?:[.,]\d+)?)/iu,
    },
    {
      label: 'гарантийный срок',
      pattern: /гарантийн(?:ый|ого)\s+срок(?:а)?[^\d]{0,35}(\d+)\s*(?:месяц|мес\b)/iu,
    },
  ];
  for (const attribute of attributes) {
    const entries = blocks.flatMap((block) => {
      const m = block.text.match(attribute.pattern);
      if (!m) return [];
      // A range or an editorial before/after comparison is not a scalar requirement.
      const following = block.text.slice((m.index ?? 0) + m[0].length);
      if (/^\s*[-–—]/u.test(following)) return [];
      return [{ block, value: m[1] }];
    });
    // Guarantee scopes can differ (equipment vs work); never confirm them automatically.
    const values = [...new Set(entries.map((x) => x.value))];
    if (values.length > 1) {
      const first = entries[0];
      flag(
        first.block,
        `Разные значения: ${attribute.label}`,
        'contradiction',
        `В связанных фрагментах указаны значения ${values.join(' и ')}. Нужно проверить, относятся ли они к одному объекту: для разных объектов значения могут различаться.`,
        'Уточнить объект каждого требования. Для одного объекта согласовать единое значение в описании, характеристиках и спецификации.',
        { severity: 'high', relatedBlockIds: entries.slice(1).map((x) => x.block.id) },
      );
    }
  }
  const cargo = blocks.find((b) => /(?:предмет закупки|новый).*грузово[йг]/iu.test(b.text));
  const passenger = blocks.find((b) => /тип лифта\s*\|\s*пассажирский/iu.test(b.text));
  if (cargo && passenger)
    flag(
      passenger,
      'Тип оборудования расходится с предметом закупки',
      'contradiction',
      'Предмет закупки описывает грузовой лифт, а таблица характеристик — пассажирский. Это разные назначения оборудования.',
      'Подтвердить требуемое назначение и привести предмет закупки и таблицу характеристик к одному типу.',
      { severity: 'high', confidence: 'confirmed', relatedBlockIds: [cargo.id] },
    );
  for (const block of blocks) {
    const t = block.text;
    if (/(?:импортного|отечественного) производства/iu.test(t))
      flag(
        block,
        'Происхождение задано вместо характеристик',
        'competition',
        'Происхождение оборудования указано как требование. Допустимость зависит от режима закупки и действующего национального режима; одного этого фрагмента недостаточно для вывода о нарушении.',
        'Описать необходимые функциональные параметры. Отдельно проверить применимые правила национального режима и основания ограничения происхождения.',
        { sourceIds: ['procurement'] },
      );
    if (
      /\b(?:модель|марка|производитель|референс)\s*[:|]/iu.test(t) &&
      /[A-Za-z]{2,}[\s-]*[A-Z\d]|\d{3,}[А-ЯA-Z]/u.test(t) &&
      !/эквивалент/iu.test(t)
    )
      flag(
        block,
        'Модель указана без условий эквивалентности',
        'competition',
        'В строке есть обозначение модели, но в этом фрагменте не описана эквивалентность. Общие условия могут находиться в другом разделе.',
        'Проверить общие условия ТЗ и законные исключения. При необходимости добавить условия эквивалентности и измеримые параметры сравнения.',
        { sourceIds: ['procurement'] },
      );
    if (/гарантийн/iu.test(t) && /работ/iu.test(t) && /товарн(?:ой|ую) накладн/iu.test(t))
      flag(
        block,
        'Начало гарантии на работы связано с накладной',
        'warranty',
        'Гарантия на выполненные работы отсчитывается от документа о приёмке товара. Приёмка товара и приёмка работ могут происходить в разные даты.',
        'Разделить гарантию на оборудование и работы. Согласовать документ и дату приёмки каждого результата с условиями договора.',
      );
    if (/ГОСТ(?:\s+Р)?\s+\d/iu.test(t))
      flag(
        block,
        'Проверить актуальность и применимость стандарта',
        'standards',
        'В документе указан стандарт. Локальная проверка не располагает актуальным реестром отмен и замен; устаревший год сам по себе не доказывает недействительность.',
        'Сверить полное обозначение, название, статус и область применения в каталоге Росстандарта; проверить переходные положения.',
        { severity: 'low', sourceIds: ['standards'] },
      );
    const code = t.match(/\b\d{2}\.\d{2}\.\d{2}\.\d{3}\b/g);
    if (code && /комплект/iu.test(t))
      flag(
        block,
        'Уточнить состав комплекта и коды отдельных товаров',
        'classification',
        'Комплект указан одной позицией с кодом ОКПД 2. Если внутри самостоятельные товары, для них могут потребоваться отдельные позиции и коды; это зависит от назначения комплекта.',
        'Раскрыть состав, количество и характеристики каждого прибора. Проверить, является ли комплект единым функциональным изделием, затем сверить коды.',
        { sourceIds: ['okpd'] },
      );
    if (/\b(?:тип|модель|комплектность|производитель)\s*\|\s*$/iu.test(t))
      flag(
        block,
        'Не заполнено поле характеристики',
        'completeness',
        'В таблице есть наименование поля без значения. Участник закупки не может определить ожидаемую характеристику по этой строке.',
        'Заполнить характеристику измеримым значением либо явно указать, что параметр не нормируется.',
      );
    if (
      /(?:не менее|не более)\s*\d+(?:[.,]\d+)?\s*(?:и|—|-)\s*(?:не менее|не более)\s*\d+/iu.test(t)
    )
      flag(
        block,
        'Проверить границы числового требования',
        'characteristics',
        'В одной характеристике присутствуют несколько границ. Нужно подтвердить порядок границ, единицы и то, что они относятся к одному параметру.',
        'Записать допустимый диапазон с едиными единицами измерения и проверить, что нижняя граница не превышает верхнюю.',
      );
  }
  // Repeated references are one review task with all source locations attached.
  return findings
    .reduce<Finding[]>((result, finding) => {
      const existing = result.find(
        (f) => f.title === finding.title && f.category === finding.category,
      );
      if (existing) existing.relatedBlockIds.push(finding.blockId, ...finding.relatedBlockIds);
      else result.push(finding);
      return result;
    }, [])
    .slice(0, 70);
}
