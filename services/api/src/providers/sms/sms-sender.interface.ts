/** SMS gateway used for phone OTP (e.g. Twilio, Unifonic, Vonage). */
export const SMS_SENDER = Symbol('SMS_SENDER');

export interface SmsSender {
  readonly name: string;
  send(toE164: string, body: string): Promise<void>;
}
