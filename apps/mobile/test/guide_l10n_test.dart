import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/core/token_store.dart';
import 'package:tourguide_mobile/screens/guide/availability_screen.dart';
import 'package:tourguide_mobile/screens/guide/guide_dashboard_screen.dart';
import 'package:tourguide_mobile/screens/guide/license_form_screen.dart';
import 'package:tourguide_mobile/services/repository.dart';
import 'helpers.dart';

final _responses = <String, Object>{
  '/guides/me/availability': {
    'weeklyHours': [
      {'weekday': 0, 'start': '09:00', 'end': '17:00'},
    ],
    'timeOff': [],
  },
  '/guides/me/dashboard': {
    'guide': {'name': 'Faisal', 'verificationStatus': 'PENDING', 'ratingAvg': 4.8, 'ratingCount': 3},
    'stats': {'COMPLETED': 2, 'CONFIRMED': 1},
    'earnings': [
      {'currency': 'SAR', 'releasedMinor': 100000, 'heldMinor': 38250},
    ],
    'upcoming': [
      {
        'id': 'b1',
        'status': 'IN_PROGRESS',
        'startAt': '2026-10-01T06:00:00Z',
        'groupSize': 2,
        'packageTitle': 'Diriyah at Golden Hour',
        'touristName': 'Sara',
        'guidePayoutMinor': 38250,
        'currency': 'SAR',
      },
    ],
  },
  '/countries': [
    {'id': 'sa', 'code': 'SA', 'name': 'Saudi Arabia', 'currency': 'SAR'},
  ],
};

Widget _app(Widget home, {Locale locale = const Locale('ar')}) {
  final api = ApiClient(
    baseUrl: 'http://api.test',
    httpClient: MockClient((req) async => http.Response.bytes(utf8.encode(jsonEncode(_responses[req.url.path])), 200,
        headers: {'content-type': 'application/json; charset=utf-8'})),
  );
  final repo = Repository(api);
  return MultiProvider(
    providers: [
      Provider.value(value: repo),
      ChangeNotifierProvider(create: (_) => Session(api, repo, store: MemoryTokenStore())),
    ],
    child: localizedApp(home, locale: locale),
  );
}

/// Tall enough for the dashboard's tiles and the upcoming-tours list.
void _tallScreen(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 1400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

TextDirection _dirOf(WidgetTester tester, Finder f) => Directionality.of(tester.element(f));

void main() {
  testWidgets('availability renders in Arabic, RTL, with Arabic weekday names and LTR hours', (tester) async {
    await tester.pumpWidget(_app(const AvailabilityScreen()));
    await tester.pumpAndSettle();

    expect(find.text('أوقات التوفر'), findsOneWidget);
    expect(find.text('ساعات العمل الأسبوعية'), findsOneWidget);
    expect(_dirOf(tester, find.text('أوقات التوفر')), TextDirection.rtl);
    // Week starts on Sunday; names come from intl.
    expect(find.text('الأحد'), findsOneWidget);
    expect(find.text('الجمعة'), findsOneWidget);
    expect(find.text('غير متاح'), findsWidgets); // days without hours
    final hours = tester.widget<Text>(find.text('09:00–17:00'));
    expect(hours.textDirection, TextDirection.ltr);
  });

  testWidgets('dashboard renders in Arabic with plurals and the live badge', (tester) async {
    _tallScreen(tester);
    await tester.pumpWidget(_app(const GuideDashboardScreen()));
    await tester.pumpAndSettle();

    expect(_dirOf(tester, find.byType(ListView)), TextDirection.rtl);
    expect(find.text('جارٍ التحقق'), findsOneWidget);
    expect(find.text('3 تقييمات'), findsOneWidget);
    expect(find.text('جولتان'), findsOneWidget);
    expect(find.text('الجولات القادمة'), findsOneWidget);
    expect(find.textContaining('شخصان'), findsOneWidget);
    expect(find.text('أوقات التوفر'), findsOneWidget);
    expect(find.text('جولاتي'), findsOneWidget);
  });

  testWidgets('dashboard in English keeps the original copy', (tester) async {
    _tallScreen(tester);
    await tester.pumpWidget(_app(const GuideDashboardScreen(), locale: const Locale('en')));
    await tester.pumpAndSettle();

    expect(find.text('Verification in progress'), findsOneWidget);
    expect(find.text('3 reviews'), findsOneWidget);
    expect(find.text('tours'), findsOneWidget);
    expect(find.textContaining('2 guests'), findsOneWidget);
    expect(find.text('LIVE'), findsOneWidget);
    expect(find.text('My tours'), findsOneWidget);
  });

  testWidgets('license form is Arabic and validates in Arabic, license number stays LTR', (tester) async {
    await tester.pumpWidget(_app(const LicenseFormScreen()));
    await tester.pumpAndSettle();

    expect(find.text('الرخصة السياحية'), findsOneWidget);
    expect(_dirOf(tester, find.text('الرخصة السياحية')), TextDirection.rtl);
    final number = tester.widget<TextField>(find.widgetWithText(TextField, 'رقم الرخصة'));
    expect(number.textDirection, TextDirection.ltr);

    await tester.ensureVisible(find.text('إرسال للتحقق'));
    await tester.tap(find.text('إرسال للتحقق'));
    await tester.pumpAndSettle();
    expect(find.text('اختر البلد'), findsOneWidget);
    expect(find.text('أدخل رقم رخصتك'), findsOneWidget);
    expect(find.text('اختر تاريخ الانتهاء'), findsOneWidget);
  });
}
