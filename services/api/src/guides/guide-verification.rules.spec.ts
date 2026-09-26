import { GuideVerificationStatus as S } from '../common/enums';
import { DomainError } from '../common/errors/domain-error';
import { IdentityStatus } from '../common/enums';
import {
  assertCanApprove,
  assertCanReject,
  assertCanSubmitApplication,
} from './guide-verification.rules';

const NOW = new Date('2026-05-01T00:00:00Z');
const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as DomainError).code;
  }
  return null;
};

describe('guide verification rules', () => {
  const pending = {
    verificationStatus: S.PENDING,
    licenseNumber: 'SA-123',
    licenseExpiresAt: '2027-01-01',
    identityStatus: IdentityStatus.APPROVED,
  };

  it('approves pending guides with a valid license', () => {
    expect(code(() => assertCanApprove(pending, NOW))).toBeNull();
  });

  it('refuses to approve non-pending, unlicensed or expired guides', () => {
    expect(code(() => assertCanApprove({ ...pending, verificationStatus: S.APPROVED }, NOW))).toBe('NOT_PENDING');
    expect(code(() => assertCanApprove({ ...pending, licenseNumber: null }, NOW))).toBe('LICENSE_MISSING');
    expect(code(() => assertCanApprove({ ...pending, licenseExpiresAt: '2026-04-30' }, NOW))).toBe('LICENSE_EXPIRED');
    expect(code(() => assertCanApprove({ ...pending, identityStatus: IdentityStatus.PENDING }, NOW))).toBe('IDENTITY_NOT_VERIFIED');
  });

  it('requires a reason to reject', () => {
    expect(code(() => assertCanReject(S.PENDING, 'blurry license scan'))).toBeNull();
    expect(code(() => assertCanReject(S.PENDING, ' '))).toBe('REASON_REQUIRED');
    expect(code(() => assertCanReject(S.REJECTED, 'again please'))).toBe('NOT_PENDING');
  });

  it('allows resubmission only from DRAFT or REJECTED', () => {
    expect(code(() => assertCanSubmitApplication(S.DRAFT))).toBeNull();
    expect(code(() => assertCanSubmitApplication(S.REJECTED))).toBeNull();
    expect(code(() => assertCanSubmitApplication(S.PENDING))).toBe('APPLICATION_LOCKED');
    expect(code(() => assertCanSubmitApplication(S.APPROVED))).toBe('APPLICATION_LOCKED');
  });
});
