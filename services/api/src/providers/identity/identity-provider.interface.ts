/**
 * Identity verification of guides (ID document + selfie/liveness), e.g.
 * Sumsub. The guide completes it in the provider's hosted flow; the result
 * arrives by webhook. Admins see the outcome before approving a guide.
 */
export const IDENTITY_PROVIDER = Symbol('IDENTITY_PROVIDER');

export type IdentityOutcomeStatus = 'pending' | 'approved' | 'retry' | 'rejected' | 'reset';

export interface IdentityOutcome {
  status: IdentityOutcomeStatus;
  /** Provider reject labels, e.g. BAD_PROOF_OF_IDENTITY. */
  labels?: string[];
  /** Message meant for the guide (provider's moderation comment). */
  comment?: string | null;
}

export interface IdentityStartRequest {
  /** Our id for the applicant (the guide id). */
  externalUserId: string;
  email?: string | null;
  phone?: string | null;
  lang: 'en' | 'ar';
}

export interface IdentityStart {
  /** Hosted verification page to open in a browser. */
  url?: string;
  /** Set when the provider decides synchronously (the stub). */
  immediate?: IdentityOutcome;
}

export interface IdentityWebhookEvent {
  type: string;
  externalUserId: string;
  applicantId: string | null;
  /** null for events that don't change the status. */
  outcome: IdentityOutcome | null;
}

export interface IdentityProvider {
  readonly name: string;
  start(req: IdentityStartRequest): Promise<IdentityStart>;
  /** Checks the webhook signature against the raw request body. */
  verifyWebhook(rawBody: Buffer, headers: Record<string, string | string[] | undefined>): boolean;
  parseWebhook(rawBody: Buffer): IdentityWebhookEvent | null;
}
