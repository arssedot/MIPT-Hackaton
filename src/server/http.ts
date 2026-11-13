import { NextResponse } from 'next/server';
import { InputError } from './documents/parse';
export function failure(error: unknown) {
  if (error instanceof InputError)
    return NextResponse.json({ error: error.message }, { status: 400 });
  console.error('Request failed', error instanceof Error ? error.name : 'UnknownError');
  return NextResponse.json(
    {
      error: 'Не удалось выполнить операцию. Проверьте подключение к базе и настройки приложения.',
    },
    { status: 500 },
  );
}
