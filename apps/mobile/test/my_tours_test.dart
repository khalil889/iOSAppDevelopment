import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/format.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/screens/guide/my_tours_screen.dart';
import 'package:tourguide_mobile/screens/guide/tour_form_screen.dart';
import 'package:tourguide_mobile/services/repository.dart';
import 'helpers.dart';

Map<String, dynamic> _tourJson({bool active = true}) => {
      'id': 'p1',
      'cityId': 'c1',
      'city': {
        'id': 'c1',
        'name': 'Riyadh',
        'nameAr': 'الرياض',
        'timezone': 'Asia/Riyadh',
        'country': {'currency': 'SAR'},
      },
      'title': 'Old Diriyah walk',
      'titleAr': 'جولة الدرعية التاريخية',
      'description': 'Mud-brick palaces',
      'descriptionAr': null,
      'durationMinutes': 180,
      'pricingType': 'PER_PERSON',
      'priceMinor': 45050,
      'currency': 'SAR',
      'maxGroupSize': 8,
      'languages': ['ar', 'en'],
      'isActive': active,
      'sites': [
        {'id': 's1', 'name': 'At-Turaif', 'nameAr': 'حي الطريف', 'cityId': 'c1'},
      ],
      'photoKeys': <String>[],
      'photoUrls': <String>[],
    };

final _cities = [
  {'id': 'c1', 'name': 'Riyadh', 'country': {'currency': 'SAR'}},
  {'id': 'c2', 'name': 'Amman', 'country': {'currency': 'JOD'}},
  {'id': 'c3', 'name': 'Cairo', 'country': {'currency': 'EGP'}},
];

http.Response _json(Object? body, int status) => http.Response.bytes(
      utf8.encode(jsonEncode(body)),
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

/// Fake API: guide serves Riyadh and Amman; records every request.
MockClient _api(List<http.Request> requests, {List<Map<String, dynamic>>? tours}) => MockClient((req) async {
      requests.add(req);
      final path = req.url.path;
      if (req.method == 'GET' && path == '/packages/mine') return _json(tours ?? [], 200);
      if (req.method == 'GET' && path == '/guides/me') {
        return http.Response(
          jsonEncode({
            'id': 'g1',
            'cities': [
              {'id': 'c1', 'name': 'Riyadh'},
              {'id': 'c2', 'name': 'Amman'},
            ],
          }),
          200,
        );
      }
      if (req.method == 'GET' && path == '/cities') return _json(_cities, 200);
      if (req.method == 'GET' && path == '/sites') {
        final city = req.url.queryParameters['cityId'];
        return http.Response(
          jsonEncode({
            'items': [
              {'id': 's-$city', 'name': 'Site in $city', 'category': 'HERITAGE', 'cityId': city},
            ],
          }),
          200,
        );
      }
      if (req.method == 'PATCH' && path == '/packages/p1') {
        final body = jsonDecode(req.body) as Map<String, dynamic>;
        return _json({..._tourJson(), ...body}, 200);
      }
      if (req.method == 'POST' && path == '/packages') {
        final body = jsonDecode(req.body) as Map<String, dynamic>;
        return _json({..._tourJson(), ...body, 'id': 'new'}, 201);
      }
      return _json({'message': 'unexpected ${req.method} $path'}, 404);
    });

Widget _app(http.Client client, Widget home, {Locale locale = const Locale('en')}) => Provider.value(
      value: Repository(ApiClient(httpClient: client, baseUrl: 'http://api.test')),
      child: localizedApp(home, locale: locale),
    );

void _tallScreen(WidgetTester tester) {
  tester.view.physicalSize = const Size(1200, 4000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

Future<void> _fillAndSave(WidgetTester tester, {required String city, required String price}) async {
  await tester.enterText(find.byKey(const ValueKey('tourTitleEn')), 'Desert castles');
  await tester.tap(find.byKey(const ValueKey('tourCity')));
  await tester.pumpAndSettle();
  await tester.tap(find.text(city).last);
  await tester.pumpAndSettle();
  await tester.enterText(find.byKey(const ValueKey('tourPrice')), price);
  await tester.tap(find.widgetWithText(FilterChip, 'English'));
  await tester.pump();
  await tester.tap(find.widgetWithText(FilledButton, 'Create tour'));
  await tester.pumpAndSettle();
}

void main() {
  group('price parsing', () {
    test('major units to minor units per currency exponent', () {
      expect(parseMajorToMinor('450.5', 'SAR'), 45050);
      expect(parseMajorToMinor('12.250', 'JOD'), 12250);
      expect(parseMajorToMinor('٤٥٠٫٥', 'SAR'), 45050);
      expect(parseMajorToMinor('450,50', 'SAR'), 45050);
      expect(parseMajorToMinor('1.234', 'SAR'), isNull);
      expect(parseMajorToMinor('abc', 'SAR'), isNull);
      expect(minorToMajorText(45050, 'SAR'), '450.5');
      expect(minorToMajorText(12250, 'JOD'), '12.25');
    });
  });

  testWidgets('lists the guide\'s tours and pausing one sends PATCH {isActive:false}', (tester) async {
    final requests = <http.Request>[];
    await tester.pumpWidget(_app(_api(requests, tours: [_tourJson()]), const MyToursScreen()));
    await tester.pumpAndSettle();

    expect(find.text('Old Diriyah walk'), findsOneWidget);
    expect(find.textContaining('Riyadh'), findsOneWidget);
    expect(find.textContaining('SAR 450.50'), findsOneWidget);
    expect(find.textContaining('per person'), findsOneWidget);
    expect(find.text('Active'), findsOneWidget);

    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();

    final patch = requests.singleWhere((r) => r.method == 'PATCH');
    expect(patch.url.path, '/packages/p1');
    expect(jsonDecode(patch.body), {'isActive': false});
    expect(find.text('Paused'), findsOneWidget);
  });

  testWidgets('shows the empty state with a create button', (tester) async {
    await tester.pumpWidget(_app(_api([]), const MyToursScreen()));
    await tester.pumpAndSettle();
    expect(find.text('Create your first tour'), findsOneWidget);
  });

  testWidgets('shows the Arabic title and city in the list when the UI is Arabic', (tester) async {
    await tester.pumpWidget(_app(_api([], tours: [_tourJson(active: false)]), const MyToursScreen(), locale: const Locale('ar')));
    await tester.pumpAndSettle();
    expect(find.text('جولة الدرعية التاريخية'), findsOneWidget);
    expect(find.textContaining('الرياض'), findsOneWidget);
    expect(find.text('متوقفة'), findsOneWidget);
  });

  testWidgets('creating a tour posts minor units computed from the typed price (SAR)', (tester) async {
    _tallScreen(tester);
    final requests = <http.Request>[];
    GuideTour? result;
    await tester.pumpWidget(_app(
      _api(requests),
      Scaffold(
        body: Builder(
          builder: (context) => TextButton(
            onPressed: () async => result = await Navigator.push<GuideTour>(
              context,
              MaterialPageRoute(builder: (_) => const TourFormScreen()),
            ),
            child: const Text('open'),
          ),
        ),
      ),
    ));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    await _fillAndSave(tester, city: 'Riyadh', price: '450.5');

    final post = requests.singleWhere((r) => r.method == 'POST' && r.url.path == '/packages');
    expect(jsonDecode(post.body), {
      'cityId': 'c1',
      'title': 'Desert castles',
      'description': '',
      'durationMinutes': 120,
      'pricingType': 'PER_GROUP',
      'priceMinor': 45050,
      'maxGroupSize': 8,
      'languages': ['en'],
      'siteIds': <String>[],
      'photoKeys': <String>[],
    });
    expect(find.text('Tour created.'), findsOneWidget);
    expect(find.byType(TourFormScreen), findsNothing);
    expect(result?.id, 'new');
  });

  testWidgets('JOD prices use three decimals and sites reset when the city changes', (tester) async {
    _tallScreen(tester);
    final requests = <http.Request>[];
    await tester.pumpWidget(_app(_api(requests), const TourFormScreen()));
    await tester.pumpAndSettle();

    // Pick a Riyadh site first; switching to Amman must drop it.
    await tester.tap(find.byKey(const ValueKey('tourCity')));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Riyadh').last);
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(FilterChip, 'Site in c1'));
    await tester.pump();

    await _fillAndSave(tester, city: 'Amman', price: '12.250');

    final body = jsonDecode(requests.singleWhere((r) => r.method == 'POST').body) as Map<String, dynamic>;
    expect(body['cityId'], 'c2');
    expect(body['priceMinor'], 12250);
    expect(body['siteIds'], isEmpty);
    expect(body.containsKey('currency'), isFalse);
  });

  testWidgets('rejects a price with too many decimals', (tester) async {
    _tallScreen(tester);
    final requests = <http.Request>[];
    await tester.pumpWidget(_app(_api(requests), const TourFormScreen()));
    await tester.pumpAndSettle();
    await _fillAndSave(tester, city: 'Riyadh', price: '10.505');
    expect(find.text('Enter a price with at most 2 decimal places'), findsOneWidget);
    expect(requests.where((r) => r.method == 'POST'), isEmpty);
  });

  testWidgets('the form renders in Arabic, right to left, with fixed field directions', (tester) async {
    _tallScreen(tester);
    final tour = GuideTour.fromJson(_tourJson());
    await tester.pumpWidget(_app(_api([]), TourFormScreen(tour: tour), locale: const Locale('ar')));
    await tester.pumpAndSettle();

    expect(find.text('تعديل الجولة'), findsOneWidget);
    expect(find.text('حفظ التغييرات'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('تعديل الجولة'))), TextDirection.rtl);

    TextField field(String key) =>
        tester.widget<TextField>(find.descendant(of: find.byKey(ValueKey(key)), matching: find.byType(TextField)));
    expect(field('tourTitleAr').textDirection, TextDirection.rtl);
    expect(field('tourTitleEn').textDirection, TextDirection.ltr);
    expect(field('tourPrice').textDirection, TextDirection.ltr);
    expect(field('tourTitleAr').controller!.text, 'جولة الدرعية التاريخية');
    expect(field('tourPrice').controller!.text, '450.5');
    // The tour's existing site stays selected in its city.
    expect(tester.widget<FilterChip>(find.widgetWithText(FilterChip, 'حي الطريف')).selected, isTrue);
    expect(tester.takeException(), isNull);
  });
}
