import 'package:flutter/material.dart';
import 'package:tourguide_mobile/l10n/l10n.dart';
import 'package:tourguide_mobile/main.dart' show localizationsDelegates;

/// MaterialApp with the app's localizations, in English unless [locale] is given.
Widget localizedApp(Widget home, {Locale locale = const Locale('en')}) => MaterialApp(
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: localizationsDelegates,
      home: home,
    );
