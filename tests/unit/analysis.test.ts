import { describe, it, expect, vi, afterEach } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { parseDocument } from '@/server/documents/parse';
import { localAnalysis } from '@/server/analysis/local';
import { modelAnalysis } from '@/server/analysis/model';
const text = (t: string) => parseDocument('test.txt', strToU8(t));
const docx = (body: string) =>
  zipSync({
    'word/document.xml': strToU8(
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
    ),
  });
describe('document parsing', () => {
  it('preserves order and table row anchors', () => {
    const bytes = docx(
      '<w:p><w:r><w:t>Техническое задание на поставку оборудования для лаборатории</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Мощность</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>200 Вт</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:p><w:r><w:t>Срок поставки составляет 30 дней</w:t></w:r></w:p>',
    );
    const document = parseDocument('test.docx', bytes);
    expect(document.blocks.map((b) => b.id)).toEqual(['b1', 'b2', 'b3']);
    expect(document.blocks[1]).toMatchObject({
      text: 'Мощность | 200 Вт',
      location: 'Таблица 1, строка 1',
      kind: 'table',
    });
    expect(document.blocks[2].text).toContain('30 дней');
  });
  it('rejects invalid, empty, unsupported and oversized input', () => {
    expect(() => parseDocument('bad.docx', strToU8('not a zip'))).toThrow('повреждён');
    expect(() => parseDocument('empty.txt', new Uint8Array())).toThrow('Размер');
    expect(() => parseDocument('bad.pdf', strToU8('not a PDF'))).toThrow('DOCX и TXT');
    expect(() => parseDocument('big.txt', new Uint8Array(8 * 1024 * 1024 + 1))).toThrow('8 МБ');
    expect(() =>
      parseDocument('zip.docx', zipSync({ 'other.xml': strToU8('no document') })),
    ).toThrow('отсутствует');
    expect(() => parseDocument('bad.txt', new Uint8Array([255, 255]))).toThrow('UTF-8');
  });
  it('ignores tracked deletions and includes inserted text', () => {
    const document = parseDocument(
      'test.docx',
      docx(
        '<w:p><w:del><w:r><w:delText>Скрытое старое требование</w:delText></w:r></w:del><w:ins><w:r><w:t>Действующее техническое требование на поставку нового оборудования с гарантией</w:t></w:r></w:ins></w:p>',
      ),
    );
    expect(document.blocks[0].text).not.toContain('Скрытое');
    expect(document.blocks[0].text).toContain('Действующее');
  });
  it('preserves zeros split across Word runs and leading zeros in identifiers', () => {
    const d = parseDocument(
      'numbers.docx',
      docx(
        '<w:p><w:r><w:t>Техническое задание на поставку оборудования для лаборатории</w:t></w:r></w:p><w:p><w:r><w:t>3</w:t></w:r><w:r><w:t>00</w:t></w:r></w:p><w:p><w:r><w:t>00127</w:t></w:r></w:p>',
      ),
    );
    expect(d.blocks[1].text).toBe('300');
    expect(d.blocks[2].text).toBe('00127');
  });
});
describe('evidence-based checks', () => {
  it('compares the same attribute across paragraphs and tables', () => {
    const d = text(
      'Техническое задание на поставку подъёмного оборудования\nГрузоподъемность 800 кг\nГрузоподъемность, кг | 600',
    );
    const result = localAnalysis(d).find((f) => f.category === 'contradiction');
    expect(result?.relatedBlockIds).toEqual(['b3']);
    expect(d.blocks.find((b) => b.id === result?.blockId)?.text).toContain(result?.quote);
  });
  it('does not flag matching parameters or equivalent models', () => {
    const d = text(
      'Техническое задание на оборудование лаборатории\nГрузоподъемность 800 кг\nГрузоподъемность, кг | 800\nМодель | VECTOR-X200 или эквивалент',
    );
    expect(localAnalysis(d)).toEqual([]);
  });
  it('keeps old standard references as review tasks, not proven violations', () => {
    const result = localAnalysis(
      text(
        'Проверка технического задания на лабораторное оборудование\nИспытания по ГОСТ 8.417-2002',
      ),
    );
    expect(result[0].confidence).toBe('review');
    expect(result[0].explanation).toContain('не доказывает');
  });
  it('does not confuse an editorial range with a required scalar value', () => {
    const d = text(
      'Техническое задание на поставку оборудования\nГрузоподъемность 500 кг\nУстранены разночтения: грузоподъемность (300-500 кг).',
    );
    expect(localAnalysis(d)).toEqual([]);
  });
  it('links conflicting equipment purposes in Cyrillic', () => {
    const d = text(
      'Предмет закупки: выполнение работ по замене грузового лифта\n1 | Тип лифта | пассажирский',
    );
    const result = localAnalysis(d);
    expect(result[0]).toMatchObject({
      confidence: 'confirmed',
      blockId: 'b2',
      relatedBlockIds: ['b1'],
    });
  });
});
describe('model output validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });
  it('rejects invented quotations rather than presenting them as evidence', async () => {
    vi.stubEnv('LLM_ENABLED', 'true');
    vi.stubEnv('LLM_API_KEY', 'test-key');
    vi.stubEnv('LLM_MODEL', 'test-model');
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    findings: [
                      {
                        title: 'Выдуманная проблема',
                        category: 'contradiction',
                        severity: 'high',
                        confidence: 'confirmed',
                        blockId: 'b1',
                        quote: 'Этой цитаты нет в документе',
                        explanation: 'Объяснение с отсутствующим основанием',
                        recommendation: 'Рекомендуется проверить это требование',
                        sourceIds: [],
                        relatedBlockIds: [],
                      },
                    ],
                  }),
                },
              },
            ],
          }),
        ),
    );
    await expect(
      modelAnalysis(text('Техническое задание на поставку нового лабораторного оборудования')),
    ).rejects.toThrow('цитат');
  });
});
