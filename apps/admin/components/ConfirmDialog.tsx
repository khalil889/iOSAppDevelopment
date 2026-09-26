'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { useI18n } from '@/lib/i18n';

/**
 * Modal confirmation built on <dialog>: focus is trapped, Esc cancels, and the
 * page behind is inert while it is open.
 */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = 'primary',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="confirm"
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h3 id="confirm-title">{title}</h3>
      {children}
      <div className="row">
        <button className="btn ghost" onClick={onCancel} disabled={busy}>
          {t('common.cancel')}
        </button>
        <button className={`btn ${tone}`} onClick={onConfirm} disabled={busy} autoFocus>
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </dialog>
  );
}
