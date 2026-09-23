/**
 * Identity / license verification (e.g. Onfido, Sumsub, a government
 * tourism-authority registry). Results are advisory: an admin still makes
 * the final approve/reject decision in the verification queue.
 */
export const KYC_PROVIDER = Symbol('KYC_PROVIDER');

export interface LicenseCheckRequest {
  guideId: string;
  fullName: string;
  licenseNumber: string;
  licenseCountryCode: string;
  licenseExpiresAt: string | null;
  documentUrl: string | null;
}

export interface LicenseCheckResult {
  status: 'clear' | 'consider' | 'failed';
  reference: string;
  /** 0..1 confidence that the license is genuine and belongs to the person */
  score: number;
  checks: Record<string, { passed: boolean; detail?: string }>;
}

export interface KycProvider {
  readonly name: string;
  checkLicense(req: LicenseCheckRequest): Promise<LicenseCheckResult>;
}
