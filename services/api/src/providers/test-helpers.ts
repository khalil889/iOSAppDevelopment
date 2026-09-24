import { ConfigService } from '@nestjs/config';

/** Minimal ConfigService backed by a nested object (dot paths supported). */
export function fakeConfig(values: Record<string, unknown>): ConfigService {
  return {
    get: (key: string) => key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], values),
  } as unknown as ConfigService;
}

export interface RecordedCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
}

/** fetch stand-in that records calls and replies from a queue of responses. */
export function fakeFetch(responses: Array<{ status?: number; body: unknown }>) {
  const calls: RecordedCall[] = [];
  const fn = (async (input: string | URL, init: RequestInit = {}) => {
    calls.push({
      url: String(input),
      method: init.method ?? 'GET',
      headers: (init.headers ?? {}) as Record<string, string>,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    });
    const next = responses.shift();
    if (!next) throw new Error(`Unexpected request to ${String(input)}`);
    const text = typeof next.body === 'string' ? next.body : JSON.stringify(next.body);
    return new Response(text, { status: next.status ?? 200 });
  }) as unknown as typeof fetch;
  return { fn, calls };
}
