import type { KycStatus, VerificationStatus } from '@/lib/api';

const TONE: Record<string, string> = {
  PENDING: 'warn',
  APPROVED: 'ok',
  REJECTED: 'bad',
  SUSPENDED: 'bad',
  DRAFT: 'neutral',
  CLEAR: 'ok',
  CONSIDER: 'warn',
  FAILED: 'bad',
  NOT_STARTED: 'neutral',
};

export function StatusBadge({ status, prefix }: { status: VerificationStatus | KycStatus; prefix?: string }) {
  return (
    <span className={`badge ${TONE[status] ?? 'neutral'}`}>
      {prefix ? `${prefix} ` : ''}
      {status.replace('_', ' ').toLowerCase()}
    </span>
  );
}
