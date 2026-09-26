import 'package:intl/intl.dart';

/// ISO 4217 minor-unit exponents that differ from the default of 2.
const _exponents = {'JOD': 3, 'KWD': 3, 'BHD': 3, 'OMR': 3, 'TND': 3, 'JPY': 0, 'KRW': 0};

int currencyExponent(String currency) => _exponents[currency.toUpperCase()] ?? 2;

/// Formats integer minor units, e.g. (45000, 'SAR') -> 'SAR 450'.
String formatMoney(int minor, String currency) {
  final exp = currencyExponent(currency);
  final value = minor / _pow10(exp);
  final whole = value == value.roundToDouble();
  // Western digits in every language, matching card statements and receipts.
  final f = NumberFormat.currency(
    locale: 'en',
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

bool get _arabic => Intl.getCurrentLocale().startsWith('ar');

String formatDuration(int minutes) {
  final h = minutes ~/ 60;
  final m = minutes % 60;
  final (hs, ms) = _arabic ? (' س', ' د') : ('h', 'm');
  if (h == 0) return '$m$ms';
  return m == 0 ? '$h$hs' : '$h$hs $m$ms';
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

/// Parses a price typed in major units ("450.5", "12,250", Arabic-Indic
/// digits) into integer minor units for [currency], without floating point.
/// Returns null when the text isn't a number or has more decimals than the
/// currency allows (e.g. 3 for JOD, 2 for SAR).
int? parseMajorToMinor(String input, String currency) {
  const eastern = '٠١٢٣٤٥٦٧٨٩';
  const persian = '۰۱۲۳۴۵۶۷۸۹';
  final buf = StringBuffer();
  for (final ch in input.trim().split('')) {
    final e = eastern.indexOf(ch), p = persian.indexOf(ch);
    buf.write(e >= 0 ? '$e' : p >= 0 ? '$p' : (ch == ',' || ch == '٫') ? '.' : ch);
  }
  final m = RegExp(r'^(\d+)(?:\.(\d*))?$').firstMatch(buf.toString());
  if (m == null) return null;
  final exp = currencyExponent(currency);
  final frac = m.group(2) ?? '';
  if (frac.length > exp) return null;
  final whole = int.tryParse(m.group(1)!);
  if (whole == null || m.group(1)!.length > 12) return null;
  return whole * _pow10(exp) + (frac.isEmpty ? 0 : int.parse(frac.padRight(exp, '0')));
}

/// Minor units as plain major-unit text for an input field, e.g. 45050 SAR → "450.5".
String minorToMajorText(int minor, String currency) {
  final exp = currencyExponent(currency);
  final div = _pow10(exp);
  final whole = minor ~/ div;
  if (exp == 0) return '$whole';
  final frac = (minor % div).toString().padLeft(exp, '0').replaceFirst(RegExp(r'0+$'), '');
  return frac.isEmpty ? '$whole' : '$whole.$frac';
}
