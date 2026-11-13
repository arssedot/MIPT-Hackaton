import { NextResponse } from 'next/server';
import {
  authenticated,
  clearSession,
  passwordMatches,
  rateLimit,
  sameOrigin,
  setSession,
} from '@/server/auth';
export async function GET() {
  return NextResponse.json({ authenticated: await authenticated() });
}
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: 'Недопустимый источник запроса.' }, { status: 403 });
  if (!rateLimit('login', 20, 60_000))
    return NextResponse.json(
      { error: 'Слишком много попыток. Повторите через минуту.' },
      { status: 429 },
    );
  const body = await request.json().catch(() => null);
  if (
    typeof body?.password !== 'string' ||
    body.password.length > 200 ||
    !passwordMatches(body.password)
  )
    return NextResponse.json({ error: 'Неверный пароль.' }, { status: 401 });
  await setSession();
  return NextResponse.json({ ok: true });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: 'Недопустимый источник запроса.' }, { status: 403 });
  await clearSession();
  return NextResponse.json({ ok: true });
}
