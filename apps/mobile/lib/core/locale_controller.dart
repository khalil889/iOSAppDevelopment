import 'package:flutter/widgets.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';

import 'api_client.dart';

/// Remembers the chosen app language between launches.
abstract class LocaleStore {
  Future<String?> read();
  Future<void> write(String? languageCode);
}

class SecureLocaleStore implements LocaleStore {
  static const _key = 'app_locale';
  final _storage = const FlutterSecureStorage();

  @override
  Future<String?> read() => _storage.read(key: _key);

  @override
  Future<void> write(String? languageCode) =>
      languageCode == null ? _storage.delete(key: _key) : _storage.write(key: _key, value: languageCode);
}

class MemoryLocaleStore implements LocaleStore {
  MemoryLocaleStore([this.value]);
  String? value;

  @override
  Future<String?> read() async => value;

  @override
  Future<void> write(String? languageCode) async => value = languageCode;
}

/// App language: English or Arabic (RTL). `null` follows the device.
///
/// The API is told the language through `Accept-Language`, so content
/// (site and tour names) and error messages come back translated.
class LocaleController extends ChangeNotifier {
  LocaleController(this.api, {LocaleStore? store}) : store = store ?? SecureLocaleStore();

  static const supported = [Locale('en'), Locale('ar')];

  final ApiClient api;
  final LocaleStore store;

  /// The user's explicit choice; null means "device language".
  Locale? override;

  /// The language actually in use, resolved against the device.
  Locale current = const Locale('en');

  /// Called after the user picks a language (e.g. to save it on their profile).
  Future<void> Function(String languageCode)? onChanged;

  Future<void> restore() async {
    try {
      final code = await store.read();
      if (code != null) override = Locale(code);
    } catch (_) {}
    _apply(resolve(WidgetsBinding.instance.platformDispatcher.locales));
  }

  Future<void> choose(Locale? locale) async {
    override = locale;
    await store.write(locale?.languageCode).catchError((_) {});
    _apply(resolve(WidgetsBinding.instance.platformDispatcher.locales));
    await onChanged?.call(current.languageCode).catchError((_) {});
  }

  /// Picks the language for a list of device locales (used by MaterialApp too).
  Locale resolve(List<Locale>? device) {
    if (override != null) return override!;
    for (final l in device ?? const <Locale>[]) {
      if (l.languageCode == 'ar') return const Locale('ar');
      if (l.languageCode == 'en') return const Locale('en');
    }
    return const Locale('en');
  }

  /// Keeps API headers and intl formatting in step with the UI language.
  void sync(Locale locale) => _apply(locale, notify: false);

  void _apply(Locale locale, {bool notify = true}) {
    current = locale;
    api.language = locale.languageCode;
    Intl.defaultLocale = locale.languageCode;
    if (notify) notifyListeners();
  }
}
