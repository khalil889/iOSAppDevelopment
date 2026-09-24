import { fakeConfig, fakeFetch } from '../test-helpers';
import { MobishastraSmsSender, SmsDeliveryError } from './mobishastra-sms.sender';

const config = fakeConfig({
  mobishastra: { apiUrl: 'https://mshastra.test/sendurl.aspx', user: '20012345', password: 'p@ss&word', senderId: 'TourGuide' },
});

describe('MobishastraSmsSender', () => {
  it('refuses to start without credentials', () => {
    expect(() => new MobishastraSmsSender(fakeConfig({ mobishastra: { apiUrl: 'x' } }))).toThrow(
      /MOBISHASTRA_USER, MOBISHASTRA_PASSWORD, MOBISHASTRA_SENDER_ID/,
    );
  });

  it('sends with the documented query parameters and no leading +', async () => {
    const http = fakeFetch([{ body: 'Send Successful' }]);
    await new MobishastraSmsSender(config, http.fn).send('+966500000101', 'Your TourGuide code is 123456');

    const url = new URL(http.calls[0].url);
    expect(url.origin + url.pathname).toBe('https://mshastra.test/sendurl.aspx');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      user: '20012345',
      pwd: 'p@ss&word',
      senderid: 'TourGuide',
      mobileno: '966500000101',
      msgtext: 'Your TourGuide code is 123456',
      priority: 'High',
      CountryCode: 'ALL',
    });
  });

  it('accepts success text with surrounding whitespace or extra details', async () => {
    await expect(new MobishastraSmsSender(config, fakeFetch([{ body: '\r\n Send Successful \r\n' }]).fn).send('+966500000101', 'x')).resolves.toBeUndefined();
    await expect(new MobishastraSmsSender(config, fakeFetch([{ body: '966500000101-Send Successful' }]).fn).send('+966500000101', 'x')).resolves.toBeUndefined();
  });

  it.each(['Authorization failed', 'Invalid Mobile No', ''])('throws when the gateway answers %p', async (body) => {
    await expect(new MobishastraSmsSender(config, fakeFetch([{ body }]).fn).send('+966500000101', 'x')).rejects.toBeInstanceOf(SmsDeliveryError);
  });

  it('throws on HTTP errors and network failures', async () => {
    await expect(new MobishastraSmsSender(config, fakeFetch([{ status: 500, body: 'oops' }]).fn).send('+1', 'x')).rejects.toThrow(/HTTP 500/);
    const down = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    await expect(new MobishastraSmsSender(config, down).send('+1', 'x')).rejects.toThrow(/unreachable/);
  });
});
