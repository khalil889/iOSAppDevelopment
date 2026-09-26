import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/screens/shared/live_tour_screen.dart';
import 'package:tourguide_mobile/services/location_service.dart';
import 'package:tourguide_mobile/services/repository.dart';
import 'helpers.dart';

void main() {
  testWidgets('holding SOS and confirming sends the GPS position and message', (tester) async {
    http.Request? sos;
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async {
        if (req.url.path.endsWith('/sos')) {
          sos = req;
          return http.Response(jsonEncode({'id': 's1', 'status': 'RECEIVED', 'opsPaged': true}), 201);
        }
        return http.Response(
          jsonEncode({
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
          }),
          200,
        );
      }),
    );
    final repo = Repository(api);

    await tester.pumpWidget(MultiProvider(
      providers: [
        Provider.value(value: repo),
        ChangeNotifierProvider(create: (_) => Session(api, repo)),
        Provider<LocationService>.value(value: StubLocationService((lat: 24.7339, lng: 46.5755))),
      ],
      child: localizedApp(const LiveTourScreen(bookingId: 'b1')),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('LIVE'), findsOneWidget);

    // A quick tap must not trigger the alert.
    await tester.ensureVisible(find.text('SOS'));
    await tester.tap(find.text('SOS'));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Send SOS alert?'), findsNothing);

    // Hold for over a second.
    final gesture = await tester.startGesture(tester.getCenter(find.text('SOS')));
    for (var i = 0; i < 14; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    await gesture.up();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('Send SOS alert?'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'Lost the group');
    await tester.tap(find.text('Send SOS'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(sos, isNotNull);
    expect(jsonDecode(sos!.body), {'lat': 24.7339, 'lng': 46.5755, 'message': 'Lost the group'});
    expect(find.text('Help is on the way'), findsOneWidget);
  });
}
