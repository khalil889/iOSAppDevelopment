import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/services/payment_sheet.dart';
import 'package:tourguide_mobile/services/repository.dart';
import 'package:tourguide_mobile/l10n/l10n.dart';
import 'package:tourguide_mobile/main.dart' show localizationsDelegates;

Map<String, dynamic> _booking(String status) => {
      'id': 'b1',
      'status': status,
      'startAt': '2026-10-01T07:00:00Z',
      'endAt': '2026-10-01T10:00:00Z',
      'groupSize': 2,
      'totalMinor': 45000,
      'guidePayoutMinor': 38250,
      'currency': 'SAR',
    };

Repository _repo(Future<http.Response> Function(http.Request) handler, List<String> log) => Repository(
      ApiClient(
        baseUrl: 'http://api.test',
        httpClient: MockClient((req) {
          log.add('${req.method} ${req.url.path}');
          return handler(req);
        }),
      ),
    );

const _request = PaymentRequest(bookingId: 'b1', amountMinor: 45000, currency: 'SAR', description: 'Diriyah tour');

/// Opens [sheet] from a button; the collected value lands in the returned holder.
Future<List<String?>> _openSheet(WidgetTester tester, PaymentSheet sheet) async {
  final result = <String?>[];
  await tester.pumpWidget(MaterialApp(
    localizationsDelegates: localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: Builder(
      builder: (context) => ElevatedButton(
        onPressed: () async => result.add(await sheet.collect(context, _request)),
        child: const Text('pay'),
      ),
    ),
  ));
  await tester.tap(find.text('pay'));
  await tester.pumpAndSettle();
  return result;
}

void main() {
  group('Repository.pay', () {
    test('returns the confirmed booking without an extra call', () async {
      final log = <String>[];
      final repo = _repo((_) async => http.Response(jsonEncode({'booking': _booking('CONFIRMED')}), 200), log);
      final b = await repo.pay('b1', 'pay_123');
      expect(b.status, BookingStatus.confirmed);
      expect(log, ['POST /bookings/b1/pay']);
    });

    test('re-checks once when the gateway still needs confirmation', () async {
      final log = <String>[];
      final repo = _repo((req) async {
        final status = req.url.path.endsWith('/confirm') ? 'CONFIRMED' : 'PENDING_PAYMENT';
        return http.Response(jsonEncode({'booking': _booking(status), 'nextActionUrl': 'https://3ds.test'}), 200);
      }, log);
      final b = await repo.pay('b1', 'pay_123');
      expect(b.status, BookingStatus.confirmed);
      expect(log, ['POST /bookings/b1/pay', 'POST /bookings/b1/pay/confirm']);
    });
  });

  group('ConfiguredPaymentSheet', () {
    testWidgets('uses the test-card sheet when the API runs the stub provider', (tester) async {
      final log = <String>[];
      final sheet = ConfiguredPaymentSheet(_repo((_) async => http.Response('{"provider":"stub"}', 200), log));
      final result = await _openSheet(tester, sheet);
      expect(find.text('Pay SAR 450'), findsOneWidget);
      await tester.tap(find.text('Test card — succeeds'));
      await tester.pumpAndSettle();
      expect(result, ['tok_ok']);
      expect(log, ['GET /payments/config']);
    });

    testWidgets('shows the Moyasar card form when the API runs Moyasar', (tester) async {
      final sheet = ConfiguredPaymentSheet(_repo(
        (_) async => http.Response('{"provider":"moyasar","publishableKey":"pk_test_x","callbackUrl":"https://app.test/cb"}', 200),
        [],
      ));
      await _openSheet(tester, sheet);
      expect(find.text('Pay SAR 450'), findsOneWidget);
      expect(find.textContaining('escrow'), findsOneWidget);
      expect(find.text('Test card — succeeds'), findsNothing);
      expect(find.byType(TextFormField), findsWidgets); // Moyasar's card fields
    });
  });
}
