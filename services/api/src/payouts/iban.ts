/** IBAN lengths for the markets we pay out in (plus common ones). */
const LENGTHS: Record<string, number> = {
  SA: 24, AE: 23, EG: 29, JO: 30, KW: 30, BH: 22, QA: 29, OM: 23,
  GB: 22, DE: 22, FR: 27, TR: 26,
};

/** Removes spaces/dashes and upper-cases. */
export const normalizeIban = (raw: string) => raw.replace(/[\s-]/g, '').toUpperCase();

/** Mod-97 check (ISO 13616) plus a length check for known countries. */
export function isValidIban(raw: string): boolean {
  const iban = normalizeIban(raw);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const expected = LENGTHS[iban.slice(0, 2)];
  if (expected && iban.length !== expected) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const digits = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
  }
  return remainder === 1;
}

/** "SA03 **** **** **** **** 1234" style: country + check digits and the last four only. */
export function maskIban(raw: string): string {
  const iban = normalizeIban(raw);
  return `${iban.slice(0, 4)} •••• ${iban.slice(-4)}`;
}
