import 'package:intl/intl.dart';

/// ISO 4217 minor-unit exponents that differ from the default of 2.
const _exponents = {'JOD': 3, 'KWD': 3, 'BHD': 3, 'OMR': 3, 'TND': 3, 'JPY': 0, 'KRW': 0};

int currencyExponent(String currency) => _exponents[currency.toUpperCase()] ?? 2;

/// Formats integer minor units, e.g. (45000, 'SAR') -> 'SAR 450'.
String formatMoney(int minor, String currency) {
  final exp = currencyExponent(currency);
  final value = minor / _pow10(exp);
  final whole = value == value.roundToDouble();
  final f = NumberFormat.currency(
    name: '$currency ',
    symbol: '$currency ',
    decimalDigits: whole ? 0 : exp,
  );
  return f.format(value).trim();
}

int _pow10(int e) {
  var r = 1;
  for (var i = 0; i < e; i++) {
    r *= 10;
  }
  return r;
}

String formatDuration(int minutes) {
  final h = minutes ~/ 60;
  final m = minutes % 60;
  if (h == 0) return '${m}m';
  return m == 0 ? '${h}h' : '${h}h ${m}m';
}

String formatDateTime(DateTime d) => DateFormat('EEE d MMM, HH:mm').format(d.toLocal());
String formatDate(DateTime d) => DateFormat('d MMM yyyy').format(d.toLocal());

String titleCase(String s) =>
    s.isEmpty ? s : s.toLowerCase().split('_').map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1)).join(' ');

/// "09:30" + 210 min → "13:00"; past midnight gets a "+1d" suffix.
String addMinutesToClock(String hhmm, int minutes) {
  final parts = hhmm.split(':');
  final total = int.parse(parts[0]) * 60 + int.parse(parts[1]) + minutes;
  final day = total ~/ 1440;
  final m = total % 1440;
  final clock = '${(m ~/ 60).toString().padLeft(2, '0')}:${(m % 60).toString().padLeft(2, '0')}';
  return day > 0 ? '$clock +${day}d' : clock;
}
