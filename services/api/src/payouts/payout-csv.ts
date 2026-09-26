const EXPONENTS: Record<string, number> = { JOD: 3, KWD: 3, BHD: 3, OMR: 3, TND: 3, JPY: 0, KRW: 0 };

export const currencyExponent = (currency: string) => EXPONENTS[currency.toUpperCase()] ?? 2;

export function formatMinor(minor: number, currency: string): string {
  const exp = currencyExponent(currency);
  if (exp === 0) return String(minor);
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const unit = 10 ** exp;
  return `${sign}${Math.floor(abs / unit)}.${String(abs % unit).padStart(exp, '0')}`;
}

/** Quotes as needed and defuses leading =,+,-,@ so spreadsheets don't run formulas. */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) || safe !== value ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export interface PayoutCsvRow {
  id: string;
  holderName: string;
  iban: string;
  amountMinor: number;
  currency: string;
  reference: string;
}

/** Bulk bank-transfer file: one row per guide payout. */
export function payoutCsv(rows: PayoutCsvRow[]): string {
  const header = ['payout_id', 'beneficiary_name', 'iban', 'amount', 'currency', 'reference'];
  const lines = rows.map((r) =>
    [r.id, r.holderName, r.iban, formatMinor(r.amountMinor, r.currency), r.currency, r.reference].map(cell).join(','),
  );
  return [header.join(','), ...lines].join('\r\n') + '\r\n';
}
