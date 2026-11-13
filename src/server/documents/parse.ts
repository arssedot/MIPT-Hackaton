import { unzipSync } from 'fflate';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import type { Block, Document } from '@/contracts/review';
export const MAX_BYTES = 8 * 1024 * 1024;
export class InputError extends Error {}
type XmlNode = Record<string, unknown>;
const decoder = new TextDecoder('utf-8', { fatal: true });
const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  processEntities: true,
  parseTagValue: false,
  trimValues: false,
});
function textOf(nodes: unknown): string {
  if (!Array.isArray(nodes)) return '';
  return nodes
    .map((node: XmlNode) =>
      Object.entries(node)
        .map(([key, value]) => {
          if (key === '#text') return String(value);
          if (key === 'w:tab') return '\t';
          if (key === 'w:br') return '\n';
          if (key === 'w:del' || key === 'w:instrText' || key === ':@') return '';
          return textOf(value);
        })
        .join(''),
    )
    .join('');
}
function descendants(nodes: unknown, tag: string): unknown[][] {
  if (!Array.isArray(nodes)) return [];
  return nodes.flatMap((node: XmlNode) =>
    Object.entries(node).flatMap(([key, value]) =>
      key === tag ? [value as unknown[]] : descendants(value, tag),
    ),
  );
}
export function parseDocument(name: string, bytes: Uint8Array): Document {
  if (!bytes.byteLength || bytes.byteLength > MAX_BYTES)
    throw new InputError('Размер документа должен быть от 1 байта до 8 МБ.');
  const blocks: Block[] = [];
  let section = 'Начало документа';
  function add(text: string, location: string, kind: Block['kind']) {
    text = text.trim();
    if (!text) return;
    if (
      kind === 'paragraph' &&
      /^(?:\d{1,2}[.)]\s|[А-ЯЁA-Z][А-ЯЁA-Z\s]{5,}$)/u.test(text) &&
      text.length < 220
    )
      section = text;
    blocks.push({ id: `b${blocks.length + 1}`, text, location, kind, section });
  }
  if (/\.txt$/i.test(name)) {
    let text: string;
    try {
      text = decoder.decode(bytes);
    } catch {
      throw new InputError('TXT должен быть в кодировке UTF-8.');
    }
    text.split(/\r?\n/).forEach((t, i) => add(t, `Строка ${i + 1}`, 'paragraph'));
  } else if (/\.docx$/i.test(name)) {
    try {
      // Inspect ZIP central directory before decompression to reject zip bombs.
      const files = unzipSync(bytes, {
        filter: (entry) => {
          if (entry.name !== 'word/document.xml') return false;
          if (entry.originalSize > 12 * 1024 * 1024)
            throw new InputError('Распакованный DOCX превышает лимит 12 МБ.');
          return true;
        },
      });
      if (!files['word/document.xml'])
        throw new InputError('В DOCX отсутствует основной документ.');
      const xml = decoder.decode(files['word/document.xml']);
      if (/<!DOCTYPE|<!ENTITY/i.test(xml))
        throw new InputError('DOCX с XML-сущностями не поддерживается.');
      if (XMLValidator.validate(xml) !== true)
        throw new InputError('DOCX содержит повреждённый XML.');
      const body = descendants(parser.parse(xml), 'w:body')[0];
      if (!body) throw new InputError('Не удалось прочитать структуру DOCX.');
      let paragraph = 0,
        table = 0;
      for (const node of body as XmlNode[]) {
        if (node['w:p']) {
          paragraph++;
          add(textOf(node['w:p']), `Абзац ${paragraph}`, 'paragraph');
        }
        if (node['w:tbl']) {
          table++;
          descendants(node['w:tbl'], 'w:tr').forEach((row, i) => {
            const cells = descendants(row, 'w:tc').map((cell) => textOf(cell).trim());
            add(cells.join(' | '), `Таблица ${table}, строка ${i + 1}`, 'table');
          });
        }
      }
    } catch (error) {
      if (error instanceof InputError) throw error;
      throw new InputError('Файл DOCX повреждён, защищён паролем или имеет неверный формат.');
    }
  } else throw new InputError('Поддерживаются только DOCX и TXT.');
  const characters = blocks.reduce((sum, block) => sum + block.text.length, 0);
  if (characters < 50)
    throw new InputError('Недостаточно текста для проверки. Нужен документ с текстовым слоем.');
  if (characters > 160_000 || blocks.length > 3000)
    throw new InputError('Документ слишком большой: максимум 160 000 символов и 3000 фрагментов.');
  return { name: name.slice(0, 180), blocks, characters };
}
