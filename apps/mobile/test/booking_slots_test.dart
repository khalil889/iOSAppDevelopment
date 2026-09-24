import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/screens/tourist/booking_screen.dart';
import 'package:tourguide_mobile/services/payment_sheet.dart';
import 'package:tourguide_mobile/services/repository.dart';

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
  testWidgets('shows free slots in city time and quotes the chosen one', (tester) async {
    final requests = <http.Request>[];
    final client = MockClient((req) async {
      requests.add(req);
      if (req.url.path == '/availability/slots') {
        return http.Response(
          jsonEncode({
            'date': req.url.queryParameters['date'],
            'timeZone': 'Asia/Riyadh',
            'slots': [
              {'startAt': '2026-10-04T04:00:00.000Z', 'endAt': '2026-10-04T07:30:00.000Z', 'localTime': '07:00'},
              {'startAt': '2026-10-04T04:30:00.000Z', 'endAt': '2026-10-04T08:00:00.000Z', 'localTime': '07:30'},
            ],
          }),
          200,
        );
      }
      if (req.url.path == '/bookings/quote') {
        return http.Response(
          jsonEncode({'totalMinor': 64000, 'platformFeeMinor': 9600, 'currency': 'SAR', 'endAt': '2026-10-04T08:00:00.000Z'}),
          200,
        );
      }
      return http.Response('{}', 404);
    });
    final repo = Repository(ApiClient(httpClient: client, baseUrl: 'http://api.test'));

    await tester.pumpWidget(MultiProvider(
      providers: [Provider.value(value: repo), Provider<PaymentSheet>.value(value: StubPaymentSheet())],
      child: MaterialApp(home: BookingScreen(guide: _guide, package: _package)),
    ));
    await tester.pumpAndSettle();

    expect(find.text('07:00'), findsOneWidget);
    expect(find.textContaining('Asia/Riyadh'), findsOneWidget);
    expect(find.text('Pick a start time to see the price.'), findsOneWidget);
    final confirm = find.widgetWithText(FilledButton, 'Confirm & pay');
    expect(tester.widget<FilledButton>(confirm).onPressed, isNull);

    await tester.tap(find.text('07:30'));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpAndSettle();

    final quote = requests.lastWhere((r) => r.url.path == '/bookings/quote');
    expect(jsonDecode(quote.body)['startAt'], '2026-10-04T04:30:00.000Z');
    expect(find.text('SAR 640'), findsWidgets);
    expect(tester.widget<FilledButton>(confirm).onPressed, isNotNull);
  });

  test('GuideAvailability round-trips weekly hours and time off', () {
    final a = GuideAvailability.fromJson({
      'weeklyHours': [
        {'weekday': 0, 'start': '08:00', 'end': '21:00'},
      ],
      'timeOff': [
        {'startDate': '2026-12-24', 'endDate': '2026-12-26', 'reason': null},
      ],
    });
    expect(a.weeklyHours.single.toJson(), {'weekday': 0, 'start': '08:00', 'end': '21:00'});
    expect(a.timeOff.single.toJson(), {'startDate': '2026-12-24', 'endDate': '2026-12-26'});
  });
}
