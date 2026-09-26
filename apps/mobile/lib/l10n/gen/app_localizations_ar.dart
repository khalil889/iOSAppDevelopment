// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get accountSignedOutMessage =>
      'سجّل دخولك لحجز مرشدين سياحيين مرخّصين، أو أنشئ حساب مرشد لتقديم جولاتك.';

  @override
  String get accountSignInOrRegister => 'تسجيل الدخول أو إنشاء حساب';

  @override
  String get accountGuideMode => 'وضع المرشد';

  @override
  String get accountTouristMode => 'وضع السائح';

  @override
  String get accountNoPhone => 'لا يوجد رقم جوال';

  @override
  String get accountPhoneVerified => 'موثّق';

  @override
  String get accountPhoneNotVerified => 'غير موثّق — التوثيق مطلوب للحجز';

  @override
  String get accountVerify => 'توثيق';

  @override
  String get accountPhoneVerifiedToast => 'تم توثيق رقم الجوال';

  @override
  String get accountSignOut => 'تسجيل الخروج';

  @override
  String get accountSignOutAll => 'تسجيل الخروج من جميع الأجهزة';

  @override
  String get accountSignOutAllHint => 'استخدم هذا الخيار إذا فقدت جوالك';

  @override
  String get accountSignOutAllTitle => 'تسجيل الخروج من جميع الأجهزة؟';

  @override
  String get accountSignOutAllBody =>
      'ستحتاج إلى تسجيل الدخول من جديد على كل جهاز.';

  @override
  String accountApiUrl(String url) {
    return 'الخادم: $url';
  }

  @override
  String get assistantTitle => 'المساعد السياحي';

  @override
  String get assistantNewChat => 'محادثة جديدة';

  @override
  String get assistantIntro =>
      'اسألني عن الأماكن التي تستحق الزيارة، أو خطط الرحلات، أو كيف تجد مرشدًا مرخّصًا.';

  @override
  String get assistantStarter1 => 'خطط لي يومين في العُلا';

  @override
  String get assistantStarter2 => 'ابحث لي عن مرشد في القاهرة';

  @override
  String get assistantStarter3 => 'ما الأماكن التي أزورها في الرياض؟';

  @override
  String get assistantStarter4 => 'هل المشي لمسافات طويلة في البتراء آمن؟';

  @override
  String get assistantInputHint => 'اسأل عن أي شيء…';

  @override
  String get assistantSend => 'إرسال';

  @override
  String get assistantThinking => 'المساعد يكتب';

  @override
  String get authSignInTitle => 'تسجيل الدخول';

  @override
  String get authTabEmail => 'البريد الإلكتروني';

  @override
  String get authTabPhone => 'الجوال';

  @override
  String get authEmailLabel => 'البريد الإلكتروني';

  @override
  String get authPasswordLabel => 'كلمة المرور';

  @override
  String get authSigningIn => 'جارٍ تسجيل الدخول…';

  @override
  String get authSignInButton => 'تسجيل الدخول';

  @override
  String authDemoHint(String touristEmail, String guideEmail, String password) {
    return 'للتجربة: $touristEmail (سائح) أو $guideEmail (مرشد)، وكلمة المرور $password';
  }

  @override
  String get authPhoneLabel => 'رقم الجوال';

  @override
  String get authSendCode => 'إرسال الرمز';

  @override
  String get authCreateAccountPrompt => 'مستخدم جديد؟ أنشئ حسابك الآن';

  @override
  String get authCreateAccount => 'إنشاء حساب';

  @override
  String get authRoleTourist => 'أنا مسافر';

  @override
  String get authRoleGuide => 'أنا مرشد سياحي';

  @override
  String get authGuideLicenseNote =>
      'بعد التسجيل، أرسل رخصة الإرشاد السياحي من لوحة التحكم، وستتمكن من استقبال الحجوزات فور اعتمادها من الإدارة.';

  @override
  String get authFullNameLabel => 'الاسم الكامل';

  @override
  String get authNameRequired => 'أدخل اسمك';

  @override
  String get authEmailInvalid => 'أدخل بريداً إلكترونياً صحيحاً';

  @override
  String get authMobileLabel => 'رقم الجوال';

  @override
  String authPhoneFormatError(String example) {
    return 'استخدم الصيغة الدولية، مثل $example';
  }

  @override
  String get authPasswordMinLabel => 'كلمة المرور (8 أحرف على الأقل)';

  @override
  String get authPasswordTooShort => 'يجب ألا تقل عن 8 أحرف';

  @override
  String get authCreating => 'جارٍ إنشاء الحساب…';

  @override
  String get authVerifyLater => 'يمكنك توثيق رقم جوالك لاحقاً من صفحة الحساب.';

  @override
  String get authVerifyPhoneTitle => 'توثيق رقم الجوال';

  @override
  String authVerifyPhoneBody(String phone) {
    return 'أدخل الرمز المرسل إلى $phone. يلزم توثيق رقم الجوال لإتمام الحجز.';
  }

  @override
  String get authVerify => 'تحقّق';

  @override
  String get authResendCode => 'إعادة إرسال الرمز';

  @override
  String get authLater => 'لاحقاً';

  @override
  String get authEnterCodeTitle => 'أدخل رمز التحقق';

  @override
  String authCodeSentTo(String phone) {
    return 'أرسلنا رمزاً مكوّناً من 6 أرقام إلى $phone.';
  }

  @override
  String get authDevCodePrefilled => 'وضع التطوير: تمت تعبئة الرمز تلقائياً';

  @override
  String get authVerifying => 'جارٍ التحقق…';

  @override
  String get availabilityTitle => 'أوقات التوفر';

  @override
  String get availabilitySaved =>
      'تم حفظ أوقات التوفر. لن تتأثر الحجوزات الحالية.';

  @override
  String get availabilityStart => 'وقت البدء';

  @override
  String get availabilityEnd => 'وقت الانتهاء';

  @override
  String get availabilityEndBeforeStart =>
      'يجب أن يكون وقت الانتهاء بعد وقت البدء.';

  @override
  String get availabilityDiscardTitle => 'تجاهل التغييرات؟';

  @override
  String get availabilityKeepEditing => 'متابعة التعديل';

  @override
  String get availabilityDiscard => 'تجاهل';

  @override
  String get availabilityWeeklyHours => 'ساعات العمل الأسبوعية';

  @override
  String availabilityNoHours(String start, String end) {
    return 'لم تحدد ساعات عمل — يمكن للسياح حجزك في أي يوم بين $start و$end.';
  }

  @override
  String get availabilityHoursHint =>
      'بالتوقيت المحلي لمدينة كل جولة. لا يرى السياح إلا أوقات البدء التي تناسب ساعاتك.';

  @override
  String get availabilityTimeOff => 'الإجازات';

  @override
  String get availabilityAdd => 'إضافة';

  @override
  String get availabilityNoTimeOff => 'لا توجد إجازات مخطط لها.';

  @override
  String availabilityDateRange(String start, String end) {
    return 'من $start إلى $end';
  }

  @override
  String get availabilityRemove => 'حذف';

  @override
  String get availabilitySaving => 'جارٍ الحفظ…';

  @override
  String get availabilitySaveChanges => 'حفظ التغييرات';

  @override
  String get availabilitySavedState => 'تم الحفظ';

  @override
  String get availabilityDayOff => 'غير متاح';

  @override
  String get availabilityAddHours => 'إضافة ساعات';

  @override
  String get availabilityCopyToWorkweek =>
      'نسخ إلى أيام العمل (الأحد – الخميس)';

  @override
  String get bookingCouldNotLoadTimes => 'تعذّر تحميل الأوقات المتاحة';

  @override
  String get bookingCouldNotGetPrice => 'تعذّر حساب السعر';

  @override
  String bookingPaymentDescription(String tour, String guide) {
    return '$tour مع $guide';
  }

  @override
  String get bookingHeldMessage =>
      'تم حجز مكانك لمدة 15 دقيقة، أكمل الدفع من «رحلاتي» لتأكيد الحجز.';

  @override
  String get bookingVerifyingPayment =>
      'ما زلنا نتحقق من عملية الدفع، راجع «رحلاتي» بعد قليل.';

  @override
  String get bookingSuccessTitle => 'تم الحجز بنجاح!';

  @override
  String bookingSuccessBody(String tour, String guide, String dateTime) {
    return '$tour مع $guide\n$dateTime\n\nمبلغك محفوظ بأمان في حساب الضمان، ولن يُحوَّل إلى المرشد إلا بعد انتهاء الجولة.';
  }

  @override
  String get bookingDone => 'تم';

  @override
  String get bookingTitle => 'حجز الجولة';

  @override
  String bookingWithGuide(String guide, String duration) {
    return 'مع $guide · $duration';
  }

  @override
  String get bookingDate => 'التاريخ';

  @override
  String get bookingStartTime => 'وقت البدء';

  @override
  String bookingLocalTimeZone(String timeZone) {
    return 'بالتوقيت المحلي · $timeZone';
  }

  @override
  String get bookingNoSlots =>
      'لا توجد أوقات متاحة في هذا اليوم. جرّب تاريخًا آخر.';

  @override
  String get bookingTravellers => 'عدد المسافرين';

  @override
  String bookingMaxGroup(int count) {
    return 'الحد الأقصى $count';
  }

  @override
  String get bookingNotesLabel => 'ملاحظات للمرشد (اختياري)';

  @override
  String get bookingPickTimeForPrice => 'اختر وقت البدء لعرض السعر.';

  @override
  String get bookingGettingPrice => 'جارٍ حساب السعر…';

  @override
  String get bookingPrivateGroup => 'جولة خاصة للمجموعة';

  @override
  String get bookingTimeLabel => 'الوقت';

  @override
  String get bookingLocalFallback => 'محلي';

  @override
  String get bookingTotal => 'الإجمالي';

  @override
  String get bookingPolicy =>
      'إلغاء مجاني حتى 48 ساعة قبل موعد الجولة، واسترداد 50% عند الإلغاء قبل 24 إلى 48 ساعة. يبقى مبلغك محفوظًا في حساب الضمان حتى اكتمال الجولة.';

  @override
  String get bookingProcessing => 'جارٍ المعالجة…';

  @override
  String get bookingConfirmPay => 'تأكيد ودفع';

  @override
  String get appTitle => 'مرشد سياحي';

  @override
  String get tabExplore => 'استكشف';

  @override
  String get tabTrips => 'رحلاتي';

  @override
  String get tabAssistant => 'المساعد';

  @override
  String get tabAccount => 'الحساب';

  @override
  String get tabDashboard => 'لوحة التحكم';

  @override
  String get cancel => 'إلغاء';

  @override
  String get save => 'حفظ';

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get close => 'إغلاق';

  @override
  String get ok => 'حسنًا';

  @override
  String get somethingWentWrong => 'حدث خطأ ما';

  @override
  String get errorNetwork => 'تعذّر الوصول إلى الخادم. تحقّق من اتصالك.';

  @override
  String get errorUploadFailed => 'فشل الرفع. تحقّق من اتصالك وحاول مرة أخرى.';

  @override
  String errorUploadRejected(int status) {
    return 'رُفض الملف ($status). حاول مرة أخرى.';
  }

  @override
  String errorRequestFailed(int status) {
    return 'فشل الطلب ($status)';
  }

  @override
  String get language => 'اللغة';

  @override
  String get languageSystem => 'لغة الجهاز';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageArabic => 'العربية';

  @override
  String get ratingNew => 'جديد';

  @override
  String get bookingStatusPendingPayment => 'بانتظار الدفع';

  @override
  String get bookingStatusConfirmed => 'مؤكد';

  @override
  String get bookingStatusInProgress => 'جارية الآن';

  @override
  String get bookingStatusCompleted => 'مكتملة';

  @override
  String get bookingStatusCancelled => 'ملغاة';

  @override
  String get categoryHeritage => 'تراث';

  @override
  String get categoryMuseum => 'متحف';

  @override
  String get categoryNature => 'طبيعة';

  @override
  String get categoryReligious => 'ديني';

  @override
  String get categoryCity => 'مدينة';

  @override
  String get categoryAdventure => 'مغامرة';

  @override
  String get categoryFood => 'طعام';

  @override
  String get escrowPending => 'قيد الانتظار';

  @override
  String get escrowHeld => 'محجوز في الضمان';

  @override
  String get escrowSettling => 'قيد التسوية';

  @override
  String get escrowReleased => 'حُوّل إلى المرشد';

  @override
  String get escrowRefunded => 'مُسترد';

  @override
  String get escrowPartiallyRefunded => 'مُسترد جزئيًا';

  @override
  String get escrowDisputed => 'متنازع عليه';

  @override
  String get escrowFailed => 'فشل';

  @override
  String get liveBadge => 'مباشر';

  @override
  String dashboardGreeting(String name) {
    return 'مرحبًا $name';
  }

  @override
  String get dashboardRefresh => 'تحديث';

  @override
  String get dashboardRating => 'التقييم';

  @override
  String dashboardReviews(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count تقييم',
      many: '$count تقييمًا',
      few: '$count تقييمات',
      two: 'تقييمان',
      one: 'تقييم واحد',
      zero: 'لا توجد تقييمات',
    );
    return '$_temp0';
  }

  @override
  String get dashboardCompleted => 'المكتملة';

  @override
  String dashboardToursUnit(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'جولة',
      few: 'جولات',
      two: 'جولتان',
      one: 'جولة',
    );
    return '$_temp0';
  }

  @override
  String get dashboardUpcoming => 'القادمة';

  @override
  String get dashboardBooked => 'محجوزة';

  @override
  String get dashboardPaidOut => 'المبالغ المحوّلة';

  @override
  String get dashboardInEscrow => 'محتجزة في الضمان';

  @override
  String get dashboardEscrowInfo =>
      'يُحرَّر مبلغ الضمان بعد 7 أيام من اكتمال الجولة ما لم يُفتح نزاع.';

  @override
  String get dashboardAvailabilitySubtitle => 'ساعات العمل الأسبوعية والإجازات';

  @override
  String get dashboardUpcomingTours => 'الجولات القادمة';

  @override
  String get dashboardNoUpcomingTours => 'لا توجد جولات قادمة.';

  @override
  String dashboardGuests(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count شخص',
      many: '$count شخصًا',
      few: '$count أشخاص',
      two: 'شخصان',
      one: 'شخص واحد',
    );
    return '$_temp0';
  }

  @override
  String dashboardPayout(String amount) {
    return 'أرباحك $amount';
  }

  @override
  String get dashboardVerifiedTitle => 'مرخّص وموثّق';

  @override
  String get dashboardVerifiedBody =>
      'يظهر ملفك في نتائج البحث ويمكنك استقبال الحجوزات.';

  @override
  String get dashboardPendingTitle => 'جارٍ التحقق';

  @override
  String get dashboardPendingBody =>
      'يراجع أحد المشرفين رخصتك، ويستغرق ذلك عادةً من يوم إلى يومَي عمل.';

  @override
  String get dashboardRejectedTitle => 'تم رفض التحقق';

  @override
  String get dashboardRejectedBody => 'يرجى مراجعة رخصتك وإعادة إرسالها.';

  @override
  String get dashboardSuspendedTitle => 'تم إيقاف الحساب';

  @override
  String get dashboardSuspendedBody => 'يرجى التواصل مع الدعم.';

  @override
  String get dashboardDraftTitle => 'أرسل رخصتك';

  @override
  String get dashboardDraftBody =>
      'أضف رخصتك السياحية لتوثيق حسابك والبدء في استقبال الحجوزات.';

  @override
  String get dashboardResubmitLicense => 'إعادة إرسال الرخصة';

  @override
  String get dashboardSubmitLicense => 'إرسال الرخصة';

  @override
  String get exploreTitle => 'استكشف';

  @override
  String exploreGreeting(String name) {
    return 'أهلًا $name 👋';
  }

  @override
  String get exploreSearchHint => 'ابحث عن معالم أو مرشدين أو مدن';

  @override
  String get exploreTabPlaces => 'الأماكن';

  @override
  String get exploreTabGuides => 'المرشدون';

  @override
  String get exploreAnyCity => 'كل المدن';

  @override
  String get exploreCityFallback => 'المدينة';

  @override
  String exploreCityWithCountry(String city, String country) {
    return '$city، $country';
  }

  @override
  String get exploreAnyLanguage => 'كل اللغات';

  @override
  String get exploreLangEn => 'الإنجليزية';

  @override
  String get exploreLangAr => 'العربية';

  @override
  String get exploreLangFr => 'الفرنسية';

  @override
  String get exploreLangDe => 'الألمانية';

  @override
  String get exploreLangEs => 'الإسبانية';

  @override
  String get exploreLangIt => 'الإيطالية';

  @override
  String get exploreLangUr => 'الأردية';

  @override
  String exploreMinRating(String rating) {
    return '$rating★ فأكثر';
  }

  @override
  String get exploreSortTopRated => 'الأعلى تقييمًا';

  @override
  String get exploreSortLowestPrice => 'الأقل سعرًا';

  @override
  String get exploreSortMostExperienced => 'الأكثر خبرة';

  @override
  String get exploreNoPlaces => 'لا توجد أماكن تطابق عوامل التصفية.';

  @override
  String get exploreNoGuides => 'لا يوجد مرشدون مرخّصون يطابقون عوامل التصفية.';

  @override
  String get guideProfileTouristOnly => 'بدّل إلى حساب سائح لحجز الجولات.';

  @override
  String get guideProfileLicense => 'الرخصة';

  @override
  String get guideProfileLanguages => 'اللغات';

  @override
  String get guideProfileExperience => 'الخبرة';

  @override
  String guideProfileYears(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count سنة',
      many: '$count سنة',
      few: '$count سنوات',
      two: 'سنتان',
      one: 'سنة واحدة',
      zero: 'أقل من سنة',
    );
    return '$_temp0';
  }

  @override
  String get guideProfileCities => 'المدن';

  @override
  String get guideProfileListSeparator => '، ';

  @override
  String get guideProfileTours => 'الجولات';

  @override
  String get guideProfileNoTours => 'لا توجد جولات متاحة حاليًا.';

  @override
  String get guideProfileReviews => 'التقييمات';

  @override
  String get guideProfileNoReviews => 'لا توجد تقييمات بعد.';

  @override
  String guideProfileUpTo(int count) {
    return 'حتى $count أشخاص';
  }

  @override
  String guideProfileVisits(String sites) {
    return 'تشمل: $sites';
  }

  @override
  String get guideProfilePerPerson => ' / للشخص';

  @override
  String get guideProfilePerGroup => ' / للمجموعة';

  @override
  String get guideProfileBook => 'احجز';

  @override
  String get licenseTitle => 'الرخصة السياحية';

  @override
  String get licenseIntro =>
      'نتحقق من كل مرشد لدى الجهة المُصدِرة للرخصة قبل أن يتمكن من استقبال الحجوزات.';

  @override
  String get licenseCountryLabel => 'بلد الإصدار';

  @override
  String get licenseCountryRequired => 'اختر البلد';

  @override
  String get licenseNumberLabel => 'رقم الرخصة';

  @override
  String get licenseNumberRequired => 'أدخل رقم رخصتك';

  @override
  String get licenseExpiryLabel => 'تاريخ الانتهاء';

  @override
  String get licenseExpiryRequired => 'اختر تاريخ الانتهاء';

  @override
  String get licenseSelect => 'اختر';

  @override
  String get licensePhotoTitle => 'صورة الرخصة';

  @override
  String get licenseUploaded => 'تم الرفع';

  @override
  String get licenseTakePhoto => 'التقاط صورة';

  @override
  String get licenseChoosePhoto => 'اختيار من المعرض';

  @override
  String get licensePrivacyNote =>
      'تُحفظ بشكل خاص، ولا يطّلع عليها إلا فريق التحقق لدينا.';

  @override
  String get licenseSubmitting => 'جارٍ الإرسال…';

  @override
  String get licenseSubmit => 'إرسال للتحقق';

  @override
  String get licensePhotoRequired => 'أضف صورة رخصتك أولًا.';

  @override
  String get licenseSubmitted => 'تم الإرسال للتحقق';

  @override
  String get liveTitleLive => 'جولة مباشرة';

  @override
  String get liveTitleDetails => 'تفاصيل الجولة';

  @override
  String get liveTourFallback => 'جولة';

  @override
  String liveTravellers(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مسافر',
      many: '$count مسافرًا',
      few: '$count مسافرين',
      two: 'مسافران',
      one: 'مسافر واحد',
    );
    return '$_temp0';
  }

  @override
  String liveScheduleLine(String start, String end, String travellers) {
    return '$start – $end · $travellers';
  }

  @override
  String liveYourTraveller(String phone) {
    return 'المسافر معك · $phone';
  }

  @override
  String liveYourGuide(String phone) {
    return 'مرشدك المرخّص · $phone';
  }

  @override
  String get liveStops => 'المحطات';

  @override
  String liveNotes(String notes) {
    return 'ملاحظات: $notes';
  }

  @override
  String get liveStartTour => 'بدء الجولة';

  @override
  String get liveTourStarted => 'بدأت الجولة';

  @override
  String get liveCompleteTour => 'إنهاء الجولة';

  @override
  String get liveTourCompleted => 'اكتملت الجولة — تمت جدولة تحويل مستحقاتك';

  @override
  String get liveSosHint =>
      'اضغط مطولًا لمدة ثانية واحدة لإبلاغ فريق السلامة المتاح على مدار الساعة.';

  @override
  String livePaymentStatus(String status) {
    return 'الدفع: $status';
  }

  @override
  String get liveSosButton => 'استغاثة';

  @override
  String get liveSosSemantics => 'زر استغاثة طارئة. اضغط مطولًا للتفعيل.';

  @override
  String get liveSosDialogTitle => 'إرسال نداء استغاثة؟';

  @override
  String get liveSosDialogBody =>
      'سنرسل تفاصيل حجزك وموقعك الحالي إلى فريق السلامة.';

  @override
  String get liveSosMessageLabel => 'ماذا يحدث؟ (اختياري)';

  @override
  String get liveSosSend => 'أرسل الاستغاثة';

  @override
  String get liveSosSentTitle => 'المساعدة في الطريق إليك';

  @override
  String get liveSosSentBody =>
      'تم إبلاغ فريق السلامة بتفاصيل حجزك، وسيتواصلون معك فورًا.\n\nإذا كنت في خطر مباشر، فاتصل بخدمات الطوارئ المحلية على الفور.';

  @override
  String get notifTitle => 'الإشعارات';

  @override
  String get notifOpen => 'فتح';

  @override
  String get notifMarkAllRead => 'تحديد الكل كمقروء';

  @override
  String get notifEmpty => 'لا توجد إشعارات حتى الآن.';

  @override
  String get notifAgoNow => 'الآن';

  @override
  String notifAgoMinutes(int count) {
    return '$count د';
  }

  @override
  String notifAgoHours(int count) {
    return '$count س';
  }

  @override
  String notifAgoDays(int count) {
    return '$count ي';
  }

  @override
  String paymentPayAmount(String amount) {
    return 'ادفع $amount';
  }

  @override
  String get paymentEscrowNote =>
      'يُحفظ المبلغ بأمان في حساب الضمان، ولا يُحوَّل إلى مرشدك إلا بعد انتهاء الجولة.';

  @override
  String get paymentFailedTryAnother => 'تعذّر الدفع. جرّب بطاقة أخرى.';

  @override
  String get paymentNotCompleted => 'تعذّر إتمام عملية الدفع.';

  @override
  String get paymentTestModeNote =>
      'وضع التجربة — لن يتم خصم أي مبلغ فعلي. يُحفظ المبلغ في حساب الضمان حتى تكتمل جولتك.';

  @override
  String get paymentTestCardSucceeds => 'بطاقة تجريبية — دفع ناجح';

  @override
  String get paymentTestCardDeclined => 'بطاقة تجريبية — دفع مرفوض';

  @override
  String get reviewRatingPoor => 'سيئة';

  @override
  String get reviewRatingFair => 'مقبولة';

  @override
  String get reviewRatingGood => 'جيدة';

  @override
  String get reviewRatingGreat => 'رائعة';

  @override
  String get reviewRatingOutstanding => 'ممتازة';

  @override
  String get reviewThanks => 'شكرًا على تقييمك!';

  @override
  String get reviewTitle => 'قيّم جولتك';

  @override
  String reviewPrompt(String tour, String guide) {
    return 'كيف كانت تجربتك في $tour مع $guide؟';
  }

  @override
  String get reviewYourTour => 'الجولة';

  @override
  String get reviewYourGuide => 'المرشد';

  @override
  String get reviewCommentLabel => 'شارك تجربتك مع المسافرين الآخرين (اختياري)';

  @override
  String get reviewSubmitting => 'جارٍ الإرسال…';

  @override
  String get reviewSubmit => 'إرسال التقييم';

  @override
  String siteGuidesCityWithCountry(String city, String country) {
    return '$city، $country';
  }

  @override
  String get siteGuidesLicenseRequired => 'يلزم مرشد مرخّص';

  @override
  String get siteGuidesLicenseRequiredBody =>
      'جميع المرشدين أدناه يحملون رخصة إرشاد سياحي موثّقة.';

  @override
  String get siteGuidesHeading => 'مرشدون لهذا المكان';

  @override
  String get siteGuidesEmpty => 'لا يوجد مرشدون لهذا المكان حتى الآن.';

  @override
  String get tripsTitle => 'رحلاتي';

  @override
  String get tripsRefresh => 'تحديث';

  @override
  String get tripsSignInPrompt => 'سجّل الدخول لعرض حجوزاتك.';

  @override
  String get tripsSignIn => 'تسجيل الدخول';

  @override
  String get tripsEmpty =>
      'لا توجد رحلات بعد. ابحث عن مرشد مرخّص في صفحة استكشف.';

  @override
  String get tripsSectionLive => 'جارية الآن';

  @override
  String get tripsSectionUpcoming => 'القادمة';

  @override
  String get tripsSectionPast => 'السابقة';

  @override
  String get tripsTourFallback => 'جولة';

  @override
  String tripsTravellers(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count مسافر',
      many: '$count مسافرًا',
      few: '$count مسافرين',
      two: 'مسافران',
      one: 'مسافر واحد',
    );
    return '$_temp0';
  }

  @override
  String tripsScheduleLine(String date, String travellers) {
    return '$date · $travellers';
  }

  @override
  String tripsGuideLine(String name, String amount) {
    return 'المرشد: $name · $amount';
  }

  @override
  String get tripsOpenLiveTour => 'فتح الجولة المباشرة';

  @override
  String get tripsDetailsSafety => 'التفاصيل والسلامة';

  @override
  String get tripsPaymentDescription => 'حجز جولة';

  @override
  String get tripsPayNow => 'ادفع الآن';

  @override
  String get tripsLeaveReview => 'أضف تقييمًا';

  @override
  String get tripsRefundNoPayment => 'لم يتم خصم أي مبلغ.';

  @override
  String get tripsRefundFull => 'ستسترد المبلغ كاملًا.';

  @override
  String get tripsRefundHalf => 'ستسترد 50% من المبلغ.';

  @override
  String get tripsRefundNone =>
      'الإلغاء قبل أقل من 24 ساعة من موعد الجولة غير قابل للاسترداد.';

  @override
  String get tripsCancelTitle => 'إلغاء الحجز؟';

  @override
  String get tripsKeep => 'الاحتفاظ بالحجز';

  @override
  String get tripsCancelConfirm => 'إلغاء الحجز';

  @override
  String tripsCancelled(int percent) {
    return 'تم إلغاء الحجز. نسبة الاسترداد: $percent%';
  }

  @override
  String get widgetLicensed => 'مرخّص';

  @override
  String get widgetFromPrice => 'ابتداءً من';

  @override
  String widgetDistanceKm(String distance) {
    return '$distance كم';
  }

  @override
  String get widgetLicensedGuideRequired =>
      'يلزم وجود مرشد مرخّص لزيارة هذا المكان';

  @override
  String get toursTitle => 'جولاتي';

  @override
  String get toursDashboardSubtitle => 'أنشئ الجولات التي تقدّمها وعدّلها';

  @override
  String get toursEmpty =>
      'لم تُنشئ أي جولة بعد. يمكن للمسافرين حجزك بعد أن تنشر جولة.';

  @override
  String get toursCreateFirst => 'أنشئ جولتك الأولى';

  @override
  String get toursAdd => 'جولة جديدة';

  @override
  String get toursActive => 'نشطة';

  @override
  String get toursPaused => 'متوقفة';

  @override
  String get toursActiveToggle => 'ظاهرة للمسافرين';

  @override
  String get toursNowActive => 'أصبحت الجولة ظاهرة للمسافرين من جديد.';

  @override
  String get toursNowPaused =>
      'أُوقفت الجولة مؤقتًا، ولن يتمكن المسافرون من حجزها حتى تعيد تفعيلها.';

  @override
  String toursPricePerPerson(String price) {
    return '$price للشخص';
  }

  @override
  String toursPricePerGroup(String price) {
    return '$price للمجموعة';
  }

  @override
  String toursUpTo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'حتى $count شخص',
      many: 'حتى $count شخصًا',
      few: 'حتى $count أشخاص',
      two: 'شخصان كحدٍّ أقصى',
      one: 'شخص واحد كحدٍّ أقصى',
    );
    return '$_temp0';
  }

  @override
  String get toursNewTitle => 'جولة جديدة';

  @override
  String get toursEditTitle => 'تعديل الجولة';

  @override
  String get toursSectionEnglish => 'الإنجليزية';

  @override
  String get toursSectionArabic => 'العربية';

  @override
  String get toursArabicHint =>
      'اختياري. يظهر للمسافرين الذين يستخدمون التطبيق باللغة العربية.';

  @override
  String get toursTitleEnLabel => 'عنوان الجولة';

  @override
  String get toursDescriptionEnLabel => 'الوصف';

  @override
  String get toursTitleArLabel => 'عنوان الجولة بالعربية';

  @override
  String get toursDescriptionArLabel => 'الوصف بالعربية';

  @override
  String get toursDescriptionHint => 'ما الذي سيشاهده المسافرون ويفعلونه';

  @override
  String get toursTitleRequired => 'أدخل عنوانًا لا يقل عن 3 أحرف';

  @override
  String get toursTitleTooShort =>
      'استخدم 3 أحرف على الأقل أو اترك الحقل فارغًا';

  @override
  String get toursSectionDetails => 'تفاصيل الجولة';

  @override
  String get toursCityLabel => 'المدينة';

  @override
  String get toursCityRequired => 'اختر مدينة';

  @override
  String get toursNoCities =>
      'أضف المدن التي تعمل فيها إلى ملفك الشخصي كمرشد، ثم عُد لإنشاء جولة فيها.';

  @override
  String get toursSitesLabel => 'المواقع التي تشملها الجولة';

  @override
  String get toursSitesPickCity => 'اختر مدينة لعرض مواقعها.';

  @override
  String get toursSitesEmpty => 'لا توجد مواقع مُدرجة لهذه المدينة بعد.';

  @override
  String get toursDurationLabel => 'المدة';

  @override
  String get toursDecrease => 'إنقاص';

  @override
  String get toursIncrease => 'زيادة';

  @override
  String get toursPricingLabel => 'طريقة التسعير';

  @override
  String get toursPricingPerGroup => 'للمجموعة';

  @override
  String get toursPricingPerPerson => 'للشخص';

  @override
  String get toursPriceLabel => 'السعر';

  @override
  String get toursPriceHelperPerGroup => 'سعر واحد للمجموعة كاملة';

  @override
  String get toursPriceHelperPerPerson => 'يُحتسب عن كل مسافر';

  @override
  String get toursPriceRequired => 'أدخل السعر';

  @override
  String toursPriceInvalid(int decimals) {
    String _temp0 = intl.Intl.pluralLogic(
      decimals,
      locale: localeName,
      other: 'أدخل سعرًا بـ$decimals منزلة عشرية كحدٍّ أقصى',
      many: 'أدخل سعرًا بـ$decimals منزلةً عشرية كحدٍّ أقصى',
      few: 'أدخل سعرًا بـ$decimals منازل عشرية كحدٍّ أقصى',
      two: 'أدخل سعرًا بمنزلتين عشريتين كحدٍّ أقصى',
      one: 'أدخل سعرًا بمنزلة عشرية واحدة كحدٍّ أقصى',
      zero: 'أدخل عددًا صحيحًا',
    );
    return '$_temp0';
  }

  @override
  String toursPriceTooHigh(String max) {
    return 'يجب ألا يزيد السعر على $max';
  }

  @override
  String get toursGroupSizeLabel => 'الحد الأقصى لعدد المشاركين';

  @override
  String toursPeople(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count شخص',
      many: '$count شخصًا',
      few: '$count أشخاص',
      two: 'شخصان',
      one: 'شخص واحد',
    );
    return '$_temp0';
  }

  @override
  String get toursLanguagesLabel => 'اللغات التي تقدّم بها الجولة';

  @override
  String get toursLanguagesRequired => 'اختر لغة واحدة على الأقل';

  @override
  String get toursLangZh => 'الصينية';

  @override
  String get toursLangRu => 'الروسية';

  @override
  String get toursLangHi => 'الهندية';

  @override
  String get toursLangTr => 'التركية';

  @override
  String get toursPhotosLabel => 'الصور';

  @override
  String toursPhotosHint(int max) {
    String _temp0 = intl.Intl.pluralLogic(
      max,
      locale: localeName,
      other: 'حتى $max صورة.',
      many: 'حتى $max صورة.',
      few: 'حتى $max صور.',
      two: 'صورتان كحدٍّ أقصى.',
      one: 'صورة واحدة كحدٍّ أقصى.',
    );
    return '$_temp0 الصورة الأولى هي صورة الغلاف.';
  }

  @override
  String get toursAddPhoto => 'إضافة صورة';

  @override
  String get toursTakePhoto => 'التقاط صورة';

  @override
  String get toursChoosePhoto => 'اختيار من المعرض';

  @override
  String get toursCover => 'الغلاف';

  @override
  String get toursMakeCover => 'تعيين كغلاف';

  @override
  String get toursRemovePhoto => 'إزالة الصورة';

  @override
  String get toursPhotoTooLarge =>
      'حجم هذه الصورة أكبر من 5 ميغابايت. اختر صورة أصغر.';

  @override
  String get toursPhotoUploading => 'جارٍ رفع الصورة…';

  @override
  String get toursActiveHint =>
      'أوقف التفعيل لإيقاف الحجوزات الجديدة لهذه الجولة مؤقتًا.';

  @override
  String get toursCreate => 'إنشاء الجولة';

  @override
  String get toursSave => 'حفظ التغييرات';

  @override
  String get toursSaving => 'جارٍ الحفظ…';

  @override
  String get toursCreated => 'أُنشئت الجولة.';

  @override
  String get toursSaved => 'حُدِّثت الجولة.';
}
