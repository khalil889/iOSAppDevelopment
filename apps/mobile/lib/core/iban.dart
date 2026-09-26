import 'package:flutter/services.dart';

/// IBAN lengths for the markets we pay out in (mirrors the API's list).
const ibanLengths = <String, int>{
  'SA': 24, 'AE': 23, 'EG': 29, 'JO': 30, 'KW': 30, 'BH': 22, 'QA': 29, 'OM': 23,
  'GB': 22, 'DE': 22, 'FR': 27, 'TR': 26,
};

/// Why an IBAN was rejected on the device, so the form can say what to fix.
enum IbanError { empty, format, length, checksum }

const _eastern = '٠١٢٣٤٥٦٧٨٩';
const _persian = '۰۱۲۳۴۵۶۷۸۹';

/// Upper-cases, converts Arabic-Indic digits and drops spaces, dashes and
/// anything else that isn't a letter or digit: "sa03 8000-…" → "SA038000…".
String normalizeIban(String raw) {
  final buf = StringBuffer();
  for (final ch in raw.toUpperCase().split('')) {
    final e = _eastern.indexOf(ch), p = _persian.indexOf(ch);
    final c = e >= 0 ? '$e' : p >= 0 ? '$p' : ch;
    if (RegExp(r'[A-Z0-9]').hasMatch(c)) buf.write(c);
  }
  return buf.toString();
}

/// Groups a (normalized) IBAN in blocks of four for display: "SA03 8000 …".
String groupIban(String iban) {
  final buf = StringBuffer();
  for (var i = 0; i < iban.length; i++) {
    if (i > 0 && i % 4 == 0) buf.write(' ');
    buf.write(iban[i]);
  }
  return buf.toString();
}

/// Checks the country code, the length for known countries and the ISO 13616
/// mod-97 checksum. Returns null when the IBAN is valid.
IbanError? validateIban(String raw) {
  final iban = normalizeIban(raw);
  if (iban.isEmpty) return IbanError.empty;
  if (!RegExp(r'^[A-Z]{2}\d{2}').hasMatch(iban)) return IbanError.format;
  final expected = ibanLengths[iban.substring(0, 2)];
  if (expected != null ? iban.length != expected : (iban.length < 15 || iban.length > 34)) return IbanError.length;
  final rearranged = iban.substring(4) + iban.substring(0, 4);
  var remainder = 0;
  for (final unit in rearranged.codeUnits) {
    // Letters become two digits: A=10 … Z=35.
    final value = unit <= 57 ? unit - 48 : unit - 55;
    remainder = (value < 10 ? remainder * 10 + value : remainder * 100 + value) % 97;
  }
  return remainder == 1 ? null : IbanError.checksum;
}

bool isValidIban(String raw) => validateIban(raw) == null;

/// Upper-cases and groups the IBAN in blocks of four while typing, keeping the
/// cursor next to the character it was on.
class IbanInputFormatter extends TextInputFormatter {
  static const maxLength = 34;

  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var raw = normalizeIban(newValue.text);
    final cursor = newValue.selection.end.clamp(0, newValue.text.length);
    var before = normalizeIban(newValue.text.substring(0, cursor)).length;
    // Backspace over a grouping space: delete the character before it instead.
    if (raw == normalizeIban(oldValue.text) && newValue.text.length < oldValue.text.length && before > 0) {
      raw = raw.substring(0, before - 1) + raw.substring(before);
      before--;
    }
    if (raw.length > maxLength) raw = raw.substring(0, maxLength);
    if (before > raw.length) before = raw.length;
    final text = groupIban(raw);
    final offset = before == 0 ? 0 : before + (before - 1) ~/ 4;
    return TextEditingValue(text: text, selection: TextSelection.collapsed(offset: offset));
  }
}
