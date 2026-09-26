// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'TourGuide';

  @override
  String get tabExplore => 'Explore';

  @override
  String get tabTrips => 'Trips';

  @override
  String get tabAssistant => 'Assistant';

  @override
  String get tabAccount => 'Account';

  @override
  String get tabDashboard => 'Dashboard';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String get retry => 'Retry';

  @override
  String get close => 'Close';

  @override
  String get ok => 'OK';

  @override
  String get somethingWentWrong => 'Something went wrong';

  @override
  String get errorNetwork => 'Cannot reach the server. Check your connection.';

  @override
  String get errorUploadFailed =>
      'Upload failed. Check your connection and try again.';

  @override
  String errorUploadRejected(int status) {
    return 'Upload was rejected ($status). Please try again.';
  }

  @override
  String errorRequestFailed(int status) {
    return 'Request failed ($status)';
  }

  @override
  String get language => 'Language';

  @override
  String get languageSystem => 'Device language';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageArabic => 'العربية';

  @override
  String get ratingNew => 'New';

  @override
  String get bookingStatusPendingPayment => 'Awaiting payment';

  @override
  String get bookingStatusConfirmed => 'Confirmed';

  @override
  String get bookingStatusInProgress => 'Live now';

  @override
  String get bookingStatusCompleted => 'Completed';

  @override
  String get bookingStatusCancelled => 'Cancelled';

  @override
  String get categoryHeritage => 'Heritage';

  @override
  String get categoryMuseum => 'Museum';

  @override
  String get categoryNature => 'Nature';

  @override
  String get categoryReligious => 'Religious';

  @override
  String get categoryCity => 'City';

  @override
  String get categoryAdventure => 'Adventure';

  @override
  String get categoryFood => 'Food';

  @override
  String get escrowPending => 'Pending';

  @override
  String get escrowHeld => 'Held in escrow';

  @override
  String get escrowSettling => 'Settling';

  @override
  String get escrowReleased => 'Released to guide';

  @override
  String get escrowRefunded => 'Refunded';

  @override
  String get escrowPartiallyRefunded => 'Partially refunded';

  @override
  String get escrowDisputed => 'Disputed';

  @override
  String get escrowFailed => 'Failed';

  @override
  String get liveBadge => 'LIVE';
}
