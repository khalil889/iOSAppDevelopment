/**
 * Arabic text for API errors. Domain errors are keyed by code; a few codes
 * cover several situations, so the English message can pick a variant.
 */
type Entry = string | Record<string, string> | ((english: string) => string);
const num = (english: string) => /\d+/.exec(english)?.[0] ?? '';

export const DOMAIN_ERRORS_AR: Record<string, Entry> = {
  ACCOUNT_INACTIVE: 'حسابك غير مفعّل',
  ALREADY_ACKNOWLEDGED: 'تم استلام هذا التنبيه مسبقًا',
  ALREADY_PAID: 'تم دفع هذا الحجز مسبقًا',
  ALREADY_REVIEWED: 'لقد قيّمت هذا الحجز مسبقًا',
  ALREADY_SETTLED: 'تجري تسوية هذا المبلغ أو تمت تسويته',
  APPLICATION_LOCKED: 'لا يمكن تعديل الطلب أثناء مراجعته',
  BOOKING_CANCELLED: 'أُلغي هذا الحجز، وتم استرداد المبلغ المدفوع.',
  BOOKING_CHANGED: 'تم تحديث هذا الحجز للتو. حدّث الصفحة وحاول مرة أخرى.',
  BOOKING_NOT_COMPLETED: 'يمكنك تقييم الجولة بعد اكتمالها فقط',
  CANNOT_BOOK_SELF: 'لا يمكنك حجز جولتك الخاصة',
  CITY_NOT_SERVED: 'أضف هذه المدينة إلى ملفك قبل تقديم جولات فيها',
  COMMENT_TOO_LONG: 'التعليق طويل جدًا',
  DATE_IN_PAST: 'اختر تاريخ اليوم أو تاريخًا لاحقًا',
  DISPUTE_ALREADY_OPEN: 'يوجد نزاع مفتوح لهذا الحجز',
  DISPUTE_CLOSED: 'تمت تسوية النزاع مسبقًا',
  DISPUTE_NOT_ALLOWED: 'يمكن فتح نزاع للجولات الجارية أو المكتملة فقط',
  DISPUTE_WINDOW_CLOSED: 'انتهت مدة فتح النزاع لهذا الحجز',
  DOCUMENT_NOT_UPLOADED: 'لم يكتمل رفع صورة الرخصة بعد',
  ESCROW_NOT_HELD: 'لم يعد مبلغ هذا الحجز محجوزًا في الضمان',
  GROUP_TOO_LARGE: (en) => `الحد الأقصى لهذه الجولة ${num(en)} أشخاص`,
  GUIDE_LICENSE_EXPIRED: 'انتهت صلاحية رخصة المرشد',
  GUIDE_NOT_VERIFIED: 'هذا المرشد غير موثّق للحجز',
  GUIDE_UNAVAILABLE: 'المرشد غير متاح في هذا الوقت',
  IDENTITY_NOT_VERIFIED: 'لم يجتز المرشد التحقق من الهوية بعد',
  INVALID_DATE: 'صيغة التاريخ يجب أن تكون YYYY-MM-DD',
  INVALID_DOCUMENT: 'ارفع صورة الرخصة أولًا',
  INVALID_FEE: 'يجب أن تكون عمولة المنصة بين 0 و100٪',
  INVALID_GROUP_SIZE: 'عدد المشاركين غير صالح',
  INVALID_IBAN: 'رقم الآيبان غير صحيح، تحقّق منه',
  INVALID_PRICE: 'السعر غير صالح',
  INVALID_RANGE: 'يجب أن ينتهي الإجازة في تاريخ البداية أو بعده',
  INVALID_RATING: 'التقييم يجب أن يكون رقمًا صحيحًا من 1 إلى 5',
  INVALID_REFUND_PERCENT: 'نسبة الاسترداد الجزئي يجب أن تكون بين 1 و99',
  INVALID_START: 'وقت البدء غير صالح',
  INVALID_TIME: 'يجب أن تكون الأوقات بين 00:00 و24:00',
  INVALID_TRANSITION: 'لا يمكن تنفيذ هذا الإجراء على الحجز في حالته الحالية',
  INVALID_WEEKDAY: 'يوم الأسبوع غير صالح',
  INVALID_WINDOW: 'يجب أن تنتهي كل فترة بعد بدايتها',
  LICENSE_EXPIRED: 'انتهت صلاحية رخصة المرشد',
  LICENSE_MISSING: 'لم يقدّم المرشد رقم الرخصة',
  NOTHING_TO_PAY: 'لا يوجد مرشد لديه حساب تحويل ومستحقات بهذه العملة',
  NOT_APPROVED: 'يمكن إيقاف المرشدين المعتمدين فقط',
  NOT_BOOKING_GUIDE: 'هذا الإجراء متاح للمرشد المكلّف بالجولة فقط',
  NOT_BOOKING_OWNER: 'هذا الإجراء متاح للسائح صاحب الحجز فقط',
  NOT_PARTICIPANT: 'لست طرفًا في هذا الحجز',
  NOT_PENDING: 'هذا الطلب ليس قيد المراجعة',
  ONLY_TOURISTS_CAN_BOOK: 'الحجز متاح لحسابات السياح فقط',
  OVERLAPPING_WINDOWS: 'يجب ألا تتداخل الفترات في اليوم نفسه',
  PACKAGE_GUIDE_MISMATCH: 'هذه الجولة لا تخص هذا المرشد',
  PACKAGE_INACTIVE: 'هذه الجولة لم تعد متاحة',
  PAST_TIME_OFF: 'لا يمكن إضافة إجازة في الماضي',
  PAYMENT_ALREADY_USED: 'هذه العملية مرتبطة بحجز آخر',
  PAYMENT_FAILED: 'تعذّر إتمام الدفع. حاول مرة أخرى أو استخدم بطاقة أخرى.',
  PAYMENT_WINDOW_EXPIRED: 'انتهت مهلة الدفع، يرجى الحجز مرة أخرى',
  PHOTO_NOT_UPLOADED: 'لم يكتمل رفع إحدى الصور. حاول إضافتها مرة أخرى.',
  PHONE_NOT_VERIFIED: 'وثّق رقم جوالك قبل الحجز',
  REASON_REQUIRED: 'يجب ذكر السبب (5 أحرف على الأقل)',
  REVIEW_WINDOW_CLOSED: 'انتهت مدة التقييم لهذه الجولة',
  SITE_CITY_MISMATCH: 'اختر معالم في مدينة الجولة',
  SLOT_UNAVAILABLE: {
    default: 'المرشد محجوز في هذا الوقت',
    refunded: 'حُجز هذا الموعد أثناء معالجة الدفع، وتم استرداد المبلغ كاملًا.',
  },
  SOS_RATE_LIMITED: 'وصلتنا تنبيهاتك وفريقنا يتعامل معها الآن.',
  TOO_EARLY_TO_START: 'لا يمكن بدء الجولة بعد',
  TOO_FAR_AHEAD: (en) => `يمكن الحجز قبل ${num(en)} يومًا كحد أقصى`,
  TOO_SOON: (en) => `يجب حجز الجولات قبل ${num(en)} ساعة على الأقل`,
  TOO_MANY_WINDOWS: 'عدد الفترات كبير جدًا',
  TOUR_NOT_ACTIVE: {
    default: 'زر الطوارئ متاح للجولات القادمة أو الجارية فقط',
    window: 'زر الطوارئ متاح قبل الجولة بساعتين. في حالات الطوارئ اتصل بالجهات المحلية.',
  },
};

/** Arabic for the fixed English messages of auth and rate-limit errors. */
export const HTTP_MESSAGES_AR: Record<string, string> = {
  'Invalid email or password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  'Invalid or expired code': 'الرمز غير صحيح أو منتهي الصلاحية',
  'Too many attempts; request a new code': 'محاولات كثيرة. اطلب رمزًا جديدًا',
  'Too many incorrect codes. Try again in an hour.': 'رموز خاطئة كثيرة. حاول بعد ساعة.',
  'Too many codes requested for this number. Try again later.': 'طُلبت رموز كثيرة لهذا الرقم. حاول لاحقًا.',
  'SMS verification is not available for this country yet.': 'التحقق عبر الرسائل غير متاح لهذه الدولة بعد.',
  'Account disabled': 'الحساب موقوف',
  'An account with this email or phone already exists': 'يوجد حساب بهذا البريد الإلكتروني أو رقم الجوال',
  'Session expired, please sign in again': 'انتهت الجلسة. سجّل الدخول مرة أخرى.',
  'Invalid or expired token': 'انتهت الجلسة. سجّل الدخول مرة أخرى.',
  'Booking not found': 'الحجز غير موجود',
  'City not found': 'المدينة غير موجودة',
  'Guide not found': 'المرشد غير موجود',
  'Package not found': 'الجولة غير موجودة',
  'Site not found': 'المعلم غير موجود',
  'Dispute not found': 'النزاع غير موجود',
  'Not your package': 'هذه الجولة لا تخصك',
  'Guide profile required': 'يلزم إنشاء ملف مرشد',
  'Guide changed concurrently; reload and try again': 'تم تعديل الملف للتو. حدّث الصفحة وحاول مرة أخرى.',
  'This license number is already registered to another guide': 'رقم الرخصة مسجّل لمرشد آخر',
  'We could not send the SMS right now. Please try again shortly.': 'تعذّر إرسال الرسالة الآن. حاول مرة أخرى بعد قليل.',
  "You've reached today's assistant limit. Try again tomorrow.": 'وصلت إلى حد المساعد لهذا اليوم. حاول غدًا.',
  'This conversation is too long. Start a new chat.': 'المحادثة طويلة جدًا. ابدأ محادثة جديدة.',
  'ThrottlerException: Too Many Requests': 'طلبات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.',
  'Unauthorized': 'يجب تسجيل الدخول',
  Forbidden: 'ليست لديك صلاحية لهذا الإجراء',
  'Forbidden resource': 'ليست لديك صلاحية لهذا الإجراء',
};

export function domainErrorAr(code: string, english: string): string | undefined {
  const entry = DOMAIN_ERRORS_AR[code];
  if (!entry || typeof entry === 'string') return entry;
  if (typeof entry === 'function') return entry(english);
  if (code === 'SLOT_UNAVAILABLE' && /refunded/i.test(english)) return entry.refunded;
  if (code === 'TOUR_NOT_ACTIVE' && /2 hours/.test(english)) return entry.window;
  return entry.default;
}

/** "Please wait 30s before requesting another code" and other patterned messages. */
export function httpMessageAr(english: string): string | undefined {
  if (HTTP_MESSAGES_AR[english]) return HTTP_MESSAGES_AR[english];
  const wait = /^Please wait (\d+)s before requesting another code$/.exec(english);
  if (wait) return `انتظر ${wait[1]} ثانية قبل طلب رمز جديد`;
  const locked = /^Too many failed attempts\. Try again in (\d+) minute/.exec(english);
  if (locked) return `محاولات دخول فاشلة كثيرة. حاول بعد ${locked[1]} دقيقة أو سجّل الدخول برمز الجوال.`;
  return undefined;
}
