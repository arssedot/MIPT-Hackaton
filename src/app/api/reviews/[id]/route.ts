import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from '@/server/db';
import { guard } from '@/server/auth';
import { failure } from '@/server/http';
import type { Review } from '@/contracts/review';
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const row = await db.review.findUnique({ where: { id: (await context.params).id } });
    return row
      ? Response.json(row.data)
      : Response.json({ error: 'Проверка не найдена.' }, { status: 404 });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request, context: Context) {
  const denied = await guard(request, true);
  if (denied) return denied;
  try {
    await db.review.deleteMany({ where: { id: (await context.params).id } });
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  const denied = await guard(request, true);
  if (denied) return denied;
  try {
    const input = z
      .object({ findingId: z.string().uuid(), decision: z.enum(['accepted', 'dismissed']) })
      .safeParse(await request.json());
    if (!input.success) return Response.json({ error: 'Некорректное решение.' }, { status: 400 });
    const id = (await context.params).id;
    // Row lock prevents two reviewers from overwriting concurrent decisions.
    return await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Review" WHERE id = ${id} FOR UPDATE`;
      const row = await tx.review.findUnique({ where: { id } });
      if (!row) return Response.json({ error: 'Проверка не найдена.' }, { status: 404 });
      const review = row.data as unknown as Review;
      if (!review.findings.some((f) => f.id === input.data.findingId))
        return Response.json({ error: 'Замечание не найдено.' }, { status: 404 });
      review.decisions[input.data.findingId] = input.data.decision;
      await tx.review.update({
        where: { id },
        data: { data: review as unknown as Prisma.InputJsonValue },
      });
      return Response.json(review);
    });
  } catch (error) {
    return failure(error);
  }
}
