import { AsyncLocalStorage } from 'async_hooks';

export type Lang = 'en' | 'ar';

/** Picks 'ar' or 'en' from an Accept-Language header (highest q wins). */
export function langFromHeader(header?: string | string[] | null): Lang {
  const value = Array.isArray(header) ? header.join(',') : header;
  if (!value) return 'en';
  const ranked = value
    .split(',')
    .map((part, i) => {
      const [tag, ...params] = part.trim().toLowerCase().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      return { tag: tag.split('-')[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((x) => x.tag === 'ar' || x.tag === 'en')
    .sort((a, b) => b.q - a.q || a.i - b.i);
  return ranked[0]?.tag === 'ar' ? 'ar' : 'en';
}

/** Normalises a stored user locale ('ar', 'ar-SA', 'en'…). */
export const toLang = (locale?: string | null): Lang => (locale?.toLowerCase().startsWith('ar') ? 'ar' : 'en');

const storage = new AsyncLocalStorage<Lang>();

/** Runs the rest of the request with its language available to services and filters. */
export const runWithLang = <T>(lang: Lang, fn: () => T): T => storage.run(lang, fn);

/** Language of the current HTTP request ('en' outside a request). */
export const currentLang = (): Lang => storage.getStore() ?? 'en';

/** Tour times as people read them, in the tour city's timezone, with Western digits. */
export function formatTourTime(at: Date, timeZone: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(at);
}
