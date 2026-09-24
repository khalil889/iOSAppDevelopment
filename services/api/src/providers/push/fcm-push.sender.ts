import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { App, cert, deleteApp, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { PushMessage, PushResult, PushSender } from './push-sender.interface';

/** Error codes meaning the token will never work again. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

/** FCM limit per multicast request. */
const BATCH = 500;

/**
 * Firebase Cloud Messaging (Android + iOS via APNs). Configure with the
 * project's service-account JSON in FIREBASE_SERVICE_ACCOUNT (raw JSON or
 * base64).
 */
export class FcmPushSender implements PushSender {
  readonly name = 'fcm';
  private readonly logger = new Logger(FcmPushSender.name);
  private readonly app?: App;
  private readonly messaging: Pick<Messaging, 'sendEachForMulticast'>;

  constructor(config: ConfigService, messaging?: Pick<Messaging, 'sendEachForMulticast'>) {
    if (messaging) {
      this.messaging = messaging;
      return;
    }
    const raw = config.get<string>('firebase.serviceAccount') ?? '';
    if (!raw) throw new Error('PUSH_PROVIDER=fcm requires FIREBASE_SERVICE_ACCOUNT');
    const account = parseServiceAccount(raw);
    this.app = initializeApp({ credential: cert(account) }, `tourguide-${Date.now()}`);
    this.messaging = getMessaging(this.app);
  }

  async send(tokens: string[], message: PushMessage): Promise<PushResult> {
    const result: PushResult = { sent: 0, invalidTokens: [] };
    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH);
      const res = await this.messaging.sendEachForMulticast({
        tokens: batch,
        notification: { title: message.title, body: message.body },
        data: message.data,
        android: { priority: 'high', notification: { channelId: 'tourguide_default' } },
        apns: { payload: { aps: { sound: 'default' } } },
      });
      result.sent += res.successCount;
      res.responses.forEach((r, idx) => {
        if (!r.success && r.error && DEAD_TOKEN_CODES.has(r.error.code)) result.invalidTokens.push(batch[idx]);
        else if (!r.success) this.logger.warn(`FCM error for a token: ${r.error?.code} ${r.error?.message}`);
      });
    }
    return result;
  }

  async onModuleDestroy() {
    if (this.app) await deleteApp(this.app);
  }
}

export function parseServiceAccount(raw: string): ServiceAccount {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const json = JSON.parse(text) as { project_id?: string; client_email?: string; private_key?: string };
  if (!json.project_id || !json.client_email || !json.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must be a service-account JSON with project_id, client_email and private_key');
  }
  return { projectId: json.project_id, clientEmail: json.client_email, privateKey: json.private_key.replace(/\\n/g, '\n') };
}
