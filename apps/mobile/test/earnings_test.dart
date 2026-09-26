import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/iban.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/core/token_store.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/screens/guide/earnings_screen.dart';
import 'package:tourguide_mobile/screens/guide/guide_dashboard_screen.dart';
import 'package:tourguide_mobile/screens/guide/identity_card.dart';
import 'package:tourguide_mobile/screens/shared/push_listener.dart';
import 'package:tourguide_mobile/services/repository.dart';
import 'helpers.dart';

const _validIban = 'SA0380000000608010167519';

final _account = {
  'holderName': 'Faisal Al-Harbi',
  'ibanMasked': 'SA03 •••• 7519',
  'bankName': 'Al Rajhi Bank',
  'updatedAt': '2026-09-01T10:00:00Z',
};

Map<String, dynamic> _earnings({bool withAccount = true, bool empty = false}) => {
      'account': withAccount ? _account : null,
      'owed': empty
          ? []
          : [
              {'currency': 'SAR', 'amountMinor': 125000, 'paymentCount': 3},
              {'currency': 'JOD', 'amountMinor': 12250, 'paymentCount': 1},
            ],
      'payouts': empty
          ? []
          : [
              {
                'id': 'po1',
                'amountMinor': 38250,
                'currency': 'SAR',
                'paymentCount': 2,
                'status': 'PAID',
                'ibanMasked': 'SA03 •••• 7519',
                'note': 'TRX-9981',
                'paidAt': '2026-09-20T09:00:00Z',
                'createdAt': '2026-09-19T09:00:00Z',
              },
              {
                'id': 'po2',
                'amountMinor': 50000,
                'currency': 'SAR',
                'paymentCount': 1,
                'status': 'PENDING',
                'ibanMasked': 'SA03 •••• 7519',
                'note': null,
                'paidAt': null,
                'createdAt': '2026-09-25T09:00:00Z',
              },
              {
                // Paid, then returned by the bank.
                'id': 'po3',
                'amountMinor': 20000,
                'currency': 'SAR',
                'paymentCount': 4,
                'status': 'FAILED',
                'ibanMasked': 'SA44 •••• 1111',
                'note': 'Returned by the bank: account closed',
                'paidAt': '2026-08-10T09:00:00Z',
                'createdAt': '2026-08-09T09:00:00Z',
              },
            ],
    };

http.Response _json(Object? body, [int status = 200]) => http.Response.bytes(
      utf8.encode(jsonEncode(body)),
      status,
      headers: {'content-type': 'application/json; charset=utf-8'},
    );

class _FakeApi {
  _FakeApi({this.earnings, this.identityStatus = 'NOT_STARTED', this.startResponse});

  Map<String, dynamic>? earnings;
  String identityStatus;
  Map<String, dynamic>? startResponse;
  final requests = <http.Request>[];

  MockClient get client => MockClient((req) async {
        requests.add(req);
        final path = req.url.path;
        if (req.method == 'GET' && path == '/guides/me/earnings') return _json(earnings ?? _earnings());
        if (req.method == 'PUT' && path == '/guides/me/payout-account') {
          final body = jsonDecode(req.body) as Map<String, dynamic>;
          final saved = {
            'holderName': body['holderName'],
            'ibanMasked': 'SA03 •••• ${(body['iban'] as String).substring(20)}',
            'bankName': body['bankName'],
            'updatedAt': DateTime.now().toUtc().toIso8601String(),
          };
          earnings = {...(earnings ?? _earnings()), 'account': saved};
          return _json(saved);
        }
        if (req.method == 'POST' && path == '/guides/me/identity') {
          final res = startResponse ?? {'status': 'APPROVED', 'url': null};
          identityStatus = res['status'] as String;
          return _json(res, 201);
        }
        if (req.method == 'GET' && path == '/guides/me') {
          return _json({
            'id': 'g1',
            'identityStatus': identityStatus,
            'identityCheckedAt': null,
            'identityReview': identityStatus == 'RETRY' ? {'labels': ['BAD_PHOTO'], 'comment': 'The photo was blurry.'} : null,
          });
        }
        if (req.method == 'GET' && path == '/guides/me/dashboard') {
          return _json({
            'guide': {'name': 'Faisal', 'verificationStatus': 'DRAFT', 'ratingAvg': 0, 'ratingCount': 0},
            'stats': {},
            'earnings': [
              {'currency': 'SAR', 'releasedMinor': 100000, 'heldMinor': 0},
            ],
            'upcoming': [],
          });
        }
        return _json({'message': 'unexpected ${req.method} $path'}, 404);
      });
}

Widget _app(_FakeApi api, Widget home, {Locale locale = const Locale('en')}) {
  final client = ApiClient(httpClient: api.client, baseUrl: 'http://api.test');
  final repo = Repository(client);
  return MultiProvider(
    providers: [
      Provider.value(value: repo),
      ChangeNotifierProvider(create: (_) => Session(client, repo, store: MemoryTokenStore())),
    ],
    child: localizedApp(home, locale: locale),
  );
}

void _tallScreen(WidgetTester tester) {
  tester.view.physicalSize = const Size(900, 2400);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
}

void main() {
  group('IBAN validation', () {
    test('accepts a valid Saudi IBAN, with or without grouping and in lower case', () {
      expect(validateIban(_validIban), isNull);
      expect(isValidIban('sa03 8000 0000 6080 1016 7519'), isTrue);
      expect(isValidIban('SA03-8000-0000-6080-1016-7519'), isTrue);
      expect(isValidIban('GB82 WEST 1234 5698 7654 32'), isTrue);
      expect(normalizeIban(' sa03 8000 0000 6080 1016 7519 '), _validIban);
      // Arabic-Indic digits typed on an Arabic keyboard.
      expect(normalizeIban('SA٠٣٨٠٠٠٠٠٠٠٦٠٨٠١٠١٦٧٥١٩'), _validIban);
    });

    test('rejects a wrong checksum', () {
      expect(validateIban('SA0380000000608010167518'), IbanError.checksum);
      expect(validateIban('SA1380000000608010167519'), IbanError.checksum);
    });

    test('rejects a wrong length for the country', () {
      expect(validateIban('SA03800000006080101675'), IbanError.length);
      expect(validateIban('${_validIban}1'), IbanError.length);
    });

    test('rejects empty input and a missing country code', () {
      expect(validateIban('   '), IbanError.empty);
      expect(validateIban('0380000000608010167519'), IbanError.format);
      expect(validateIban('SAXX80000000608010167519'), IbanError.format);
    });

    test('groups in blocks of four while typing', () {
      final f = IbanInputFormatter();
      TextEditingValue type(String text) =>
          f.formatEditUpdate(TextEditingValue.empty, TextEditingValue(text: text, selection: TextSelection.collapsed(offset: text.length)));
      expect(type('sa0380000').text, 'SA03 8000 0');
      expect(type('sa0380000').selection.baseOffset, 'SA03 8000 0'.length);
      expect(type('SA0380000000608010167519').text, 'SA03 8000 0000 6080 1016 7519');
      // Backspace right after a grouping space removes the digit before it.
      const old = TextEditingValue(text: 'SA03 8', selection: TextSelection.collapsed(offset: 5));
      final next = f.formatEditUpdate(old, const TextEditingValue(text: 'SA038', selection: TextSelection.collapsed(offset: 4)));
      expect(next.text, 'SA08');
    });
  });

  testWidgets('earnings screen shows owed balances, the masked account and payout history', (tester) async {
    _tallScreen(tester);
    final api = _FakeApi();
    await tester.pumpWidget(_app(api, const EarningsScreen()));
    await tester.pumpAndSettle();

    expect(find.text('Earnings & payouts'), findsOneWidget);
    expect(find.textContaining('SAR 1,250'), findsOneWidget);
    expect(find.textContaining('JOD 12.250'), findsOneWidget);
    expect(find.text('From 3 tour payments'), findsOneWidget);
    expect(find.text('From 1 tour payment'), findsWidgets);

    final iban = tester.widget<Text>(find.byKey(const ValueKey('ibanMasked')));
    expect(iban.data, 'SA03 •••• 7519');
    expect(iban.textDirection, TextDirection.ltr);
    expect(find.text('Faisal Al-Harbi'), findsOneWidget);
    expect(find.text('Al Rajhi Bank'), findsOneWidget);
    expect(find.text('Change bank account'), findsOneWidget);

    expect(find.text('Payout history'), findsOneWidget);
    expect(find.textContaining('SAR 382.50'), findsOneWidget);
    expect(find.text('Paid'), findsOneWidget);
    expect(find.text('Processing'), findsOneWidget);
    expect(find.textContaining('Paid on'), findsOneWidget);
    expect(find.textContaining('20 Sep 2026'), findsOneWidget);
    expect(find.textContaining('TRX-9981'), findsOneWidget);
    expect(find.text('Failed'), findsOneWidget);
    expect(find.textContaining('Returned by the bank: account closed'), findsOneWidget);
    // Old account details aren't on hold.
    expect(find.byKey(const ValueKey('payoutAccountHeld')), findsNothing);
  });

  testWidgets('earnings screen empty states ask for a bank account', (tester) async {
    _tallScreen(tester);
    final api = _FakeApi(earnings: _earnings(withAccount: false, empty: true));
    await tester.pumpWidget(_app(api, const EarningsScreen()));
    await tester.pumpAndSettle();

    expect(find.text('Nothing is waiting to be paid out right now.'), findsOneWidget);
    expect(find.text('No payouts yet.'), findsOneWidget);
    expect(find.text('Add your bank account so we can send you your earnings.'), findsOneWidget);
    expect(find.text('Add bank account'), findsOneWidget);
  });

  testWidgets('saving the bank account sends the normalized IBAN and refreshes', (tester) async {
    _tallScreen(tester);
    final api = _FakeApi(earnings: _earnings(withAccount: false));
    await tester.pumpWidget(_app(api, const EarningsScreen()));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Add bank account'));
    await tester.pumpAndSettle();
    expect(find.textContaining('only the last 4 digits'), findsOneWidget);
    final ibanField = tester.widget<TextField>(
      find.descendant(of: find.byKey(const ValueKey('payoutIban')), matching: find.byType(TextField)),
    );
    expect(ibanField.textDirection, TextDirection.ltr);

    // Client-side validation first: wrong checksum is not sent.
    await tester.enterText(find.byKey(const ValueKey('payoutHolder')), 'Faisal Al-Harbi');
    await tester.enterText(find.byKey(const ValueKey('payoutIban')), 'sa03 8000 0000 6080 1016 7518');
    await tester.tap(find.text('Save bank account'));
    await tester.pumpAndSettle();
    expect(find.text("This IBAN isn't valid. Check it for typos."), findsOneWidget);
    await tester.enterText(find.byKey(const ValueKey('payoutIban')), 'sa03 8000 0000 6080 1016');
    await tester.tap(find.text('Save bank account'));
    await tester.pumpAndSettle();
    expect(find.text('A SA IBAN has 24 characters'), findsOneWidget);
    expect(api.requests.where((r) => r.method == 'PUT'), isEmpty);

    await tester.enterText(find.byKey(const ValueKey('payoutIban')), 'sa03 8000 0000 6080 1016 7519');
    expect(ibanField.controller!.text, 'SA03 8000 0000 6080 1016 7519');
    await tester.enterText(find.byKey(const ValueKey('payoutBank')), 'Al Rajhi Bank');
    await tester.tap(find.text('Save bank account'));
    await tester.pumpAndSettle();

    final put = api.requests.singleWhere((r) => r.method == 'PUT');
    expect(put.url.path, '/guides/me/payout-account');
    expect(jsonDecode(put.body), {'holderName': 'Faisal Al-Harbi', 'iban': _validIban, 'bankName': 'Al Rajhi Bank'});
    // Back on the earnings screen, reloaded with the masked account.
    expect(find.textContaining('payouts to new bank details start after 24 hours'), findsOneWidget);
    // The fresh details are on hold for 24 hours; the card says so.
    expect(find.byKey(const ValueKey('payoutAccountHeld')), findsOneWidget);
    expect(api.requests.where((r) => r.url.path == '/guides/me/earnings'), hasLength(2));
    expect(tester.widget<Text>(find.byKey(const ValueKey('ibanMasked'))).data, 'SA03 •••• 7519');
  });

  testWidgets('API errors (e.g. INVALID_IBAN) are shown as sent by the server', (tester) async {
    final api = MockClient((req) async => _json({'error': 'INVALID_IBAN', 'message': 'رقم الآيبان غير صالح'}, 400));
    final repo = Repository(ApiClient(httpClient: api, baseUrl: 'http://api.test'));
    await expectLater(
      repo.savePayoutAccount(holderName: 'Faisal', iban: _validIban),
      throwsA(isA<ApiException>().having((e) => e.code, 'code', 'INVALID_IBAN').having((e) => e.message, 'message', 'رقم الآيبان غير صالح')),
    );
  });

  group('identity card', () {
    Future<void> pumpCard(WidgetTester tester, _FakeApi api, IdentityStatus status, {String? comment, UrlOpener? open, VoidCallback? onChanged}) async {
      await tester.pumpWidget(_app(
        api,
        Scaffold(body: SingleChildScrollView(child: IdentityCard(status: status, comment: comment, openUrl: open, onChanged: onChanged))),
      ));
      await tester.pumpAndSettle();
    }

    testWidgets('shows the right label and action per status', (tester) async {
      final cases = {
        IdentityStatus.notStarted: ('Not started', 'Verify my identity'),
        IdentityStatus.pending: ('In review', null),
        IdentityStatus.approved: ('Verified', null),
        IdentityStatus.retry: ('Needs another try', 'Try again'),
        IdentityStatus.rejected: ('Rejected', null),
      };
      for (final MapEntry(key: status, value: (label, action)) in cases.entries) {
        await pumpCard(tester, _FakeApi(), status, comment: 'The photo was blurry.');
        expect(find.text(label), findsOneWidget, reason: '$status');
        if (action == null) {
          expect(find.byType(FilledButton), findsNothing, reason: '$status');
        } else {
          expect(find.widgetWithText(FilledButton, action), findsOneWidget, reason: '$status');
        }
        expect(find.text('Note: The photo was blurry.'), status == IdentityStatus.retry ? findsOneWidget : findsNothing);
      }
      await pumpCard(tester, _FakeApi(), IdentityStatus.rejected);
      expect(find.textContaining('contact support'), findsOneWidget);
      await pumpCard(tester, _FakeApi(), IdentityStatus.notStarted);
      expect(find.textContaining('about 3 minutes'), findsOneWidget);
    });

    testWidgets('starting with the stub provider updates to Verified', (tester) async {
      final api = _FakeApi();
      var changed = 0;
      await pumpCard(tester, api, IdentityStatus.notStarted, onChanged: () => changed++, open: (_) async => fail('no url to open'));
      await tester.tap(find.text('Verify my identity'));
      await tester.pumpAndSettle();

      expect(api.requests.where((r) => r.method == 'POST' && r.url.path == '/guides/me/identity'), hasLength(1));
      expect(find.text('Verified'), findsOneWidget);
      expect(find.byType(FilledButton), findsNothing);
      expect(changed, 1);
    });

    testWidgets('opens the hosted verification link when the provider returns one', (tester) async {
      final api = _FakeApi(startResponse: {'status': 'NOT_STARTED', 'url': 'https://verify.example.com/s/abc'});
      final opened = <Uri>[];
      await pumpCard(tester, api, IdentityStatus.retry, open: (u) async {
        opened.add(u);
        return true;
      });
      await tester.tap(find.text('Try again'));
      await tester.pumpAndSettle();
      expect(opened, [Uri.parse('https://verify.example.com/s/abc')]);
      expect(find.textContaining('come back here'), findsOneWidget);
    });
  });

  testWidgets('dashboard shows the identity card from /guides/me, re-reads on resume and links to earnings', (tester) async {
    _tallScreen(tester);
    final api = _FakeApi(identityStatus: 'RETRY');
    await tester.pumpWidget(_app(api, const GuideDashboardScreen()));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('identityCard')), findsOneWidget);
    expect(find.text('Needs another try'), findsOneWidget);
    expect(find.text('Note: The photo was blurry.'), findsOneWidget);

    // Webhook approved it while the guide was in the browser.
    api.identityStatus = 'APPROVED';
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.paused);
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pumpAndSettle();
    expect(find.text('Verified'), findsOneWidget);

    await tester.tap(find.text('Earnings & payouts'));
    await tester.pumpAndSettle();
    expect(find.byType(EarningsScreen), findsOneWidget);
  });

  test('earnings and dashboard notifications have a tap target', () {
    expect(hasNotificationTarget({'screen': 'earnings'}), isTrue);
    expect(hasNotificationTarget({'screen': 'dashboard'}), isTrue);
    expect(hasNotificationTarget({'bookingId': 'b1'}), isTrue);
    expect(hasNotificationTarget({}), isFalse);
  });

  testWidgets('earnings render in Arabic, right to left, with LTR amounts and IBAN', (tester) async {
    _tallScreen(tester);
    await tester.pumpWidget(_app(_FakeApi(), const EarningsScreen(), locale: const Locale('ar')));
    await tester.pumpAndSettle();

    expect(find.text('الأرباح والتحويلات'), findsOneWidget);
    expect(Directionality.of(tester.element(find.text('بانتظار التحويل'))), TextDirection.rtl);
    expect(find.text('من 3 دفعات جولات'), findsOneWidget);
    expect(find.text('سجل التحويلات'), findsOneWidget);
    expect(find.text('تم التحويل'), findsOneWidget);
    expect(find.text('قيد التنفيذ'), findsOneWidget);
    expect(find.text('تغيير الحساب البنكي'), findsOneWidget);
    // Amounts are wrapped in an LTR isolate; the IBAN is laid out LTR.
    expect(find.text('\u2066SAR 1,250\u2069'), findsOneWidget);
    expect(tester.widget<Text>(find.byKey(const ValueKey('ibanMasked'))).textDirection, TextDirection.ltr);
    expect(tester.takeException(), isNull);
  });
}
