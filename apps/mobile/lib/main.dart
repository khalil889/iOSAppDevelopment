import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/session.dart';
import 'screens/home_shell.dart';
import 'services/location_service.dart';
import 'services/payment_sheet.dart';
import 'services/repository.dart';

void main() {
  final api = ApiClient();
  final repo = Repository(api);
  final session = Session(api, repo)..restore();

  runApp(
    MultiProvider(
      providers: [
        Provider.value(value: repo),
        ChangeNotifierProvider.value(value: session),
        Provider<LocationService>(create: (_) => StubLocationService()),
        Provider<PaymentSheet>(create: (_) => StubPaymentSheet()),
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
    return HomeShell(key: ValueKey(session.user?.id ?? 'guest'));
  }
}
