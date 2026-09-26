import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/core/session.dart';
import 'package:tourguide_mobile/core/token_store.dart';
import 'package:tourguide_mobile/models/models.dart';
import 'package:tourguide_mobile/services/repository.dart';

void main() {
  late int refreshCalls;
  late String validToken;
  late bool refreshWorks;

  ApiClient client() => ApiClient(
        baseUrl: 'http://api.test',
        httpClient: MockClient((req) async {
          if (req.url.path == '/auth/refresh') {
            refreshCalls++;
            await Future<void>.delayed(const Duration(milliseconds: 20));
            if (!refreshWorks) return http.Response('{"statusCode":401}', 401);
            validToken = 'access-$refreshCalls';
            return http.Response(jsonEncode({'accessToken': validToken, 'refreshToken': 'refresh-$refreshCalls', 'expiresIn': 900}), 200);
          }
          if (req.url.path == '/auth/logout') return http.Response('{"signedOut":true}', 200);
          if (req.headers['authorization'] != 'Bearer $validToken') {
            return http.Response('{"statusCode":401,"message":"Unauthorized"}', 401);
          }
          return http.Response(jsonEncode({'id': 'u1', 'fullName': 'Sara Williams', 'role': 'TOURIST'}), 200);
        }),
      );

  setUp(() {
    refreshCalls = 0;
    validToken = 'fresh';
    refreshWorks = true;
  });

  test('an expired access token is refreshed once and the request replayed', () async {
    final api = client();
    final store = MemoryTokenStore();
    final session = Session(api, Repository(api), store: store);
    await store.write('expired', 'refresh-0');

    await session.restore();

    expect(session.user?.fullName, 'Sara Williams');
    expect(refreshCalls, 1);
    expect(store.tokens, (accessToken: 'access-1', refreshToken: 'refresh-1'));
  });

  test('parallel requests share a single refresh (refresh tokens are single-use)', () async {
    final api = client()
      ..token = 'expired'
      ..refreshToken = 'refresh-0';
    final repo = Repository(api);
    final users = await Future.wait([repo.me(), repo.me(), repo.me()]);
    expect(users.map((u) => u.id), everyElement('u1'));
    expect(refreshCalls, 1);
  });

  test('a failed refresh signs the user out', () async {
    refreshWorks = false;
    final api = client();
    final store = MemoryTokenStore();
    final session = Session(api, Repository(api), store: store);
    await session.signIn(AuthResult(
      accessToken: 'expired',
      refreshToken: 'revoked',
      user: AppUser(id: 'u1', fullName: 'Sara', role: UserRole.tourist),
    ));

    await expectLater(session.refreshUser(), throwsA(isA<ApiException>()));
    expect(session.isSignedIn, isFalse);
    expect(store.tokens, isNull);
  });

  test('sign-out revokes the refresh token and clears storage', () async {
    final requests = <String>[];
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async {
        requests.add('${req.method} ${req.url.path} ${req.body}');
        return http.Response('{}', 200);
      }),
    );
    final store = MemoryTokenStore();
    final session = Session(api, Repository(api), store: store);
    await session.signIn(AuthResult(accessToken: 'a', refreshToken: 'r', user: AppUser(id: 'u', fullName: 'x', role: UserRole.guide)));
    await session.signOut();
    expect(requests.single, 'POST /auth/logout {"refreshToken":"r"}');
    expect(store.tokens, isNull);
    expect(api.token, isNull);
  });
}
