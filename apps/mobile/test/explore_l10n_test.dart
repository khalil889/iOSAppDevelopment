import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/core/token_store.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/screens/tourist/booking_screen.dart';
import 'package:tourguide_mobile/screens/tourist/explore_screen.dart';
import 'package:tourguide_mobile/screens/tourist/guide_profile_screen.dart';
import 'package:tourguide_mobile/screens/tourist/review_screen.dart';
import 'package:tourguide_mobile/screens/tourist/site_guides_screen.dart';
import 'package:tourguide_mobile/services/payment_sheet.dart';
import 'package:tourguide_mobile/services/repository.dart';
import 'helpers.dart';

final _responses = <String, Object>{
  '/sites': {'items': []},
  '/guides': {'items': []},
  '/cities': [],
  '/guides/g1': {
    'id': 'g1',
    'name': 'Noura Al-Qahtani',
    'verified': true,
    'yearsOfExperience': 3,
    'languages': ['ar', 'en'],
    'cities': [
      {'id': 'c1', 'name': 'AlUla'},
      {'id': 'c2', 'name': 'Riyadh'},
    ],
    'license': {'number': 'SCTH-1', 'country': 'SA'},
    'packages': [
      {
        'id': 'p1',
        'title': 'Hegra Tombs Discovery',
        'durationMinutes': 210,
        'pricingType': 'PER_PERSON',
        'priceMinor': 32000,
        'currency': 'SAR',
        'maxGroupSize': 8,
      },
    ],
    'reviews': [],
  },
  '/availability/slots': {
    'date': '2026-10-04',
    'timeZone': 'Asia/Riyadh',
    'slots': [
      {'startAt': '2026-10-04T04:00:00.000Z', 'endAt': '2026-10-04T07:30:00.000Z', 'localTime': '07:00'},
    ],
  },
  '/bookings/quote': {'totalMinor': 32000, 'platformFeeMinor': 4800, 'currency': 'SAR', 'endAt': '2026-10-04T07:30:00.000Z'},
};

Widget _app(Widget home) {
  final api = ApiClient(
    baseUrl: 'http://api.test',
    httpClient: MockClient((req) async => http.Response.bytes(utf8.encode(jsonEncode(_responses[req.url.path] ?? {})), 200,
        headers: {'content-type': 'application/json; charset=utf-8'})),
  );
  final repo = Repository(api);
  return MultiProvider(
    providers: [
      Provider.value(value: repo),
      Provider<PaymentSheet>.value(value: StubPaymentSheet()),
      ChangeNotifierProvider(create: (_) => Session(api, repo, store: MemoryTokenStore())),
    ],
    child: localizedApp(home, locale: const Locale('ar')),
  );
}

TextDirection _dirOf(WidgetTester tester, Finder f) => Directionality.of(tester.element(f));

final _guide = GuideSummary.fromJson({'id': 'g1', 'name': 'Noura Al-Qahtani', 'verified': true});
final _package = TourPackage.fromJson({
  'id': 'p1',
  'title': 'Hegra Tombs Discovery',
  'durationMinutes': 210,
  'pricingType': 'PER_PERSON',
  'priceMinor': 32000,
  'currency': 'SAR',
  'maxGroupSize': 8,
});

void main() {
  testWidgets('explore renders in Arabic and RTL with translated tabs, filters and empty state', (tester) async {
    await tester.pumpWidget(_app(const ExploreScreen()));
    await tester.pumpAndSettle();

    expect(find.text('استكشف'), findsOneWidget);
    expect(_dirOf(tester, find.text('استكشف')), TextDirection.rtl);
    expect(find.text('الأماكن'), findsOneWidget);
    expect(find.text('المرشدون'), findsOneWidget);
    expect(find.text('كل المدن'), findsOneWidget);
    expect(find.text('تراث'), findsOneWidget); // category chip via l10n.siteCategory
    expect(find.text('لا توجد أماكن تطابق عوامل التصفية.'), findsOneWidget);

    await tester.tap(find.text('المرشدون'));
    await tester.pumpAndSettle();
    expect(find.text('كل اللغات'), findsOneWidget);
    expect(find.text('الأعلى تقييمًا'), findsOneWidget);
    expect(find.text('لا يوجد مرشدون مرخّصون يطابقون عوامل التصفية.'), findsOneWidget);
  });

  testWidgets('site guides screen shows Arabic license notice and empty state', (tester) async {
    final site = Site.fromJson({
      'id': 's1',
      'name': 'Hegra',
      'category': 'HERITAGE',
      'description': 'Nabataean tombs',
      'requiresLicensedGuide': true,
      'city': {'id': 'c1', 'name': 'AlUla', 'country': 'Saudi Arabia'},
    });
    await tester.pumpWidget(_app(SiteGuidesScreen(site: site)));
    await tester.pumpAndSettle();

    expect(find.text('يلزم مرشد مرخّص'), findsOneWidget);
    expect(find.text('تراث'), findsOneWidget);
    expect(find.text('AlUla، Saudi Arabia'), findsOneWidget);
    expect(find.text('لا يوجد مرشدون لهذا المكان حتى الآن.'), findsOneWidget);
    expect(_dirOf(tester, find.text('يلزم مرشد مرخّص')), TextDirection.rtl);
  });

  testWidgets('guide profile uses Arabic plurals and list separators', (tester) async {
    await tester.pumpWidget(_app(const GuideProfileScreen(guideId: 'g1')));
    await tester.pumpAndSettle();

    expect(find.text('3 سنوات'), findsOneWidget);
    expect(find.text('AlUla، Riyadh'), findsOneWidget);
    expect(find.text('حتى 8 أشخاص'), findsOneWidget);
    expect(find.text('احجز'), findsOneWidget);
    expect(find.text('لا توجد تقييمات بعد.'), findsOneWidget);
  });

  testWidgets('booking screen is Arabic and RTL, with times kept LTR', (tester) async {
    await tester.pumpWidget(_app(BookingScreen(guide: _guide, package: _package)));
    await tester.pumpAndSettle();

    expect(find.text('حجز الجولة'), findsOneWidget);
    expect(_dirOf(tester, find.text('حجز الجولة')), TextDirection.rtl);
    expect(find.text('اختر وقت البدء لعرض السعر.'), findsOneWidget);
    expect(find.text('بالتوقيت المحلي · Asia/Riyadh'), findsOneWidget);

    await tester.tap(find.text('07:00'));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle();

    final range = tester.widget<Text>(find.text('07:00–10:30 (Asia/Riyadh)'));
    expect(range.textDirection, TextDirection.ltr);
    expect(find.text('الإجمالي'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'تأكيد ودفع'), findsOneWidget);
  });

  testWidgets('review screen is Arabic and RTL', (tester) async {
    final booking = Booking.fromJson({
      'id': 'booking-1',
      'status': 'COMPLETED',
      'startAt': '2026-05-01T08:00:00Z',
      'endAt': '2026-05-01T11:00:00Z',
      'groupSize': 2,
      'totalMinor': 64000,
      'guidePayoutMinor': 54400,
      'currency': 'SAR',
      'guide': {'id': 'g1', 'name': 'Noura'},
      'package': {'id': 'p1', 'title': 'Hegra Tombs', 'durationMinutes': 180, 'priceMinor': 1, 'currency': 'SAR', 'maxGroupSize': 8},
    });
    await tester.pumpWidget(_app(ReviewScreen(booking: booking)));

    expect(find.text('قيّم جولتك'), findsOneWidget);
    expect(find.text('كيف كانت تجربتك في Hegra Tombs مع Noura؟'), findsOneWidget);
    expect(_dirOf(tester, find.text('قيّم جولتك')), TextDirection.rtl);

    await tester.tap(find.byTooltip('ممتازة'));
    await tester.pump();
    expect(find.text('ممتازة'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'إرسال التقييم'), findsOneWidget);
  });
}
