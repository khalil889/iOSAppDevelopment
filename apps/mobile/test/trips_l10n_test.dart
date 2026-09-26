import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/screens/shared/assistant_screen.dart';
import 'package:tourguide_mobile/screens/shared/live_tour_screen.dart';
import 'package:tourguide_mobile/services/location_service.dart';
import 'package:tourguide_mobile/services/payment_sheet.dart';
import 'package:tourguide_mobile/services/repository.dart';
import 'helpers.dart';

Map<String, dynamic> _liveBooking() => {
      'id': 'b1',
      'status': 'IN_PROGRESS',
      'startAt': DateTime.now().toUtc().subtract(const Duration(minutes: 20)).toIso8601String(),
      'endAt': DateTime.now().toUtc().add(const Duration(hours: 2)).toIso8601String(),
      'startedAt': DateTime.now().toUtc().subtract(const Duration(minutes: 20)).toIso8601String(),
      'groupSize': 2,
      'totalMinor': 45000,
      'guidePayoutMinor': 38250,
      'currency': 'SAR',
      'guide': {'id': 'g1', 'name': 'Faisal Al-Harbi', 'phone': '+966500000101'},
      'tourist': {'id': 't1', 'name': 'Sara Williams'},
      'package': {'id': 'p1', 'title': 'Diriyah at Golden Hour', 'durationMinutes': 180, 'priceMinor': 45000, 'currency': 'SAR', 'maxGroupSize': 6},
    };

void main() {
  testWidgets('live tour and SOS dialog render in Arabic, right to left', (tester) async {
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async => http.Response(jsonEncode(_liveBooking()), 200)),
    );
    final repo = Repository(api);
    await tester.pumpWidget(MultiProvider(
      providers: [
        Provider.value(value: repo),
        ChangeNotifierProvider(create: (_) => Session(api, repo)),
        Provider<LocationService>.value(value: StubLocationService((lat: 24.7, lng: 46.6))),
      ],
      child: localizedApp(const LiveTourScreen(bookingId: 'b1'), locale: const Locale('ar')),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('جولة مباشرة'), findsOneWidget);
    expect(find.text('مرشدك المرخّص · \u2066+966500000101\u2069'), findsOneWidget);
    expect(find.textContaining('مسافران'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('جولة مباشرة'))), TextDirection.rtl);

    final sos = find.text('استغاثة');
    await tester.ensureVisible(sos);
    final gesture = await tester.startGesture(tester.getCenter(sos));
    for (var i = 0; i < 14; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    await gesture.up();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('إرسال نداء استغاثة؟'), findsOneWidget);
    expect(find.text('أرسل الاستغاثة'), findsOneWidget);
  });

  testWidgets('assistant puts the user bubble on the end side in Arabic', (tester) async {
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async => http.Response(jsonEncode({'reply': 'Welcome', 'suggestions': []}), 200)),
    );
    await tester.pumpWidget(Provider.value(
      value: Repository(api),
      child: localizedApp(const AssistantScreen(), locale: const Locale('ar')),
    ));
    expect(find.text('المساعد السياحي'), findsOneWidget);
    await tester.tap(find.text('خطط لي يومين في العُلا'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    final user = tester.getCenter(find.text('خطط لي يومين في العُلا'));
    final reply = tester.getCenter(find.text('Welcome'));
    // RTL: the user's message is on the left (end), the reply on the right (start).
    expect(user.dx, lessThan(reply.dx));
  });

  testWidgets('stub payment sheet in Arabic keeps card numbers LTR', (tester) async {
    await tester.pumpWidget(localizedApp(
      Builder(
        builder: (context) => ElevatedButton(
          onPressed: () => StubPaymentSheet().collect(
            context,
            const PaymentRequest(bookingId: 'b1', amountMinor: 45000, currency: 'SAR', description: 'x'),
          ),
          child: const Text('pay'),
        ),
      ),
      locale: const Locale('ar'),
    ));
    await tester.tap(find.text('pay'));
    await tester.pumpAndSettle();
    expect(find.text('ادفع SAR 450'), findsOneWidget);
    expect(find.text('بطاقة تجريبية — دفع ناجح'), findsOneWidget);
    expect(tester.widget<Text>(find.text('•••• 4242')).textDirection, TextDirection.ltr);
    expect(Directionality.of(tester.element(find.text('ادفع SAR 450'))), TextDirection.rtl);
  });
}
