import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/inbox_controller.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/core/token_store.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/screens/shared/push_listener.dart';
import 'package:tourguide_mobile/services/push_service.dart';
import 'package:tourguide_mobile/services/repository.dart';

class FakePush implements PushService {
  final controller = StreamController<PushEvent>.broadcast();
  int signedIn = 0, signedOut = 0;
  @override
  Stream<PushEvent> get events => controller.stream;
  @override
  Future<void> onSignedIn(Repository repo) async => signedIn++;
  @override
  Future<void> onSignedOut(Repository repo) async => signedOut++;
}

void main() {
  late List<String> calls;
  late int unread;

  Repository repo() => Repository(ApiClient(
        baseUrl: 'http://api.test',
        httpClient: MockClient((req) async {
          calls.add('${req.method} ${req.url.path}');
          if (req.url.path == '/me/notifications') {
            return http.Response(
              jsonEncode({
                'items': [
                  {
                    'id': 'n1',
                    'type': 'NEW_BOOKING',
                    'title': 'New booking',
                    'body': 'Sara booked Diriyah at Golden Hour',
                    'data': {'bookingId': 'b1', 'screen': 'booking'},
                    'createdAt': DateTime.now().toIso8601String(),
                    'readAt': null,
                  },
                ],
                'unread': unread,
              }),
              200,
            );
          }
          if (req.url.path == '/me/notifications/read') {
            unread = 0;
            return http.Response('{"updated":1}', 200);
          }
          return http.Response('{}', 200);
        }),
      ));

  setUp(() {
    calls = [];
    unread = 3;
  });

  testWidgets('bell shows unread count, inbox lists items and marks them read', (tester) async {
    final r = repo();
    final push = FakePush();
    final session = Session(r.api, r, push: push, store: MemoryTokenStore());
    await session.signIn(AuthResult(accessToken: 'jwt', refreshToken: 'rt', user: AppUser(id: 'u1', fullName: 'Faisal Al-Harbi', role: UserRole.guide)));
    expect(push.signedIn, 1);

    await tester.pumpWidget(MultiProvider(
      providers: [
        Provider.value(value: r),
        Provider<PushService>.value(value: push),
        ChangeNotifierProvider.value(value: session),
        ChangeNotifierProvider(create: (_) => InboxController(r)),
      ],
      child: MaterialApp(
        navigatorKey: appNavigatorKey,
        scaffoldMessengerKey: appMessengerKey,
        home: PushListener(child: Scaffold(appBar: AppBar(actions: const [NotificationBell()]))),
      ),
    ));
    await tester.pumpAndSettle();
    expect(find.text('3'), findsOneWidget);

    await tester.tap(find.byTooltip('Notifications'));
    await tester.pumpAndSettle();
    expect(find.text('New booking'), findsOneWidget);
    await tester.tap(find.text('Mark all read'));
    await tester.pumpAndSettle();
    expect(calls, contains('POST /me/notifications/read'));
    expect(find.text('Mark all read'), findsNothing);
  });

  testWidgets('a push received while open shows a banner and refreshes the inbox', (tester) async {
    final r = repo();
    final push = FakePush();
    final session = Session(r.api, r, push: push, store: MemoryTokenStore());
    await session.signIn(AuthResult(accessToken: 'jwt', refreshToken: 'rt', user: AppUser(id: 'u1', fullName: 'Sara Williams', role: UserRole.tourist)));

    await tester.pumpWidget(MultiProvider(
      providers: [
        Provider.value(value: r),
        Provider<PushService>.value(value: push),
        ChangeNotifierProvider.value(value: session),
        ChangeNotifierProvider(create: (_) => InboxController(r)),
      ],
      child: MaterialApp(
        navigatorKey: appNavigatorKey,
        scaffoldMessengerKey: appMessengerKey,
        home: const PushListener(child: Scaffold(body: SizedBox())),
      ),
    ));
    await tester.pumpAndSettle();
    final before = calls.where((c) => c == 'GET /me/notifications').length;

    push.controller.add(PushEvent(title: 'Booking confirmed', body: 'See you Sunday', data: {'bookingId': 'b1'}, tapped: false));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.textContaining('Booking confirmed'), findsOneWidget);
    expect(find.text('Open'), findsOneWidget);
    expect(calls.where((c) => c == 'GET /me/notifications').length, greaterThan(before));
  });

  test('sign-out unregisters the device before dropping the token', () async {
    final r = repo();
    final push = FakePush();
    final session = Session(r.api, r, push: push, store: MemoryTokenStore());
    await session.signIn(AuthResult(accessToken: 'jwt', refreshToken: 'rt', user: AppUser(id: 'u1', fullName: 'x', role: UserRole.tourist)));
    await session.signOut();
    expect(push.signedOut, 1);
    expect(r.api.token, isNull);
  });
}
