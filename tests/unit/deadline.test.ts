import { afterEach, describe, expect, it, vi } from 'vitest';
import { withDeadline } from '@/lib/deadline';
import { modelAnalysis } from '@/server/analysis/model';
import { MODEL_TIMEOUT_MS, type Document } from '@/contracts/review';

const document: Document = {
  name: 'synthetic.txt',
  characters: 65,
  blocks: [
    {
      id: 'b1',
      text: 'Техническое задание на поставку нового лабораторного оборудования.',
      location: 'Строка 1',
      kind: 'paragraph',
      section: 'Начало документа',
    },
  ],
};
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('request deadlines', () => {
  it('aborts and rejects even if the underlying operation ignores cancellation', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal;
    const request = withDeadline(
      (s) => {
        signal = s;
        return new Promise(() => {});
      },
      100,
      'timeout',
    );
    const result = expect(request).rejects.toThrow('timeout');
    await vi.advanceTimersByTimeAsync(100);
    await result;
    expect(signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('releases the deadline after a successful operation', async () => {
    vi.useFakeTimers();
    await expect(withDeadline(async () => 42, 100, 'timeout')).resolves.toBe(42);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('stops waiting immediately when cancelled by the user', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const request = withDeadline(() => new Promise(() => {}), 100, 'timeout', controller.signal);
    const result = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
  it('does not start an operation that was already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    const operation = vi.fn();
    await expect(withDeadline(operation, 100, 'timeout', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(operation).not.toHaveBeenCalled();
  });
});

describe('model provider failures', () => {
  function configure() {
    vi.stubEnv('LLM_ENABLED', 'true');
    vi.stubEnv('LLM_MODEL', 'test-model');
    vi.stubEnv('LLM_API_KEY', 'test-key');
  }
  it.each(['connection', 'response body'])('bounds a stalled %s to 60 seconds', async (stage) => {
    configure();
    vi.useFakeTimers();
    let signal: AbortSignal;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url, init) => {
        signal = init.signal;
        return stage === 'connection'
          ? new Promise(() => {})
          : Promise.resolve({ ok: true, json: () => new Promise(() => {}) });
      }),
    );
    const request = modelAnalysis(document);
    const result = expect(request).rejects.toThrow('60 секунд');
    await vi.advanceTimersByTimeAsync(MODEL_TIMEOUT_MS - 1);
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await result;
    expect(signal!.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it.each([401, 402, 429])(
    'reports HTTP %i without exposing the provider response',
    async (status) => {
      configure();
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            Response.json({ error: { message: 'untrusted provider content' } }, { status }),
          ),
      );
      await expect(modelAnalysis(document)).rejects.toThrow('HTTP ' + status);
      await expect(modelAnalysis(document)).rejects.not.toThrow('untrusted provider content');
    },
  );
  it('handles an error envelope returned with HTTP 200', async () => {
    configure();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(Response.json({ error: { code: 429, message: 'untrusted content' } })),
    );
    await expect(modelAnalysis(document)).rejects.toThrow('HTTP 429');
  });
});
