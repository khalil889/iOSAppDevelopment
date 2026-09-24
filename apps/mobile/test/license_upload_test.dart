import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:tourguide_mobile/core/api_client.dart';
import 'package:tourguide_mobile/services/repository.dart';

void main() {
  test('uploadLicense gets a signed URL, PUTs the bytes without the bearer token, returns the key', () async {
    final requests = <http.Request>[];
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async {
        requests.add(req);
        if (req.url.path == '/guides/me/license-upload') {
          return http.Response(
            jsonEncode({
              'uploadUrl': 'https://bucket.r2.test/licenses/g1/abc.jpg?X-Amz-Signature=sig',
              'method': 'PUT',
              'headers': {'content-type': 'image/jpeg'},
              'key': 'licenses/g1/abc.jpg',
            }),
            201,
          );
        }
        return http.Response('', 200);
      }),
    )..token = 'jwt-token';

    final key = await Repository(api).uploadLicense([1, 2, 3, 4], 'image/jpeg');

    expect(key, 'licenses/g1/abc.jpg');
    expect(jsonDecode(requests[0].body), {'contentType': 'image/jpeg', 'sizeBytes': 4});
    expect(requests[0].headers['authorization'], 'Bearer jwt-token');
    final put = requests[1];
    expect(put.method, 'PUT');
    expect(put.url.host, 'bucket.r2.test');
    expect(put.bodyBytes, [1, 2, 3, 4]);
    expect(put.headers['content-type'], startsWith('image/jpeg'));
    expect(put.headers.containsKey('authorization'), isFalse);
  });

  test('a rejected upload surfaces an error', () async {
    final api = ApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((req) async => req.url.path == '/guides/me/license-upload'
          ? http.Response(jsonEncode({'uploadUrl': 'https://s3.test/x', 'headers': {'content-type': 'image/png'}, 'key': 'k'}), 201)
          : http.Response('<Error>SignatureDoesNotMatch</Error>', 403)),
    );
    expect(() => Repository(api).uploadLicense([1], 'image/png'), throwsA(isA<ApiException>()));
  });
}
