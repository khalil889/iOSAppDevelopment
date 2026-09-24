/** Mobile push gateway (Firebase Cloud Messaging covers Android and iOS/APNs). */
export const PUSH_SENDER = Symbol('PUSH_SENDER');

export interface PushMessage {
  title: string;
  body: string;
  /** String-only payload the app uses to route a tap (e.g. { screen: 'booking', bookingId }). */
  data?: Record<string, string>;
}

export interface PushResult {
  sent: number;
  /** Tokens the gateway says are dead (app uninstalled, token rotated) — delete them. */
  invalidTokens: string[];
}

export interface PushSender {
  readonly name: string;
  send(tokens: string[], message: PushMessage): Promise<PushResult>;
}
