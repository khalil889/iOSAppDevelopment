import { formatTourTime, langFromHeader, toLang } from './lang';
import { localizeContent } from './localize';

describe('langFromHeader', () => {
  it.each([
    [undefined, 'en'],
    ['ar', 'ar'],
    ['ar-SA,ar;q=0.9,en;q=0.8', 'ar'],
    ['en-US,en;q=0.9,ar;q=0.8', 'en'],
    ['fr-FR,ar;q=0.5', 'ar'],
    ['en;q=0.2, ar;q=0.9', 'ar'],
    ['de', 'en'],
  ])('%s -> %s', (header, lang) => expect(langFromHeader(header)).toBe(lang));

  it('normalises stored locales', () => {
    expect(toLang('ar-SA')).toBe('ar');
    expect(toLang(null)).toBe('en');
  });
});

describe('localizeContent', () => {
  const site = { id: 's1', name: 'Hegra', nameAr: 'الحِجر', description: 'Tombs', descriptionAr: '', city: { name: 'AlUla', nameAr: 'العُلا' } };

  it('leaves English responses untouched', () => {
    expect(localizeContent(site, 'en')).toBe(site);
  });

  it('swaps in Arabic values where present and keeps English otherwise', () => {
    const out = localizeContent({ items: [site], total: 1 }, 'ar');
    expect(out.items[0].name).toBe('الحِجر');
    expect(out.items[0].description).toBe('Tombs'); // empty Arabic falls back
    expect(out.items[0].city.name).toBe('العُلا');
    expect(site.name).toBe('Hegra'); // input not mutated
  });

  it('keeps dates and handles repeated references', () => {
    const at = new Date('2026-01-01T00:00:00Z');
    const city = { name: 'Riyadh', nameAr: 'الرياض' };
    const out = localizeContent({ at, a: city, b: city }, 'ar');
    expect(out.at).toBe(at);
    expect(out.b.name).toBe('الرياض');
  });
});

describe('formatTourTime', () => {
  it('uses Western digits in Arabic', () => {
    const s = formatTourTime(new Date('2026-10-04T06:00:00Z'), 'Asia/Riyadh', 'ar');
    expect(s).toMatch(/09:00/);
    expect(s).not.toMatch(/[٠-٩]/);
  });
});
