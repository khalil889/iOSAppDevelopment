'use client';

import { getStoredLocale } from './locale';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';
const ACCESS_KEY = 'tg_admin_access';
const REFRESH_KEY = 'tg_admin_refresh';

export type VerificationStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type KycStatus = 'NOT_STARTED' | 'CLEAR' | 'CONSIDER' | 'FAILED';
export type IdentityStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'RETRY' | 'REJECTED';

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
  /** ID document + selfie check; approval requires APPROVED. */
  identityStatus?: IdentityStatus;
  identityCheckedAt?: string | null;
  identityReview?: { labels?: string[]; comment?: string | null } | null;
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

/**
 * Tokens live in sessionStorage: they survive a reload but not closing the
 * tab, and aren't shared with other tabs or kept on disk long-term.
 */
export const auth = {
  get token() {
    return typeof window === 'undefined' ? null : window.sessionStorage.getItem(ACCESS_KEY);
  },
  get refreshToken() {
    return typeof window === 'undefined' ? null : window.sessionStorage.getItem(REFRESH_KEY);
  },
  set(accessToken: string, refreshToken: string) {
    window.sessionStorage.setItem(ACCESS_KEY, accessToken);
    window.sessionStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear() {
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem('tg_admin_token'); // pre-refresh-token versions
  },
};

/** The API localizes error messages from this header. */
const baseHeaders = (): Record<string, string> => ({
  'content-type': 'application/json',
  'accept-language': getStoredLocale(),
});

let refreshing: Promise<boolean> | null = null;

/** Single-flight refresh: refresh tokens are single-use. */
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = auth.refreshToken;
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const body = await res.json();
      auth.set(body.accessToken, body.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  headers.set('accept-language', getStoredLocale());
  if (auth.token) headers.set('authorization', `Bearer ${auth.token}`);

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && auth.token && retry && (await refreshTokens())) return api<T>(path, init, false);
    if (res.status === 401) auth.clear();
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? res.statusText;
    throw new ApiError(res.status, msg, body.error);
  }
  return body as T;
}

/** Only same-site paths are allowed as post-login redirects. */
export function safeNextPath(next: string | null): string {
  return next && /^\/(?![/\\])[\w\-./?=&%]*$/.test(next) ? next : '/analytics';
}

export const adminApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; refreshToken: string; user: { role: string; fullName: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<{ id: string; role: string; fullName: string }>('/auth/me'),
  logout: () => {
    const refreshToken = auth.refreshToken;
    auth.clear();
    return refreshToken
      ? fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: baseHeaders(), body: JSON.stringify({ refreshToken }) }).catch(() => undefined)
      : Promise.resolve();
  },
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

/* ---------------------------------------------------------------- */
/* Payouts                                                            */
/* ---------------------------------------------------------------- */

export type PayoutStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface OwedRow {
  guideId: string;
  guideName: string;
  currency: string;
  amountMinor: number;
  paymentCount: number;
  oldestReleasedAt: string;
  ibanMasked: string | null;
  holderName: string | null;
}

export interface PayoutRun {
  id: string;
  currency: string;
  totalMinor: number;
  payoutCount: number;
  createdAt: string;
  createdById: string;
  /** Bank-file downloads; uploading the same file twice would pay twice. */
  exportCount?: number;
  lastExportedAt?: string | null;
}

export type PayoutSkipReason = 'NO_ACCOUNT' | 'ACCOUNT_RECENTLY_CHANGED';

/** Handed from the payouts page to the new run's page (sessionStorage) so it can list who was skipped. */
export interface SkippedGuide {
  guideId: string;
  reason: PayoutSkipReason;
  guideName: string;
  amountMinor: number | null;
}
export const skippedKey = (runId: string) => `tg_admin_run_skipped:${runId}`;

export interface Payout {
  id: string;
  guideId: string;
  guide: { id: string; name: string; phone: string | null };
  amountMinor: number;
  currency: string;
  paymentCount: number;
  status: PayoutStatus;
  holderName: string;
  ibanMasked: string;
  note: string | null;
  paidAt: string | null;
}

export interface PayoutRunDetail extends PayoutRun {
  payouts: Payout[];
}

export const payoutsApi = {
  owed: () => api<OwedRow[]>('/admin/payouts/owed'),
  runs: () => api<PayoutRun[]>('/admin/payouts/runs'),
  createRun: (currency: string) =>
    api<{ run: PayoutRun; skippedGuideIds: string[]; skipped?: Array<{ guideId: string; reason: PayoutSkipReason }> }>('/admin/payouts/runs', { method: 'POST', body: JSON.stringify({ currency }) }),
  run: (id: string) => api<PayoutRunDetail>(`/admin/payouts/runs/${id}`),
  markPaid: (id: string, reference: string) =>
    api<Payout>(`/admin/payouts/${id}/paid`, { method: 'POST', body: JSON.stringify({ reference }) }),
  /** PENDING → FAILED, or PAID → FAILED when the bank returned the transfer. */
  markFailed: (id: string, reason: string) =>
    api<Payout>(`/admin/payouts/${id}/failed`, { method: 'POST', body: JSON.stringify({ reason }) }),
  /** The bank file needs the bearer token, so it can't be a plain link: fetch it and hand the browser a Blob. */
  async downloadCsv(id: string, filename: string, retry = true): Promise<void> {
    const headers: Record<string, string> = { 'accept-language': getStoredLocale() };
    if (auth.token) headers.authorization = `Bearer ${auth.token}`;
    const res = await fetch(`${API_URL}/admin/payouts/runs/${id}/export`, { headers, cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 401 && auth.token && retry && (await refreshTokens())) return payoutsApi.downloadCsv(id, filename, false);
      const body = await res.json().catch(() => ({}));
      const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? res.statusText;
      throw new ApiError(res.status, msg, body.error);
    }
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};

/* ---------------------------------------------------------------- */
/* Analytics                                                          */
/* ---------------------------------------------------------------- */

export type AnalyticsDays = 7 | 30 | 90 | 365;

interface BookingCounts {
  created: number;
  paid: number;
  completed: number;
  cancelled: number;
  conversion: number;
}

interface MoneyTotals {
  gmvMinor: number;
  refundsMinor: number;
  guidePayoutsMinor: number;
  platformRevenueMinor: number;
  inEscrowMinor: number;
}

export interface Analytics {
  range: { from: string; to: string; days: number; currency: string; timeZone: string };
  bookings: BookingCounts & { previous?: BookingCounts };
  money: MoneyTotals & { previous?: MoneyTotals };
  users: { newTourists: number; newGuides: number };
  reviews: { count: number; avgRating: number };
  safety: { disputes: number; openDisputes: number; sosAlerts: number };
  daily: Array<{ date: string; bookings: number; gmvMinor: number }>;
  topCities: Array<{ id: string; name: string; nameAr: string | null; bookings: number; gmvMinor: number }>;
  topGuides: Array<{ id: string; name: string; rating: number; bookings: number; gmvMinor: number }>;
  guideFunnel: Partial<Record<VerificationStatus, number>>;
  currencies: string[];
}

export const analyticsApi = {
  overview: (days: AnalyticsDays, currency: string) =>
    api<Analytics>(`/admin/analytics?days=${days}&currency=${encodeURIComponent(currency)}`),
};

// Date and money formatting is locale-aware: see lib/locale.ts and useI18n().
