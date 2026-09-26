// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

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
}
