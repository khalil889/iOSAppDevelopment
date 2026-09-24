import { Logger } from '@nestjs/common';
import { PushMessage, PushResult, PushSender } from './push-sender.interface';

/** Logs pushes instead of sending them. */
export class StubPushSender implements PushSender {
  readonly name = 'stub';
  private readonly logger = new Logger('StubPush');

  async send(tokens: string[], message: PushMessage): Promise<PushResult> {
    if (tokens.length) this.logger.log(`push x${tokens.length}: ${message.title} — ${message.body}`);
    return { sent: tokens.length, invalidTokens: [] };
  }
}
