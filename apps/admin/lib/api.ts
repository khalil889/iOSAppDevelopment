'use client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const TOKEN_KEY = 'tg_admin_token';

export type VerificationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type KycStatus = 'NOT_STARTED' | 'CLEAR' | 'CONSIDER' | 'FAILED';

export interface AdminGuide {
  id: string;
  bio: string;
  languages: string[];
  yearsOfExperience: number;
  licenseNumber: string | null;
  licenseExpiresAt: string | null;
  licenseDocumentUrl: string | null;
  /** Short-lived signed link to the uploaded scan (private storage). */
  licenseDocumentDownloadUrl?: string | null;
  licenseCountry: { id: string; name: string; code: string } | null;
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  kycStatus: KycStatus;
  kycReference: string | null;
  kycResult: {
    provider: string;
    score: number;
    checks: Record<string, { passed: boolean; detail?: string }>;
  } | null;
  ratingAvg: number;
  ratingCount: number;
  user: { id: string; fullName: string; email: string | null; phone: string | null; avatarUrl: string | null; phoneVerifiedAt: string | null };
  cities: Array<{ id: string; name: string; country?: { name: string } }>;
  sites?: Array<{ id: string; name: string }>;
  history?: Array<{ id: string; fromStatus: VerificationStatus; toStatus: VerificationStatus; note: string | null; actorId: string | null; createdAt: string }>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const auth = {
  get token() {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (auth.token) headers.set('authorization', `Bearer ${auth.token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) auth.clear();
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? res.statusText;
    throw new ApiError(res.status, msg, body.error);
  }
  return body as T;
}

export const adminApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; user: { role: string; fullName: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<{ id: string; role: string; fullName: string }>('/auth/me'),
  counts: () => api<Record<VerificationStatus, number>>('/admin/guides/counts'),
  queue: (status: VerificationStatus, page = 1) =>
    api<Paginated<AdminGuide>>(`/admin/guides?status=${status}&page=${page}&limit=20`),
  guide: (id: string) => api<AdminGuide>(`/admin/guides/${id}`),
  approve: (id: string, note?: string) =>
    api<AdminGuide>(`/admin/guides/${id}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
  reject: (id: string, reason: string) =>
    api<AdminGuide>(`/admin/guides/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  suspend: (id: string, reason: string) =>
    api<AdminGuide>(`/admin/guides/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

export type EscrowStatus = 'PENDING' | 'HELD' | 'RELEASED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'DISPUTED' | 'FAILED';
export type DisputeResolution = 'REFUND_TOURIST' | 'RELEASE_TO_GUIDE' | 'PARTIAL_REFUND';

export interface AdminDispute {
  id: string;
  reason: string;
  description: string;
  status: 'OPEN' | 'RESOLVED';
  resolution: DisputeResolution | null;
  refundPercent: number | null;
  resolutionNote: string | null;
  openedById: string;
  createdAt: string;
  resolvedAt: string | null;
  booking: {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    groupSize: number;
    totalMinor: number;
    guidePayoutMinor: number;
    currency: string;
    touristId: string;
    completedAt: string | null;
    tourist: { fullName: string; email: string | null; phone: string | null };
    guide: { id: string; user: { fullName: string; email: string | null; phone: string | null } };
    package: { title: string; city?: { name: string } };
    payment: { escrowStatus: EscrowStatus; amountMinor: number; refundedMinor: number; releasedMinor: number; provider: string; providerRef: string | null } | null;
  };
}

export interface SosAlert {
  id: string;
  createdAt: string;
  message: string | null;
  location: { lat: number; lng: number; mapsUrl: string } | null;
  acknowledgedAt: string | null;
  resolutionNote: string | null;
  raisedBy: 'TOURIST' | 'GUIDE';
  booking: {
    id: string;
    status: string;
    startAt: string;
    endAt: string;
    groupSize: number;
    packageTitle?: string;
    city?: string;
    tourist: { name?: string; phone?: string | null };
    guide: { name?: string; phone?: string | null };
  };
}

export const opsApi = {
  disputes: (status: 'OPEN' | 'RESOLVED' | '', page = 1) =>
    api<Paginated<AdminDispute>>(`/admin/disputes?page=${page}&limit=20${status ? `&status=${status}` : ''}`),
  dispute: (id: string) => api<AdminDispute>(`/admin/disputes/${id}`),
  resolve: (id: string, body: { resolution: DisputeResolution; refundPercent?: number; note?: string }) =>
    api<AdminDispute>(`/admin/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify(body) }),
  sos: (status: 'open' | 'acknowledged' | 'all') => api<SosAlert[]>(`/admin/sos?status=${status}`),
  sosCounts: () => api<{ open: number; acknowledged: number }>('/admin/sos/counts'),
  acknowledge: (id: string, note?: string) =>
    api<SosAlert>(`/admin/sos/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ note }) }),
};

/** Minor units → display string; JOD/KWD/BHD/OMR use 3 decimals. */
export const fmtMoney = (minor: number, currency: string) => {
  const exp = ['JOD', 'KWD', 'BHD', 'OMR', 'TND'].includes(currency) ? 3 : 2;
  const value = minor / 10 ** exp;
  const digits = Number.isInteger(value) ? 0 : exp;
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const timeAgo = (s: string | null | undefined) => {
  if (!s) return '—';
  const h = Math.round((Date.now() - new Date(s).getTime()) / 3_600_000);
  if (h < 1) return 'just now';
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};
