import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { KycProvider, LicenseCheckRequest, LicenseCheckResult } from './kyc-provider.interface';

/**
 * Deterministic fake: a license number shaped like `CC-<digits>` (country code
 * prefix matching the issuing country) passes; anything containing "FAKE"
 * fails; everything else needs a closer look ("consider").
 */
@Injectable()
export class StubKycProvider implements KycProvider {
  readonly name = 'stub';

  async checkLicense(req: LicenseCheckRequest): Promise<LicenseCheckResult> {
    const formatOk = new RegExp(`^${req.licenseCountryCode}-\\d{4,}$`, 'i').test(req.licenseNumber);
    const flagged = /fake/i.test(req.licenseNumber);
    const docProvided = !!req.documentUrl;
    const notExpired = !req.licenseExpiresAt || new Date(req.licenseExpiresAt) > new Date();

    const checks = {
      license_format: { passed: formatOk, detail: `Expected ${req.licenseCountryCode}-NNNN` },
      registry_match: { passed: formatOk && !flagged },
      document_provided: { passed: docProvided },
      not_expired: { passed: notExpired },
    };
    const status = flagged || !notExpired ? 'failed' : formatOk && docProvided ? 'clear' : 'consider';
    const score = Object.values(checks).filter((c) => c.passed).length / Object.keys(checks).length;
    return { status, reference: `stub_kyc_${randomUUID()}`, score, checks };
  }
}
