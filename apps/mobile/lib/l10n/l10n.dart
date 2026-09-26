import 'package:flutter/widgets.dart';

import '../core/api_client.dart';
import 'gen/app_localizations.dart';

export 'gen/app_localizations.dart';

extension L10nContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);
  bool get isArabic => Localizations.localeOf(this).languageCode == 'ar';
}

/// User-facing text for an error. API messages arrive already translated
/// (the client sends `Accept-Language`); client-side failures are mapped here.
String errorText(BuildContext context, Object error) {
  final l10n = context.l10n;
  if (error is! ApiException) return l10n.somethingWentWrong;
  switch (error.code) {
    case ApiException.network:
      return l10n.errorNetwork;
    case ApiException.uploadFailed:
      return l10n.errorUploadFailed;
    case ApiException.uploadRejected:
      return l10n.errorUploadRejected(error.statusCode);
  }
  return error.message.isEmpty ? l10n.errorRequestFailed(error.statusCode) : error.message;
}
