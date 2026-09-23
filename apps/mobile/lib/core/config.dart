/// Build-time configuration. Override with:
///   flutter run --dart-define=API_URL=http://10.0.2.2:3000/api
class AppConfig {
  static const apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://localhost:3000/api',
  );
}
