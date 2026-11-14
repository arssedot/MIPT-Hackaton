import { afterEach, expect, it, vi } from 'vitest';
import { MODEL_TIMEOUT_MS } from '@/contracts/review';

const create = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock('@/server/db', () => ({ db: { review: { create } } }));
vi.mock('@/server/auth', () => ({
  guard: vi.fn().mockResolvedValue(null),
  rateLimit: vi.fn().mockReturnValue(true),
}));
import { POST } from '@/app/api/reviews/route';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it.each(['timeout', 'rate limit'])(
  'saves the local review when the model fails with %s',
  async (failure) => {
    vi.useFakeTimers();
    vi.stubEnv('LLM_ENABLED', 'true');
    vi.stubEnv('LLM_MODEL', 'test-model');
    vi.stubEnv('LLM_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        failure === 'timeout'
          ? new Promise(() => {})
          : Promise.resolve(Response.json({ error: { code: 429 } }, { status: 429 })),
      ),
    );
    const form = new FormData();
    form.set(
      'file',
      new File(
        [
          'Техническое задание на поставку подъёмного оборудования\nГрузоподъемность 800 кг\nГрузоподъемность 600 кг',
        ],
        'synthetic.txt',
      ),
    );
    form.set('useModel', 'true');
    form.set('isPublic', 'true');
    const request = {
      headers: new Headers({ 'content-length': '1000' }),
      formData: async () => form,
    } as unknown as Request;
    const pending = POST(request);
    await vi.advanceTimersByTimeAsync(MODEL_TIMEOUT_MS);
    const response = await pending;
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.engine).toBe('local');
    expect(result.findings.some((f: { category: string }) => f.category === 'contradiction')).toBe(
      true,
    );
    expect(result.warnings.join(' ')).toContain(failure === 'timeout' ? '60 секунд' : 'HTTP 429');
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0].data.data).toEqual(result);
  },
);
