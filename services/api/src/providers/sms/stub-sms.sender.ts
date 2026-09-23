import { Injectable, Logger } from '@nestjs/common';
import { SmsSender } from './sms-sender.interface';

/** Logs messages instead of sending them. */
@Injectable()
export class StubSmsSender implements SmsSender {
  readonly name = 'stub';
  private readonly logger = new Logger('StubSms');

  async send(toE164: string, body: string): Promise<void> {
    this.logger.log(`SMS to ${toE164}: ${body}`);
  }
}
