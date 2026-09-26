'use client';

import { useI18n } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';

const OPTIONS: Array<{ value: Locale; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

/** English / العربية switch. Each label is shown in its own language and direction. */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={`lang-toggle ${className}`} role="group" aria-label={t('lang.label')}>
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          lang={o.value}
          dir={o.value === 'ar' ? 'rtl' : 'ltr'}
          className={o.value === locale ? 'active' : ''}
          aria-pressed={o.value === locale}
          onClick={() => setLocale(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
