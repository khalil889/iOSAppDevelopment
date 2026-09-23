import { DomainError } from '../common/errors/domain-error';
import { GuideVerificationStatus } from '../common/enums';
import { isLicenseExpired } from '../bookings/booking.rules';

const S = GuideVerificationStatus;

/** Guides may (re)submit from DRAFT or after a rejection. */
export function assertCanSubmitApplication(status: GuideVerificationStatus): void {
  if (status !== S.DRAFT && status !== S.REJECTED) {
    throw new DomainError('APPLICATION_LOCKED', `Application cannot be resubmitted while ${status}`, 'conflict');
  }
}

export function assertCanApprove(
  guide: { verificationStatus: GuideVerificationStatus; licenseNumber: string | null; licenseExpiresAt: string | null },
  now: Date,
): void {
  if (guide.verificationStatus !== S.PENDING) {
    throw new DomainError('NOT_PENDING', `Only pending guides can be approved (currently ${guide.verificationStatus})`, 'conflict');
  }
  if (!guide.licenseNumber) {
    throw new DomainError('LICENSE_MISSING', 'Guide has not provided a license number');
  }
  if (isLicenseExpired(guide.licenseExpiresAt, now)) {
    throw new DomainError('LICENSE_EXPIRED', 'Guide license has expired');
  }
}

export function assertCanReject(status: GuideVerificationStatus, reason: string | undefined): void {
  if (status !== S.PENDING) {
    throw new DomainError('NOT_PENDING', `Only pending guides can be rejected (currently ${status})`, 'conflict');
  }
  if (!reason || reason.trim().length < 5) {
    throw new DomainError('REASON_REQUIRED', 'A rejection reason (min 5 characters) is required');
  }
}

export function assertCanSuspend(status: GuideVerificationStatus, reason: string | undefined): void {
  if (status !== S.APPROVED) {
    throw new DomainError('NOT_APPROVED', 'Only approved guides can be suspended', 'conflict');
  }
  if (!reason || reason.trim().length < 5) {
    throw new DomainError('REASON_REQUIRED', 'A suspension reason (min 5 characters) is required');
  }
}
