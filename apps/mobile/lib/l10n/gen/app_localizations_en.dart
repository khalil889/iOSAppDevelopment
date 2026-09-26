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
}
