import { Logger } from '@nestjs/common';
import { IdentityProvider, IdentityStart, IdentityStartRequest } from './identity-provider.interface';

/** Development stand-in: approves every identity check straight away. */
export class StubIdentityProvider implements IdentityProvider {
  readonly name = 'stub';
  private readonly logger = new Logger(StubIdentityProvider.name);

  async start(req: IdentityStartRequest): Promise<IdentityStart> {
    this.logger.warn(`Stub identity check auto-approved for ${req.externalUserId}`);
    return { immediate: { status: 'approved' } };
  }

  verifyWebhook(): boolean {
    return false;
  }

  parseWebhook() {
    return null;
  }
}
