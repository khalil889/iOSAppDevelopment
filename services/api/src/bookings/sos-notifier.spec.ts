import { fakeConfig } from '../providers/test-helpers';
import { SosDetails, SosNotifier, sosSmsText } from './sos-notifier';

const details: SosDetails = {
  alertId: 'a1',
  raisedBy: 'tourist',
  touristName: 'Sara Williams',
  touristPhone: '+447700900001',
  guideName: 'Faisal Al-Harbi',
  guidePhone: '+966500000101',
  packageTitle: 'Diriyah at Golden Hour',
  city: 'Riyadh',
  lat: 24.733912,
  lng: 46.575512,
  message: 'Lost the group',
};

describe('sosSmsText', () => {
  it('includes who, where, both phones, a map link and the message', () => {
    expect(sosSmsText(details)).toBe(
      'SOS from Sara Williams (tourist) | Diriyah at Golden Hour, Riyadh | Tourist Sara Williams +447700900001 | ' +
        'Guide Faisal Al-Harbi +966500000101 | https://maps.google.com/?q=24.73391,46.57551 | "Lost the group"',
    );
  });

  it('says when location was not shared', () => {
    expect(sosSmsText({ ...details, lat: undefined, lng: undefined, message: null })).toContain('location not shared');
  });
});

describe('SosNotifier', () => {
  it('texts every ops number and counts failures without throwing', async () => {
    const send = jest.fn(async (to: string, _body: string) => {
      if (to === '+2') throw new Error('rejected');
    });
    const notifier = new SosNotifier(fakeConfig({ opsAlertPhones: ['+1', '+2', '+3'] }), { name: 'fake', send });
    expect(await notifier.notifyOps(details)).toEqual({ sent: 2, failed: 1 });
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls[0][1]).toContain('SOS from Sara Williams');
  });

  it('does nothing when no ops numbers are configured', async () => {
    const send = jest.fn();
    expect(await new SosNotifier(fakeConfig({ opsAlertPhones: [] }), { name: 'fake', send }).notifyOps(details)).toEqual({ sent: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });
});
