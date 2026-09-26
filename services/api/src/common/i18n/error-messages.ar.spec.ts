import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { DOMAIN_ERRORS_AR, domainErrorAr, httpMessageAr } from './error-messages.ar';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === 'migrations' ? [] : sources(p);
    return p.endsWith('.ts') && !p.endsWith('.spec.ts') ? [p] : [];
  });
}

describe('Arabic error messages', () => {
  it('cover every domain error code thrown by the API', () => {
    const codes = new Set<string>();
    for (const file of sources(join(__dirname, '../..'))) {
      for (const m of readFileSync(file, 'utf8').matchAll(/DomainError\(\s*'([A-Z_]+)'/g)) codes.add(m[1]);
    }
    expect(codes.size).toBeGreaterThan(40);
    expect([...codes].filter((c) => !DOMAIN_ERRORS_AR[c])).toEqual([]);
  });

  it('picks the right variant for codes with several messages', () => {
    expect(domainErrorAr('SLOT_UNAVAILABLE', 'The guide is already booked at that time')).toBe('المرشد محجوز في هذا الوقت');
    expect(domainErrorAr('SLOT_UNAVAILABLE', 'This time slot was taken… You have been refunded in full.')).toMatch(/استرداد/);
    expect(domainErrorAr('UNKNOWN', 'x')).toBeUndefined();
    expect(domainErrorAr('GROUP_TOO_LARGE', 'This package allows at most 6 people')).toBe('الحد الأقصى لهذه الجولة 6 أشخاص');
  });

  it('translates patterned HTTP messages', () => {
    expect(httpMessageAr('Please wait 30s before requesting another code')).toBe('انتظر 30 ثانية قبل طلب رمز جديد');
    expect(httpMessageAr('Too many failed attempts. Try again in 15 minute(s) or sign in with a phone code.')).toMatch(/15 دقيقة/);
    expect(httpMessageAr('something else')).toBeUndefined();
  });
});
