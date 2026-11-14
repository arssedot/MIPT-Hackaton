// Keep the whole operation bounded, including reading the response body.
export async function withDeadline<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  milliseconds: number,
  message: string,
  parentSignal?: AbortSignal | null,
): Promise<T> {
  parentSignal?.throwIfAborted();
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(message);
      error.name = 'TimeoutError';
      reject(error);
      controller.abort(error);
    }, milliseconds);
    onAbort = () => {
      reject(parentSignal!.reason);
      controller.abort(parentSignal!.reason);
    };
    parentSignal?.addEventListener('abort', onAbort, { once: true });
  });
  try {
    return await Promise.race([
      Promise.resolve().then(() => operation(controller.signal)),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
    if (onAbort) parentSignal?.removeEventListener('abort', onAbort);
  }
}
