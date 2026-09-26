import { isValidIban, maskIban, normalizeIban } from './iban';
import { SecretBox } from './secret-box';
import { payoutCsv } from './payout-csv';

describe('IBAN', () => {
  it.each([
    ['SA03 8000 0000 6080 1016 7519', true],
    ['sa0380000000608010167519', true],
    ['GB82 WEST 1234 5698 7654 32', true],
    ['AE07 0331 2345 6789 0123 456', true],
    ['SA03 8000 0000 6080 1016 7518', false], // bad checksum
    ['SA03 8000 0000 6080 1016 751', false], // wrong length
    ['not an iban', false],
  ])('%s -> %s', (iban, ok) => expect(isValidIban(iban)).toBe(ok));

  it('masks all but the country, check digits and last four', () => {
    expect(maskIban('SA03 8000 0000 6080 1016 7519')).toBe('SA03 •••• 7519');
    expect(normalizeIban('sa03-8000 0000')).toBe('SA0380000000');
  });
});

describe('SecretBox', () => {
  const key = Buffer.alloc(32, 7).toString('base64');

  it('round-trips and never stores the plaintext', () => {
    const box = new SecretBox(key);
    const sealed = box.seal('SA0380000000608010167519');
    expect(sealed).not.toContain('6080');
    expect(box.open(sealed)).toBe('SA0380000000608010167519');
    expect(box.seal('x')).not.toBe(box.seal('x')); // random IV
  });

  it('rejects tampering and the wrong key', () => {
    const sealed = new SecretBox(key).seal('secret');
    const parts = sealed.split(':');
    parts[3] = Buffer.from('tampered').toString('base64');
    expect(() => new SecretBox(key).open(parts.join(':'))).toThrow();
    expect(() => new SecretBox(Buffer.alloc(32, 8).toString('base64')).open(sealed)).toThrow();
  });

  it('knows a strong key', () => {
    expect(SecretBox.isStrongKey(key)).toBe(true);
    expect(SecretBox.isStrongKey('short')).toBe(false);
  });
});

describe('payoutCsv', () => {
  it('formats amounts by currency exponent and neutralises spreadsheet formulas', () => {
    const csv = payoutCsv([
      { id: 'p1', holderName: '=HYPERLINK("x")', iban: 'SA0380000000608010167519', amountMinor: 45050, currency: 'SAR', reference: 'TG-1' },
      { id: 'p2', holderName: 'Omar, Bakr', iban: 'JO94CBJO0010000000000131000302', amountMinor: 12250, currency: 'JOD', reference: 'TG-2' },
    ]);
    const lines = csv.trim().split('\r\n');
    expect(lines[0]).toBe('payout_id,beneficiary_name,iban,amount,currency,reference');
    expect(lines[1]).toBe(`p1,"'=HYPERLINK(""x"")",SA0380000000608010167519,450.50,SAR,TG-1`);
    expect(lines[2]).toBe('p2,"Omar, Bakr",JO94CBJO0010000000000131000302,12.250,JOD,TG-2');
  });
});
