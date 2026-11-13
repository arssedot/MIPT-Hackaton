import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const repo = process.argv[2];
if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo))
  throw new Error('Передайте полный репозиторий аргументом: владелец/имя.');
const values = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((x) => /^[A-Z_]+=/.test(x))
    .map((x) => [x.slice(0, x.indexOf('=')), x.slice(x.indexOf('=') + 1)]),
);
for (const key of ['ADMIN_PASSWORD', 'SESSION_SECRET', 'POSTGRES_PASSWORD', 'LLM_API_KEY']) {
  if (!values[key]) continue;
  const r = spawnSync('gh', ['secret', 'set', key, '--repo', repo], {
    input: values[key],
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (r.error || r.status !== 0)
    throw new Error(`Не удалось сохранить ${key}: ${r.error?.message ?? r.stderr}`);
  console.log(`${key}: сохранён в GitHub Actions.`);
}
