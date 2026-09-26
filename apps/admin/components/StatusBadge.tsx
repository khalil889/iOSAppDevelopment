'use client';

import { LabelNamespace, useI18n } from '@/lib/i18n';

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
  PAID: 'ok',
  RETRY: 'warn',
};

/** Translated status pill. `kind` picks the dictionary namespace (default: guide verification). */
export function StatusBadge({
  status,
  kind = 'verification',
  tone,
}: {
  status: string;
  kind?: LabelNamespace;
  tone?: 'ok' | 'warn' | 'bad' | 'neutral';
}) {
  const { label } = useI18n();
  return <span className={`badge ${tone ?? TONE[status] ?? 'neutral'}`}>{label(kind, status)}</span>;
}
