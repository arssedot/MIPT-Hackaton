import { Prisma } from '@prisma/client';
import { db } from '@/server/db';
import { guard, rateLimit } from '@/server/auth';
import { parseDocument, MAX_BYTES, InputError } from '@/server/documents/parse';
import { localAnalysis } from '@/server/analysis/local';
import { modelAnalysis } from '@/server/analysis/model';
import { failure } from '@/server/http';
import type { Review } from '@/contracts/review';
export const runtime = 'nodejs';
export const maxDuration = 120;
export async function GET(request: Request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const rows = await db.review.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return Response.json(
      rows.map((r) => {
        const d = r.data as unknown as Review;
        return {
          id: r.id,
          name: r.name,
          createdAt: r.createdAt,
          count: d.findings.length,
          engine: d.engine,
        };
      }),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  const denied = await guard(request, true);
  if (denied) return denied;
  if (!rateLimit('analysis', 12, 60_000))
    return Response.json(
      { error: 'Слишком много проверок. Повторите через минуту.' },
      { status: 429 },
    );
  try {
    const started = Date.now();
    const length = Number(request.headers.get('content-length'));
    if (!Number.isFinite(length) || length <= 0 || length > MAX_BYTES + 65536)
      throw new InputError('Некорректный размер запроса. Максимум 8 МБ.');
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new InputError('Выберите файл DOCX или TXT.');
    const useModel = form.get('useModel') === 'true';
    if (useModel && form.get('isPublic') !== 'true')
      throw new InputError(
        'Отправлять во внешний API можно только открытые документы. Подтвердите это перед проверкой.',
      );
    const document = parseDocument(file.name, new Uint8Array(await file.arrayBuffer()));
    const findings = localAnalysis(document);
    const warnings = [
      'Результат помогает доработать ТЗ и требует проверки специалистом. Отсутствие замечаний не подтверждает соответствие требованиям.',
    ];
    let engine: Review['engine'] = 'local';
    if (useModel) {
      try {
        findings.push(...(await modelAnalysis(document)));
        engine = 'hybrid';
      } catch (error) {
        warnings.push(
          error instanceof Error && error.name !== 'ZodError'
            ? error.message
            : 'Ответ модели не прошёл проверку структуры. Использованы только локальные проверки.',
        );
      }
    } else
      warnings.push(
        'Смысловой анализ моделью не выполнялся. Локальные проверки покрывают ограниченный набор правил.',
      );
    const review: Review = {
      id: crypto.randomUUID(),
      name: document.name,
      createdAt: new Date().toISOString(),
      document,
      findings,
      engine,
      warnings,
      durationMs: Date.now() - started,
      decisions: {},
    };
    await db.review.create({
      data: { id: review.id, name: review.name, data: review as unknown as Prisma.InputJsonValue },
    });
    return Response.json(review, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
