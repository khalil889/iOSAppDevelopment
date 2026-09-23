import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/screens/tourist/review_screen.dart';
import 'package:tourguide_mobile/services/repository.dart';

Booking _completedBooking() => Booking.fromJson({
      'id': 'booking-1',
      'status': 'COMPLETED',
      'startAt': '2026-05-01T08:00:00Z',
      'endAt': '2026-05-01T11:00:00Z',
      'groupSize': 2,
      'totalMinor': 64000,
      'guidePayoutMinor': 54400,
      'currency': 'SAR',
      'guide': {'id': 'g1', 'name': 'Noura Al-Qahtani'},
      'package': {'id': 'p1', 'title': 'Hegra Tombs', 'durationMinutes': 180, 'priceMinor': 1, 'currency': 'SAR', 'maxGroupSize': 8},
    });

Widget _app(http.Client client, Booking booking) {
  final repo = Repository(ApiClient(httpClient: client, baseUrl: 'http://api.test'));
  return Provider.value(
    value: repo,
    child: MaterialApp(home: ReviewScreen(booking: booking)),
  );
}

void main() {
  testWidgets('submit is disabled until a star rating is chosen, then posts the review', (tester) async {
    http.Request? sent;
    final client = MockClient((req) async {
      sent = req;
      return http.Response(jsonEncode({'id': 'r1', 'rating': 4}), 201);
    });

    await tester.pumpWidget(_app(client, _completedBooking()));
    expect(find.textContaining('Noura Al-Qahtani'), findsOneWidget);

    final submit = find.widgetWithText(FilledButton, 'Submit review');
    expect(tester.widget<FilledButton>(submit).onPressed, isNull);

    await tester.tap(find.byTooltip('Great'));
    await tester.pump();
    expect(tester.widget<FilledButton>(submit).onPressed, isNotNull);

    await tester.enterText(find.byType(TextField), 'Wonderful tour');
    await tester.tap(submit);
    await tester.pumpAndSettle();

    expect(sent, isNotNull);
    expect(sent!.url.path, '/bookings/booking-1/review');
    expect(jsonDecode(sent!.body), {'rating': 4, 'comment': 'Wonderful tour'});
  });

  testWidgets('shows the API rule violation when the review is rejected', (tester) async {
    final client = MockClient((_) async => http.Response(
          jsonEncode({'statusCode': 409, 'error': 'ALREADY_REVIEWED', 'message': 'You have already reviewed this booking'}),
          409,
        ));

    await tester.pumpWidget(_app(client, _completedBooking()));
    await tester.tap(find.byTooltip('Outstanding'));
    await tester.pump();
    await tester.tap(find.widgetWithText(FilledButton, 'Submit review'));
    await tester.pumpAndSettle();

    expect(find.text('You have already reviewed this booking'), findsOneWidget);
    expect(find.byType(ReviewScreen), findsOneWidget);
  });
}
