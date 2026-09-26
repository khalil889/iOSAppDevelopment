import { fakeConfig, fakeFetch } from '../test-helpers';
import { MoyasarPaymentProvider } from './moyasar-payment.provider';

const PAYMENT_ID = '1a2b3c4d-0000-4000-8000-000000000001';
const config = fakeConfig({
  moyasar: {
    apiUrl: 'https://api.moyasar.test/v1',
    secretKey: 'sk_test_secret',
    publishableKey: 'pk_test_pub',
    callbackUrl: 'https://app.test/pay/callback',
  },
});
const expected = { bookingId: 'booking-1', amountMinor: 45000, currency: 'SAR', customerId: 'tourist-1' };
const payment = (overrides: Record<string, unknown> = {}) => ({
  id: PAYMENT_ID,
  status: 'paid',
  amount: 45000,
  currency: 'SAR',
  metadata: { booking_id: 'booking-1' },
  source: { type: 'creditcard', message: 'APPROVED' },
  ...overrides,
});

describe('MoyasarPaymentProvider', () => {
  it('refuses to start without keys', () => {
    expect(() => new MoyasarPaymentProvider(fakeConfig({ moyasar: { apiUrl: 'x' } }))).toThrow(
      /MOYASAR_SECRET_KEY, MOYASAR_PUBLISHABLE_KEY, MOYASAR_CALLBACK_URL/,
    );
  });

  it('exposes only the publishable key to clients', () => {
    const cfg = new MoyasarPaymentProvider(config, fakeFetch([]).fn).clientConfig();
    expect(cfg).toEqual({ provider: 'moyasar', publishableKey: 'pk_test_pub', callbackUrl: 'https://app.test/pay/callback' });
    expect(JSON.stringify(cfg)).not.toContain('sk_test');
  });

  it('verifies a client-created paid payment with the secret key', async () => {
    const http = fakeFetch([{ body: payment() }]);
    const res = await new MoyasarPaymentProvider(config, http.fn).hold({ ...expected, paymentMethodToken: PAYMENT_ID });

    expect(res).toEqual({ status: 'held', providerRef: PAYMENT_ID });
    expect(http.calls[0].url).toBe(`https://api.moyasar.test/v1/payments/${PAYMENT_ID}`);
    expect(http.calls[0].headers.authorization).toBe(`Basic ${Buffer.from('sk_test_secret:').toString('base64')}`);
  });

  it.each([
    ['another booking', { metadata: { booking_id: 'booking-2' } }, /different booking/],
    ['a different amount', { amount: 100 }, /does not match/],
    ['a different currency', { currency: 'USD' }, /does not match/],
    ['no booking metadata', { metadata: null }, /missing booking_id/],
  ])('rejects a payment for %s', async (_label, overrides, reason) => {
    const res = await new MoyasarPaymentProvider(config, fakeFetch([{ body: payment(overrides) }]).fn).hold({
      ...expected,
      paymentMethodToken: PAYMENT_ID,
    });
    expect(res.status).toBe('failed');
    expect(res.failureReason).toMatch(reason);
  });

  it('reports 3-D Secure as requires_action with the challenge URL', async () => {
    const http = fakeFetch([{ body: payment({ status: 'initiated', source: { transaction_url: 'https://3ds.test/x' } }) }]);
    const res = await new MoyasarPaymentProvider(config, http.fn).hold({ ...expected, paymentMethodToken: PAYMENT_ID });
    expect(res).toEqual({ status: 'requires_action', providerRef: PAYMENT_ID, nextActionUrl: 'https://3ds.test/x' });
  });

  it('surfaces the issuer message for failed payments', async () => {
    const http = fakeFetch([{ body: payment({ status: 'failed', source: { message: 'INSUFFICIENT_FUNDS' } }) }]);
    const res = await new MoyasarPaymentProvider(config, http.fn).hold({ ...expected, paymentMethodToken: PAYMENT_ID });
    expect(res).toEqual({ status: 'failed', providerRef: PAYMENT_ID, failureReason: 'INSUFFICIENT_FUNDS' });
  });

  it('captures authorized (manual) payments', async () => {
    const http = fakeFetch([{ body: payment({ status: 'authorized' }) }, { body: payment({ status: 'captured' }) }]);
    const res = await new MoyasarPaymentProvider(config, http.fn).hold({ ...expected, paymentMethodToken: PAYMENT_ID });
    expect(res.status).toBe('held');
    expect(http.calls[1]).toMatchObject({ method: 'POST', url: `https://api.moyasar.test/v1/payments/${PAYMENT_ID}/capture`, body: { amount: 45000 } });
  });

  it('creates the payment server-side from a card token', async () => {
    const http = fakeFetch([{ status: 201, body: payment() }]);
    await new MoyasarPaymentProvider(config, http.fn).hold({ ...expected, paymentMethodToken: 'token_abc' });
    expect(http.calls[0]).toMatchObject({
      method: 'POST',
      url: 'https://api.moyasar.test/v1/payments',
      body: {
        amount: 45000,
        currency: 'SAR',
        callback_url: 'https://app.test/pay/callback',
        metadata: { booking_id: 'booking-1' },
        source: { type: 'token', token: 'token_abc' },
      },
    });
    expect((http.calls[0].body as { given_id: string }).given_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('treats gateway 4xx errors as a failed payment and rejects malformed ids without calling out', async () => {
    const http = fakeFetch([{ status: 404, body: { type: 'api_error', message: 'Object not found' } }]);
    const res = await new MoyasarPaymentProvider(config, http.fn).hold({ ...expected, paymentMethodToken: PAYMENT_ID });
    expect(res).toMatchObject({ status: 'failed', failureReason: 'The payment could not be verified. Please try again.' });

    const none = fakeFetch([]);
    const bad = await new MoyasarPaymentProvider(config, none.fn).hold({ ...expected, paymentMethodToken: '../admin' });
    expect(bad.status).toBe('failed');
    expect(none.calls).toHaveLength(0);
  });

  it('rethrows gateway 5xx errors so the booking stays payable', async () => {
    const http = fakeFetch([{ status: 502, body: { message: 'Bad gateway' } }]);
    await expect(
      new MoyasarPaymentProvider(config, http.fn).hold({ ...expected, paymentMethodToken: PAYMENT_ID }),
    ).rejects.toThrow('Bad gateway');
  });

  it('refunds the given amount', async () => {
    const http = fakeFetch([{ body: payment({ status: 'refunded', refunded: 22500 }) }]);
    await new MoyasarPaymentProvider(config, http.fn).refund(PAYMENT_ID, 22500, 'Cancelled');
    expect(http.calls[0]).toMatchObject({ method: 'POST', url: `https://api.moyasar.test/v1/payments/${PAYMENT_ID}/refund`, body: { amount: 22500 } });
  });
});
