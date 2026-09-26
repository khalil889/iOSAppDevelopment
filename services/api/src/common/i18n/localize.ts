import { Lang } from './lang';

/** Fields with an Arabic counterpart stored as `<field>Ar`. */
const FIELDS = ['name', 'title', 'description', 'country', 'city'] as const;

/**
 * Deep-copies a response, replacing `name`/`title`/`description`/`country`/`city`
 * strings with their `…Ar` sibling when one is set. English responses are
 * returned untouched.
 */
export function localizeContent<T>(value: T, lang: Lang): T {
  if (lang === 'en') return value;
  return walk(value, new WeakMap()) as T;
}

function walk(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value)) return value;
  if (seen.has(value)) return seen.get(value);
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    seen.set(value, out);
    for (const v of value) out.push(walk(v, seen));
    return out;
  }
  const src = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  seen.set(value, out);
  for (const [k, v] of Object.entries(src)) out[k] = walk(v, seen);
  for (const f of FIELDS) {
    const ar = src[`${f}Ar`];
    if (typeof ar === 'string' && ar.trim() && typeof src[f] === 'string') out[f] = ar;
  }
  return out;
}
