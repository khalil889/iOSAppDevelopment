'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  dirOf,
  formatDate as fmtDate,
  formatDay as fmtDay,
  formatLanguage,
  formatMoney as fmtMoney,
  formatRelative,
  getStoredLocale,
  Locale,
  LOCALE_STORAGE_KEY,
  storeLocale,
} from './locale';

export type { Locale } from './locale';

/* ------------------------------------------------------------------ */
/* Dictionaries. `en` is the source of truth; `ar` must have every key. */
/* ------------------------------------------------------------------ */

const en = {
  'app.title': 'TourGuide Admin',
  'lang.label': 'Language',

  'common.loading': 'Loading…',
  'common.refresh': 'Refresh',
  'common.cancel': 'Cancel',
  'common.justNow': 'just now',
  'common.prev': '← Prev',
  'common.next': 'Next →',
  'common.pageOf': 'Page {page} of {pages}',
  'common.tourist': 'Tourist',
  'common.guide': 'Guide',
  'common.listSep': ', ',

  'auth.checking': 'Checking session…',
  'nav.label': 'Main navigation',
  'nav.guides': 'Guide verification',
  'nav.disputes': 'Disputes',
  'nav.sos': 'SOS',
  'nav.signOut': 'Sign out',

  'login.subtitle': 'Sign in to review guide applications.',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.submitting': 'Signing in…',
  'login.notAdmin': 'This account does not have admin access.',
  'login.demoHint': 'Seeded admin:',

  'guides.title': 'Guide verification',
  'guides.subtitle': 'Review license submissions. Oldest first.',
  'guides.emptyPending': '🎉 The queue is empty — no guides waiting for review.',
  'guides.emptyOther': 'No guides with this status.',
  'guides.col.guide': 'Guide',
  'guides.col.license': 'License',
  'guides.col.country': 'Country',
  'guides.col.check': 'Automated check',
  'guides.col.cities': 'Cities',
  'guides.col.submitted': 'Submitted',
  'guides.review': 'Review →',

  'guide.back': '← Back to queue',
  'guide.license': 'License',
  'guide.number': 'Number',
  'guide.issuingCountry': 'Issuing country',
  'guide.expires': 'Expires',
  'guide.expired': 'expired',
  'guide.document': 'Document',
  'guide.viewScan': 'View uploaded scan ↗',
  'guide.openScan': 'Open linked scan ↗',
  'guide.notProvided': 'not provided',
  'guide.submitted': 'Submitted',
  'guide.check': 'Automated check',
  'guide.provider': 'Provider',
  'guide.score': 'score {score}%',
  'guide.ref': 'ref',
  'guide.advisory': 'Automated results are advisory; the decision is yours.',
  'guide.noCheck': 'No check has been run.',
  'guide.contact': 'Contact',
  'guide.email': 'Email',
  'guide.phone': 'Phone',
  'guide.verified': 'verified',
  'guide.unverified': 'unverified',
  'guide.profile': 'Profile',
  'guide.languages': 'Languages',
  'guide.experience': 'Experience',
  'guide.years': '{n} years',
  'guide.cities': 'Cities',
  'guide.sites': 'Sites',
  'guide.decision': 'Decision',
  'guide.reasonOnFile': 'Reason on file:',
  'guide.notePlaceholder': 'Optional note for the audit log',
  'guide.licenseExpired': 'License has expired',
  'guide.approve': '✓ Approve',
  'guide.reject': '✕ Reject',
  'guide.approved': 'Guide approved — they can now receive bookings.',
  'guide.suspend': 'Suspend guide',
  'guide.rejectReason': 'Rejection reason (shown to the guide)',
  'guide.suspendReason': 'Suspension reason',
  'guide.reasonTooShort': 'Enter at least 5 characters.',
  'guide.confirmReject': 'Confirm rejection',
  'guide.confirmSuspend': 'Confirm suspension',
  'guide.rejected': 'Guide rejected — they can fix and resubmit.',
  'guide.suspended': 'Guide suspended.',
  'guide.noActions': 'No actions available for this status.',
  'guide.history': 'History',
  'guide.template.unreadable': 'License scan is unreadable — please upload a clearer photo.',
  'guide.template.notInRegistry': 'License number not found in the national tourism registry.',
  'guide.template.nameMismatch': 'Name on the license does not match the account name.',
  'guide.template.expired': 'License has expired — please submit a renewed license.',

  'disputes.title': 'Disputes',
  'disputes.subtitle': 'Escrow stays frozen until a dispute is resolved. Oldest first.',
  'disputes.emptyOpen': 'No open disputes.',
  'disputes.emptyResolved': 'No resolved disputes yet.',
  'disputes.col.tour': 'Tour',
  'disputes.col.reason': 'Reason',
  'disputes.col.openedBy': 'Opened by',
  'disputes.col.amount': 'Amount',
  'disputes.col.escrow': 'Escrow',
  'disputes.col.opened': 'Opened',
  'disputes.col.resolution': 'Resolution',
  'disputes.touristWithGuide': '{tourist} with {guide}',

  'dispute.back': '← Back to disputes',
  'dispute.complaint': 'Complaint',
  'dispute.reason': 'Reason',
  'dispute.openedBy': 'Opened by',
  'dispute.opened': 'Opened',
  'dispute.booking': 'Booking',
  'dispute.tourDate': 'Tour date',
  'dispute.city': 'City',
  'dispute.group': 'Group',
  'dispute.status': 'Status',
  'dispute.completed': 'Completed',
  'dispute.people': 'People',
  'dispute.money': 'Money',
  'dispute.paid': 'Paid',
  'dispute.guideShare': 'Guide share',
  'dispute.escrow': 'Escrow',
  'dispute.refunded': 'Refunded',
  'dispute.released': 'Released',
  'dispute.gateway': 'Gateway',
  'dispute.resolution': 'Resolution',
  'dispute.resolvedOn': 'on {date}',
  'dispute.opt.REFUND_TOURIST': 'Refund tourist in full',
  'dispute.opt.REFUND_TOURIST.help': 'The guide receives nothing.',
  'dispute.opt.PARTIAL_REFUND': 'Partial refund',
  'dispute.opt.PARTIAL_REFUND.help': 'Refund a percentage; the guide gets the rest minus the platform fee.',
  'dispute.opt.RELEASE_TO_GUIDE': 'Release to guide',
  'dispute.opt.RELEASE_TO_GUIDE.help': 'No refund; the guide is paid as normal.',
  'dispute.refundPct': 'Refund percentage: {percent}%',
  'dispute.touristRefund': 'Tourist refund',
  'dispute.guideReceives': 'Guide receives',
  'dispute.notePlaceholder': 'Note for the audit log (optional)',
  'dispute.settling': 'Settling…',
  'dispute.resolve': 'Resolve dispute',
  'dispute.confirm': "Refund {refund} and pay the guide {payout}? This moves money and can't be undone.",
  'dispute.resolved': 'Dispute resolved and escrow settled.',

  'sos.title': 'SOS alerts',
  'sos.subtitle': 'Raised from the live-tour screen. Refreshes every 15 seconds.',
  'sos.filter.open': 'open',
  'sos.filter.acknowledged': 'acknowledged',
  'sos.filter.all': 'all',
  'sos.emptyOpen': 'No open alerts.',
  'sos.emptyOther': 'Nothing here.',
  'sos.raisedBy': 'raised by {who} {ago}',
  'sos.tourist': 'Tourist',
  'sos.guide': 'Guide',
  'sos.tour': 'Tour',
  'sos.people': '{n} people',
  'sos.location': 'Location',
  'sos.notShared': 'not shared',
  'sos.raised': 'Raised',
  'sos.handled': 'Handled',
  'sos.notePlaceholder': 'What did you do? (called tourist, sent help, false alarm…)',
  'sos.saving': 'Saving…',
  'sos.acknowledge': 'Acknowledge',

  'role.TOURIST': 'tourist',
  'role.GUIDE': 'guide',

  'sosStatus.open': 'open',
  'sosStatus.acknowledged': 'acknowledged',

  'verification.DRAFT': 'draft',
  'verification.PENDING': 'pending',
  'verification.APPROVED': 'approved',
  'verification.REJECTED': 'rejected',
  'verification.SUSPENDED': 'suspended',

  'kyc.NOT_STARTED': 'not started',
  'kyc.CLEAR': 'clear',
  'kyc.CONSIDER': 'consider',
  'kyc.FAILED': 'failed',

  'kycCheck.license_format': 'license format',
  'kycCheck.registry_match': 'registry match',
  'kycCheck.document_provided': 'document provided',
  'kycCheck.not_expired': 'not expired',

  'booking.PENDING_PAYMENT': 'pending payment',
  'booking.CONFIRMED': 'confirmed',
  'booking.IN_PROGRESS': 'in progress',
  'booking.COMPLETED': 'completed',
  'booking.CANCELLED': 'cancelled',

  'escrow.PENDING': 'pending',
  'escrow.HELD': 'held',
  'escrow.RELEASED': 'released',
  'escrow.REFUNDED': 'refunded',
  'escrow.PARTIALLY_REFUNDED': 'partially refunded',
  'escrow.DISPUTED': 'disputed',
  'escrow.FAILED': 'failed',
  'escrow.SETTLING': 'settling',

  'disputeStatus.OPEN': 'open',
  'disputeStatus.RESOLVED': 'resolved',

  'resolution.REFUND_TOURIST': 'refund tourist',
  'resolution.RELEASE_TO_GUIDE': 'release to guide',
  'resolution.PARTIAL_REFUND': 'partial refund',

  'disputeReason.NO_SHOW': 'no show',
  'disputeReason.NOT_AS_DESCRIBED': 'not as described',
  'disputeReason.SAFETY': 'safety',
  'disputeReason.UNPROFESSIONAL': 'unprofessional',
  'disputeReason.BILLING': 'billing',
  'disputeReason.OTHER': 'other',
};

export type MessageKey = keyof typeof en;

const ar: Record<MessageKey, string> = {
  'app.title': 'إدارة TourGuide',
  'lang.label': 'اللغة',

  'common.loading': 'جارٍ التحميل…',
  'common.refresh': 'تحديث',
  'common.cancel': 'إلغاء',
  'common.justNow': 'الآن',
  'common.prev': '→ السابق',
  'common.next': 'التالي ←',
  'common.pageOf': 'صفحة {page} من {pages}',
  'common.tourist': 'السائح',
  'common.guide': 'المرشد',
  'common.listSep': '، ',

  'auth.checking': 'جارٍ التحقق من الجلسة…',
  'nav.label': 'القائمة الرئيسية',
  'nav.guides': 'توثيق المرشدين',
  'nav.disputes': 'النزاعات',
  'nav.sos': 'بلاغات الطوارئ',
  'nav.signOut': 'تسجيل الخروج',

  'login.subtitle': 'سجّل الدخول لمراجعة طلبات المرشدين.',
  'login.email': 'البريد الإلكتروني',
  'login.password': 'كلمة المرور',
  'login.submit': 'تسجيل الدخول',
  'login.submitting': 'جارٍ تسجيل الدخول…',
  'login.notAdmin': 'هذا الحساب لا يملك صلاحيات الإدارة.',
  'login.demoHint': 'حساب المسؤول التجريبي:',

  'guides.title': 'توثيق المرشدين',
  'guides.subtitle': 'راجع طلبات الترخيص المقدَّمة، والأقدم أولاً.',
  'guides.emptyPending': '🎉 قائمة الانتظار فارغة — لا يوجد مرشدون بانتظار المراجعة.',
  'guides.emptyOther': 'لا يوجد مرشدون بهذه الحالة.',
  'guides.col.guide': 'المرشد',
  'guides.col.license': 'الترخيص',
  'guides.col.country': 'الدولة',
  'guides.col.check': 'الفحص الآلي',
  'guides.col.cities': 'المدن',
  'guides.col.submitted': 'تاريخ التقديم',
  'guides.review': 'مراجعة ←',

  'guide.back': '→ العودة إلى قائمة الانتظار',
  'guide.license': 'الترخيص',
  'guide.number': 'الرقم',
  'guide.issuingCountry': 'دولة الإصدار',
  'guide.expires': 'تاريخ الانتهاء',
  'guide.expired': 'منتهي الصلاحية',
  'guide.document': 'المستند',
  'guide.viewScan': 'عرض النسخة المرفوعة ↗',
  'guide.openScan': 'فتح رابط النسخة ↗',
  'guide.notProvided': 'غير مقدَّم',
  'guide.submitted': 'تاريخ التقديم',
  'guide.check': 'الفحص الآلي',
  'guide.provider': 'المزوّد',
  'guide.score': 'النتيجة {score}%',
  'guide.ref': 'المرجع',
  'guide.advisory': 'نتائج الفحص الآلي استرشادية، والقرار النهائي لك.',
  'guide.noCheck': 'لم يُجرَ أي فحص بعد.',
  'guide.contact': 'بيانات التواصل',
  'guide.email': 'البريد الإلكتروني',
  'guide.phone': 'رقم الجوال',
  'guide.verified': 'موثّق',
  'guide.unverified': 'غير موثّق',
  'guide.profile': 'الملف الشخصي',
  'guide.languages': 'اللغات',
  'guide.experience': 'سنوات الخبرة',
  'guide.years': '{n}',
  'guide.cities': 'المدن',
  'guide.sites': 'المواقع',
  'guide.decision': 'القرار',
  'guide.reasonOnFile': 'السبب المسجَّل:',
  'guide.notePlaceholder': 'ملاحظة اختيارية لسجل التدقيق',
  'guide.licenseExpired': 'انتهت صلاحية الترخيص',
  'guide.approve': '✓ اعتماد',
  'guide.reject': '✕ رفض',
  'guide.approved': 'تم اعتماد المرشد — يمكنه الآن استقبال الحجوزات.',
  'guide.suspend': 'إيقاف المرشد',
  'guide.rejectReason': 'سبب الرفض (يظهر للمرشد)',
  'guide.suspendReason': 'سبب الإيقاف',
  'guide.reasonTooShort': 'أدخل 5 أحرف على الأقل.',
  'guide.confirmReject': 'تأكيد الرفض',
  'guide.confirmSuspend': 'تأكيد الإيقاف',
  'guide.rejected': 'تم رفض المرشد — يمكنه تصحيح البيانات وإعادة التقديم.',
  'guide.suspended': 'تم إيقاف المرشد.',
  'guide.noActions': 'لا توجد إجراءات متاحة لهذه الحالة.',
  'guide.history': 'السجل',
  'guide.template.unreadable': 'صورة الترخيص غير واضحة — يُرجى رفع صورة أوضح.',
  'guide.template.notInRegistry': 'رقم الترخيص غير موجود في السجل الوطني للسياحة.',
  'guide.template.nameMismatch': 'الاسم في الترخيص لا يطابق اسم الحساب.',
  'guide.template.expired': 'الترخيص منتهي الصلاحية — يُرجى تقديم ترخيص مجدَّد.',

  'disputes.title': 'النزاعات',
  'disputes.subtitle': 'يبقى المبلغ المحتجز مجمّداً حتى يُحسم النزاع، والأقدم أولاً.',
  'disputes.emptyOpen': 'لا توجد نزاعات مفتوحة.',
  'disputes.emptyResolved': 'لا توجد نزاعات محسومة بعد.',
  'disputes.col.tour': 'الجولة',
  'disputes.col.reason': 'السبب',
  'disputes.col.openedBy': 'مقدَّم من',
  'disputes.col.amount': 'المبلغ',
  'disputes.col.escrow': 'حالة الضمان',
  'disputes.col.opened': 'تاريخ الفتح',
  'disputes.col.resolution': 'القرار',
  'disputes.touristWithGuide': '{tourist} مع {guide}',

  'dispute.back': '→ العودة إلى النزاعات',
  'dispute.complaint': 'الشكوى',
  'dispute.reason': 'السبب',
  'dispute.openedBy': 'مقدَّم من',
  'dispute.opened': 'تاريخ الفتح',
  'dispute.booking': 'الحجز',
  'dispute.tourDate': 'موعد الجولة',
  'dispute.city': 'المدينة',
  'dispute.group': 'عدد الأفراد',
  'dispute.status': 'الحالة',
  'dispute.completed': 'تاريخ الإكمال',
  'dispute.people': 'الأطراف',
  'dispute.money': 'المبالغ',
  'dispute.paid': 'المبلغ المدفوع',
  'dispute.guideShare': 'حصة المرشد',
  'dispute.escrow': 'حالة الضمان',
  'dispute.refunded': 'المبلغ المسترد',
  'dispute.released': 'المبلغ المحوَّل',
  'dispute.gateway': 'بوابة الدفع',
  'dispute.resolution': 'القرار',
  'dispute.resolvedOn': 'بتاريخ {date}',
  'dispute.opt.REFUND_TOURIST': 'استرداد كامل المبلغ للسائح',
  'dispute.opt.REFUND_TOURIST.help': 'لا يحصل المرشد على أي مبلغ.',
  'dispute.opt.PARTIAL_REFUND': 'استرداد جزئي',
  'dispute.opt.PARTIAL_REFUND.help': 'يُسترد جزء بنسبة مئوية، ويحصل المرشد على الباقي بعد خصم رسوم المنصة.',
  'dispute.opt.RELEASE_TO_GUIDE': 'تحويل المبلغ للمرشد',
  'dispute.opt.RELEASE_TO_GUIDE.help': 'لا يوجد استرداد، ويُصرف للمرشد مستحقه كالمعتاد.',
  'dispute.refundPct': 'نسبة الاسترداد: {percent}%',
  'dispute.touristRefund': 'المسترد للسائح',
  'dispute.guideReceives': 'يحصل المرشد على',
  'dispute.notePlaceholder': 'ملاحظة لسجل التدقيق (اختياري)',
  'dispute.settling': 'جارٍ التسوية…',
  'dispute.resolve': 'حسم النزاع',
  'dispute.confirm': 'هل تريد استرداد {refund} للسائح وصرف {payout} للمرشد؟ هذه العملية تحوّل أموالاً فعلياً ولا يمكن التراجع عنها.',
  'dispute.resolved': 'تم حسم النزاع وتسوية المبلغ المحتجز.',

  'sos.title': 'بلاغات الطوارئ',
  'sos.subtitle': 'تُرسَل من شاشة الجولة المباشرة، ويتم التحديث كل 15 ثانية.',
  'sos.filter.open': 'المفتوحة',
  'sos.filter.acknowledged': 'المُعالَجة',
  'sos.filter.all': 'الكل',
  'sos.emptyOpen': 'لا توجد بلاغات مفتوحة.',
  'sos.emptyOther': 'لا توجد بلاغات.',
  'sos.raisedBy': 'أرسله {who} {ago}',
  'sos.tourist': 'السائح',
  'sos.guide': 'المرشد',
  'sos.tour': 'الجولة',
  'sos.people': 'عدد الأفراد: {n}',
  'sos.location': 'الموقع',
  'sos.notShared': 'لم تتم مشاركته',
  'sos.raised': 'وقت البلاغ',
  'sos.handled': 'وقت المعالجة',
  'sos.notePlaceholder': 'ما الإجراء المتخذ؟ (الاتصال بالسائح، إرسال المساعدة، بلاغ خاطئ…)',
  'sos.saving': 'جارٍ الحفظ…',
  'sos.acknowledge': 'تأكيد المعالجة',

  'role.TOURIST': 'السائح',
  'role.GUIDE': 'المرشد',

  'sosStatus.open': 'مفتوح',
  'sosStatus.acknowledged': 'تمت المعالجة',

  'verification.DRAFT': 'مسودة',
  'verification.PENDING': 'قيد المراجعة',
  'verification.APPROVED': 'معتمد',
  'verification.REJECTED': 'مرفوض',
  'verification.SUSPENDED': 'موقوف',

  'kyc.NOT_STARTED': 'لم يبدأ',
  'kyc.CLEAR': 'سليم',
  'kyc.CONSIDER': 'يحتاج إلى تدقيق',
  'kyc.FAILED': 'لم يجتز',

  'kycCheck.license_format': 'صيغة رقم الترخيص',
  'kycCheck.registry_match': 'المطابقة مع السجل',
  'kycCheck.document_provided': 'إرفاق المستند',
  'kycCheck.not_expired': 'سريان الترخيص',

  'booking.PENDING_PAYMENT': 'بانتظار الدفع',
  'booking.CONFIRMED': 'مؤكد',
  'booking.IN_PROGRESS': 'قيد التنفيذ',
  'booking.COMPLETED': 'مكتمل',
  'booking.CANCELLED': 'ملغى',

  'escrow.PENDING': 'قيد الانتظار',
  'escrow.HELD': 'محتجز',
  'escrow.RELEASED': 'محوَّل للمرشد',
  'escrow.REFUNDED': 'مسترد',
  'escrow.PARTIALLY_REFUNDED': 'مسترد جزئياً',
  'escrow.DISPUTED': 'متنازع عليه',
  'escrow.FAILED': 'فشل',
  'escrow.SETTLING': 'قيد التسوية',

  'disputeStatus.OPEN': 'مفتوح',
  'disputeStatus.RESOLVED': 'محسوم',

  'resolution.REFUND_TOURIST': 'استرداد للسائح',
  'resolution.RELEASE_TO_GUIDE': 'تحويل للمرشد',
  'resolution.PARTIAL_REFUND': 'استرداد جزئي',

  'disputeReason.NO_SHOW': 'عدم الحضور',
  'disputeReason.NOT_AS_DESCRIBED': 'غير مطابق للوصف',
  'disputeReason.SAFETY': 'السلامة',
  'disputeReason.UNPROFESSIONAL': 'سلوك غير مهني',
  'disputeReason.BILLING': 'الفوترة',
  'disputeReason.OTHER': 'أخرى',
};

export const messages: Record<Locale, Record<MessageKey, string>> = { en, ar };

/** Enum namespaces that `label()` can translate. */
export type LabelNamespace =
  | 'verification'
  | 'kyc'
  | 'kycCheck'
  | 'booking'
  | 'escrow'
  | 'disputeStatus'
  | 'resolution'
  | 'disputeReason'
  | 'sosStatus'
  | 'role';

type Vars = Record<string, string | number>;

const interpolate = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;

function translator(locale: Locale) {
  const dict = messages[locale];
  const t = (key: MessageKey, vars?: Vars) => interpolate(dict[key] ?? en[key] ?? key, vars);
  /** Translate an API enum value, falling back to a humanized form for values we don't know yet. */
  const label = (ns: LabelNamespace, value: string | null | undefined) => {
    if (!value) return '—';
    const key = `${ns}.${value}` as MessageKey;
    return key in dict ? dict[key] : value.replace(/_/g, ' ').toLowerCase();
  };
  return { t, label };
}

export interface I18n {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (l: Locale) => void;
  t: (key: MessageKey, vars?: Vars) => string;
  label: (ns: LabelNamespace, value: string | null | undefined) => string;
  formatDate: (s: string | null | undefined) => string;
  formatDay: (s: string | null | undefined) => string;
  formatMoney: (minor: number, currency: string) => string;
  timeAgo: (s: string | null | undefined) => string;
  languageName: (code: string) => string;
}

function build(locale: Locale, setLocale: (l: Locale) => void): I18n {
  const { t, label } = translator(locale);
  return {
    locale,
    dir: dirOf(locale),
    setLocale,
    t,
    label,
    formatDate: (s) => fmtDate(s, locale),
    formatDay: (s) => fmtDay(s, locale),
    formatMoney: (minor, currency) => fmtMoney(minor, currency, locale),
    timeAgo: (s) => (s ? formatRelative(s, locale) ?? t('common.justNow') : '—'),
    languageName: (code) => formatLanguage(code, locale),
  };
}

const I18nContext = createContext<I18n>(build(DEFAULT_LOCALE, () => undefined));

/**
 * Renders English on the server and on the first client render (no hydration
 * mismatch), then switches to the stored / browser locale after mount.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    // Keep other open tabs in sync.
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCALE_STORAGE_KEY) setLocaleState(getStoredLocale());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = dirOf(locale);
    document.title = messages[locale]['app.title'];
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    storeLocale(l);
    setLocaleState(l);
  }, []);

  const value = useMemo(() => build(locale, setLocale), [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
