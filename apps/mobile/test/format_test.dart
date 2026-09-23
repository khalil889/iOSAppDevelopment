import 'package:flutter_test/flutter_test.dart';
import 'package:tourguide_mobile/core/format.dart';

void main() {
  group('formatMoney', () {
    test('uses 2 decimals by default and hides .00', () {
      expect(formatMoney(45000, 'SAR'), 'SAR 450');
      expect(formatMoney(45050, 'SAR'), 'SAR 450.50');
    });

    test('respects 3-decimal currencies', () {
      expect(currencyExponent('JOD'), 3);
      expect(formatMoney(90000, 'JOD'), 'JOD 90');
      expect(formatMoney(90500, 'JOD'), 'JOD 90.500');
    });

    test('groups thousands', () {
      expect(formatMoney(250000000, 'EGP'), 'EGP 2,500,000');
    });
  });

  test('formatDuration', () {
    expect(formatDuration(45), '45m');
    expect(formatDuration(180), '3h');
    expect(formatDuration(210), '3h 30m');
  });

  test('titleCase', () {
    expect(titleCase('IN_PROGRESS'), 'In Progress');
    expect(titleCase('HERITAGE'), 'Heritage');
  });
}
