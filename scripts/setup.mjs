import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync, mkdirSync, chmodSync } from 'node:fs';
if (existsSync('.env')) {
  console.log('.env уже существует; значения сохранены.');
} else {
  const db = randomBytes(24).toString('hex');
  const password = process.env.ADMIN_PASSWORD || 'kontur2026';
  const session = randomBytes(32).toString('hex');
  writeFileSync(
    '.env',
    `APP_ORIGIN=http://localhost:3000\nDATABASE_URL=postgresql://procurement:${db}@localhost:55432/procurement?schema=public\nPOSTGRES_PASSWORD=${db}\nADMIN_PASSWORD=${password}\nSESSION_SECRET=${session}\nCOOKIE_SECURE=false\nLLM_BASE_URL=https://api.openai.com/v1\nLLM_MODEL=\nLLM_API_KEY=\nLLM_ENABLED=false\n`,
    { mode: 0o600 },
  );
  mkdirSync('.local', { recursive: true, mode: 0o700 });
  writeFileSync(
    '.local/access.txt',
    `Адрес: http://localhost:3000\nПароль входа: ${password}\n\nОстальные секреты: .env\n`,
    { mode: 0o600 },
  );
  console.log('Созданы .env и .local/access.txt. Пароль входа находится в .local/access.txt.');
}
chmodSync('.env', 0o600);
