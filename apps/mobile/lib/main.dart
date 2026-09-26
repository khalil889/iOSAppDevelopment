import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/inbox_controller.dart';
import 'core/locale_controller.dart';
import 'core/session.dart';
import 'l10n/l10n.dart';
import 'screens/home_shell.dart';
import 'screens/shared/push_listener.dart';
import 'services/location_service.dart';
import 'services/payment_sheet.dart';
import 'services/push_service.dart';
import 'services/repository.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final api = ApiClient();
  final repo = Repository(api);
  final push = await FirebasePushService.create();
  await initializeDateFormatting();
  final locale = LocaleController(api);
  await locale.restore();
  final session = Session(api, repo, push: push)..restore();
  // Notifications and SMS are sent in the language saved on the profile.
  locale.onChanged = (code) async {
    if (session.isSignedIn) await repo.updateLocale(code);
  };

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: repo),
        Provider<PushService>.value(value: push),
        ChangeNotifierProvider.value(value: session),
        ChangeNotifierProvider.value(value: locale),
        ChangeNotifierProvider(create: (_) => InboxController(repo)),
        Provider<LocationService>(create: (_) => GeolocatorLocationService()),
        Provider<PaymentSheet>(create: (_) => ConfiguredPaymentSheet(repo)),
      ],
      child: const TourGuideApp(),
    ),
  );
}

class TourGuideApp extends StatelessWidget {
  const TourGuideApp({super.key});

  @override
  Widget build(BuildContext context) {
    const seed = Color(0xFF0F766E);
    ThemeData theme(Brightness b) => ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: b),
          useMaterial3: true,
          cardTheme: const CardThemeData(margin: EdgeInsets.symmetric(vertical: 6)),
          inputDecorationTheme: const InputDecorationTheme(border: OutlineInputBorder()),
        );

    final locale = context.watch<LocaleController>();
    return MaterialApp(
      navigatorKey: appNavigatorKey,
      scaffoldMessengerKey: appMessengerKey,
      onGenerateTitle: (context) => context.l10n.appTitle,
      debugShowCheckedModeBanner: false,
      locale: locale.override,
      supportedLocales: LocaleController.supported,
      localizationsDelegates: localizationsDelegates,
      localeListResolutionCallback: (device, _) {
        final resolved = locale.resolve(device);
        locale.sync(resolved);
        return resolved;
      },
      theme: theme(Brightness.light),
      darkTheme: theme(Brightness.dark),
      home: const _Root(),
    );
  }
}

/// Splash while restoring the session, then the shell (guests can browse).
class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    if (session.restoring) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    // Re-keyed on language too, so every screen reloads translated content.
    final language = Localizations.localeOf(context).languageCode;
    return PushListener(child: HomeShell(key: ValueKey('${session.user?.id ?? 'guest'}/$language')));
  }
}

const localizationsDelegates = <LocalizationsDelegate<Object>>[
  AppLocalizations.delegate,
  GlobalMaterialLocalizations.delegate,
  GlobalWidgetsLocalizations.delegate,
  GlobalCupertinoLocalizations.delegate,
];
