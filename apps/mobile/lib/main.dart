import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/inbox_controller.dart';
import 'core/session.dart';
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
  final session = Session(api, repo, push: push)..restore();

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: repo),
        Provider<PushService>.value(value: push),
        ChangeNotifierProvider.value(value: session),
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

    return MaterialApp(
      navigatorKey: appNavigatorKey,
      scaffoldMessengerKey: appMessengerKey,
      title: 'TourGuide',
      debugShowCheckedModeBanner: false,
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
    return PushListener(child: HomeShell(key: ValueKey(session.user?.id ?? 'guest')));
  }
}
