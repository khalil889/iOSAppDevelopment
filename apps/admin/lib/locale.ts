/**
 * Locale storage and Intl formatting helpers with no React dependency, so
 * lib/api.ts (and any other plain module) can use them.
 */

export type Locale = 'en' | 'ar';
export const LOCALES: readonly Locale[] = ['en', 'ar'];
export const LOCALE_STORAGE_KEY = 'tg_admin_locale';
export const DEFAULT_LOCALE: Locale = 'en';

const isLocale = (v: unknown): v is Locale => v === 'en' || v === 'ar';

/** Saved choice, else Arabic when the browser prefers Arabic, else English. SSR → English. */
export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    // Storage blocked (private mode, disabled cookies): fall through to the browser language.
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language];
  return langs.some((l) => l?.toLowerCase().startsWith('ar')) ? 'ar' : DEFAULT_LOCALE;
}

export function storeLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Not persisted; the choice still applies for this page view.
  }
}

export const dirOf = (locale: Locale): 'rtl' | 'ltr' => (locale === 'ar' ? 'rtl' : 'ltr');

/** BCP 47 tag for Intl. Arabic keeps Western digits and the Gregorian calendar. */
const intlTag = (locale: Locale) => (locale === 'ar' ? 'ar-SA' : 'en-GB');
const intlBase = { numberingSystem: 'latn' } as const;

const THREE_DECIMALS = ['JOD', 'KWD', 'BHD', 'OMR', 'TND'];

/** Minor units → localized currency string; JOD/KWD/BHD/OMR/TND use 3 decimals, whole amounts show none. */
export function formatMoney(minor: number, currency: string, locale: Locale): string {
  const exp = THREE_DECIMALS.includes(currency) ? 3 : 2;
  const value = minor / 10 ** exp;
  const digits = Number.isInteger(value) ? 0 : exp;
  try {
    return new Intl.NumberFormat(intlTag(locale), {
      ...intlBase,
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    // Unknown currency code: plain number plus the code.
    const n = new Intl.NumberFormat(intlTag(locale), { ...intlBase, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
    return `${currency} ${n}`;
  }
}

/** Compact currency for chart axes: "SAR 12K" / "‏12 ألف ر.س.‏". */
export function formatMoneyCompact(minor: number, currency: string, locale: Locale): string {
  const value = minor / 10 ** (THREE_DECIMALS.includes(currency) ? 3 : 2);
  try {
    return new Intl.NumberFormat(intlTag(locale), {
      ...intlBase,
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${currency} ${formatNumber(value, locale, { notation: 'compact', maximumFractionDigits: 1 })}`;
  }
}

/** Plain localized number (Western digits in both languages). */
export function formatNumber(n: number, locale: Locale, opts: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(intlTag(locale), { ...intlBase, ...opts }).format(n);
}

/** Calendar date ("YYYY-MM-DD") → day and short month, no year: "26 Sep". */
export function formatDayShort(s: string, locale: Locale): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat(intlTag(locale), {
    ...intlBase,
    calendar: 'gregory',
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/** ISO timestamp → localized date and time; '—' for empty. */
export function formatDate(s: string | null | undefined, locale: Locale): string {
  if (!s) return '—';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat(intlTag(locale), {
    ...intlBase,
    calendar: 'gregory',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Calendar date ("YYYY-MM-DD", no time zone) → localized date; '—' for empty. */
export function formatDay(s: string | null | undefined, locale: Locale): string {
  if (!s) return '—';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00Z` : s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat(intlTag(locale), {
    ...intlBase,
    calendar: 'gregory',
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/** "3 hours ago" / "قبل 3 ساعات"; under an hour returns null so the caller can show "just now". */
export function formatRelative(s: string, locale: Locale): string | null {
  const h = Math.round((Date.now() - new Date(s).getTime()) / 3_600_000);
  if (h < 1) return null;
  const rtf = new Intl.RelativeTimeFormat(`${intlTag(locale)}-u-nu-latn`, { numeric: 'auto' });
  return h < 48 ? rtf.format(-h, 'hour') : rtf.format(-Math.round(h / 24), 'day');
}

/** ISO 639 code ("en") → language name in the UI language ("English" / "الإنجليزية"). */
export function formatLanguage(code: string, locale: Locale): string {
  try {
    return new Intl.DisplayNames([intlTag(locale)], { type: 'language' }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}
