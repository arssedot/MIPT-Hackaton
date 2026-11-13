import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
process.loadEnvFile('.env');
const base = process.env.APP_ORIGIN;
const headers = { Origin: base };
const login = await fetch(`${base}/api/auth`, {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
});
if (!login.ok) throw new Error(`Probe login failed: ${login.status}`);
headers.Cookie = login.headers.get('set-cookie').split(';')[0];
const stateFile = '.local/persistence-probe.json';
async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  if (!response.ok) throw new Error(`Probe request failed: ${response.status}`);
  return response.json();
}
if (process.argv[2] === 'before') {
  const form = new FormData();
  form.set(
    'file',
    new File(
      [
        'Техническое задание на новое подъёмное оборудование\nГрузоподъемность 700 кг\nГрузоподъемность 900 кг',
      ],
      'persistence-probe.txt',
    ),
  );
  form.set('useModel', 'false');
  const review = await request('/api/reviews', { method: 'POST', body: form });
  if (!review.findings.length) throw new Error('Probe did not produce a finding.');
  await request(`/api/reviews/${review.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ findingId: review.findings[0].id, decision: 'accepted' }),
  });
  mkdirSync('.local', { recursive: true });
  writeFileSync(stateFile, JSON.stringify({ id: review.id, findingId: review.findings[0].id }));
  console.log('Created synthetic review and saved an expert decision.');
} else if (process.argv[2] === 'after') {
  const state = JSON.parse(readFileSync(stateFile, 'utf8'));
  const review = await request(`/api/reviews/${state.id}`);
  if (review.decisions[state.findingId] !== 'accepted')
    throw new Error('Decision did not survive restart.');
  await request(`/api/reviews/${state.id}`, { method: 'DELETE' });
  unlinkSync(stateFile);
  console.log('Review and decision survived restart; synthetic record removed.');
} else throw new Error('Use before or after.');
