import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SMS_SENDER, SmsSender } from '../providers/sms/sms-sender.interface';

export interface SosDetails {
  alertId: string;
  raisedBy: 'tourist' | 'guide';
  touristName: string;
  touristPhone: string | null;
  guideName: string;
  guidePhone: string | null;
  packageTitle: string;
  city: string | null;
  lat?: number;
  lng?: number;
  message?: string | null;
}

/** Builds the SMS text for the ops team (kept under ~2 SMS segments where possible). */
export function sosSmsText(d: SosDetails): string {
  const where = d.lat !== undefined && d.lng !== undefined ? `https://maps.google.com/?q=${d.lat.toFixed(5)},${d.lng.toFixed(5)}` : 'location not shared';
  const parts = [
    `SOS from ${d.raisedBy === 'tourist' ? d.touristName : d.guideName} (${d.raisedBy})`,
    `${d.packageTitle}${d.city ? `, ${d.city}` : ''}`,
    `Tourist ${d.touristName} ${d.touristPhone ?? ''}`.trim(),
    `Guide ${d.guideName} ${d.guidePhone ?? ''}`.trim(),
    where,
  ];
  if (d.message) parts.push(`"${d.message.slice(0, 120)}"`);
  return parts.join(' | ');
}

/**
 * Pages the ops team by SMS on every SOS. Delivery failures are logged but
 * never block the alert itself — it is already stored and on the admin board.
 */
@Injectable()
export class SosNotifier {
  private readonly logger = new Logger(SosNotifier.name);

  constructor(
    private readonly config: ConfigService,
    @Inject(SMS_SENDER) private readonly sms: SmsSender,
  ) {}

  async notifyOps(details: SosDetails): Promise<{ sent: number; failed: number }> {
    const phones = this.config.get<string[]>('opsAlertPhones') ?? [];
    if (!phones.length) {
      this.logger.warn(`SOS ${details.alertId}: OPS_ALERT_PHONES is empty, nobody was paged`);
      return { sent: 0, failed: 0 };
    }
    const text = sosSmsText(details);
    const results = await Promise.allSettled(phones.map((p) => this.sms.send(p, text)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) this.logger.error(`SOS ${details.alertId}: ${failed}/${phones.length} ops SMS failed`);
    return { sent: phones.length - failed, failed };
  }
}
