import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
const COOKIE = 'procurement_session';
function secret() {
  const key = process.env.SESSION_SECRET;
  if (!key || key.length < 32)
    throw new Error('Выполните npm run setup: SESSION_SECRET не настроен.');
  return key;
}
export function passwordMatches(input: string) {
  const actual = process.env.ADMIN_PASSWORD;
  if (!actual || actual.length < 8) return false;
  const hash = (s: string) => createHmac('sha256', secret()).update(s).digest();
  return timingSafeEqual(hash(input), hash(actual));
}
function sign(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}
export async function authenticated() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return false;
  const [value, signature] = token.split('.');
  if (!value || !signature) return false;
  const expected = sign(value);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  )
    return false;
  const expiry = Number(Buffer.from(value, 'base64url').toString().split(':')[0]);
  return Number.isFinite(expiry) && expiry > Date.now();
}
export async function setSession() {
  const value = Buffer.from(
    `${Date.now() + 12 * 60 * 60 * 1000}:${randomBytes(16).toString('hex')}`,
  ).toString('base64url');
  (await cookies()).set(COOKIE, `${value}.${sign(value)}`, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: 43200,
  });
}
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const expected = process.env.APP_ORIGIN || 'http://localhost:3000';
  return origin === expected;
}
export async function guard(request: Request, mutation = false) {
  if (mutation && !sameOrigin(request))
    return NextResponse.json({ error: 'Недопустимый источник запроса.' }, { status: 403 });
  if (!(await authenticated()))
    return NextResponse.json({ error: 'Требуется вход.' }, { status: 401 });
  return null;
}
const attempts = new Map<string, { count: number; until: number }>();
export function rateLimit(key: string, maximum: number, windowMs: number) {
  const now = Date.now();
  for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
  const entry = attempts.get(key);
  if (!entry) {
    attempts.set(key, { count: 1, until: now + windowMs });
    return true;
  }
  entry.count++;
  return entry.count <= maximum;
}
