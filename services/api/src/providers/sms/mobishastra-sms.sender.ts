import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsSender } from './sms-sender.interface';

export class SmsDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SmsDeliveryError';
  }
}

/**
 * Mobishastra (mshastra.com) HTTP API:
 *   GET https://mshastra.com/sendurl.aspx?user=&pwd=&senderid=&mobileno=&msgtext=&priority=High&CountryCode=ALL
 * The gateway answers with plain text; "Send Successful" means accepted.
 * Sender IDs must be pre-approved (CITC-registered for Saudi numbers).
 */
export class MobishastraSmsSender implements SmsSender {
  readonly name = 'mobishastra';
  private readonly logger = new Logger(MobishastraSmsSender.name);
  private readonly apiUrl: string;
  private readonly user: string;
  private readonly password: string;
  private readonly senderId: string;

  constructor(
    config: ConfigService,
    private readonly http: typeof fetch = fetch,
  ) {
    this.apiUrl = config.get<string>('mobishastra.apiUrl')!;
    this.user = config.get<string>('mobishastra.user') ?? '';
    this.password = config.get<string>('mobishastra.password') ?? '';
    this.senderId = config.get<string>('mobishastra.senderId') ?? '';
    const missing = [
      ['MOBISHASTRA_USER', this.user],
      ['MOBISHASTRA_PASSWORD', this.password],
      ['MOBISHASTRA_SENDER_ID', this.senderId],
    ].filter(([, v]) => !v);
    if (missing.length) {
      throw new Error(`SMS_PROVIDER=mobishastra requires ${missing.map(([k]) => k).join(', ')}`);
    }
  }

  async send(toE164: string, body: string): Promise<void> {
    const url = new URL(this.apiUrl);
    url.search = new URLSearchParams({
      user: this.user,
      pwd: this.password,
      senderid: this.senderId,
      // The gateway expects the international number without the leading '+'.
      mobileno: toE164.replace(/^\+/, ''),
      msgtext: body,
      priority: 'High',
      CountryCode: 'ALL',
    }).toString();

    let text: string;
    try {
      const res = await this.http(url, { signal: AbortSignal.timeout(15_000) });
      text = (await res.text()).trim();
      if (!res.ok) throw new SmsDeliveryError(`Mobishastra HTTP ${res.status}: ${text.slice(0, 200)}`);
    } catch (e) {
      if (e instanceof SmsDeliveryError) throw e;
      throw new SmsDeliveryError(`Mobishastra unreachable: ${(e as Error).message}`);
    }

    if (!/send successful/i.test(text)) {
      // Never log the full URL: it carries the account password.
      this.logger.error(`SMS to ${mask(toE164)} rejected: ${text.slice(0, 200)}`);
      throw new SmsDeliveryError(`SMS rejected by gateway: ${text.slice(0, 200) || 'empty response'}`);
    }
    this.logger.log(`SMS sent to ${mask(toE164)}`);
  }
}

const mask = (phone: string) => phone.replace(/\d(?=\d{3})/g, '•');
