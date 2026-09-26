import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

/// Firebase settings passed at build time, e.g.
///   flutter run --dart-define-from-file=firebase.json
/// Leaving them empty builds an app with push notifications switched off,
/// so local development and CI need no Firebase project.
class FirebaseConfig {
  static const _projectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
  static const _senderId = String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID');
  static const _androidApiKey = String.fromEnvironment('FIREBASE_ANDROID_API_KEY');
  static const _androidAppId = String.fromEnvironment('FIREBASE_ANDROID_APP_ID');
  static const _iosApiKey = String.fromEnvironment('FIREBASE_IOS_API_KEY');
  static const _iosAppId = String.fromEnvironment('FIREBASE_IOS_APP_ID');
  static const _iosBundleId = String.fromEnvironment('FIREBASE_IOS_BUNDLE_ID');

  /// Options for the current platform, or null when push isn't configured.
  static FirebaseOptions? get currentPlatform {
    if (_projectId.isEmpty || _senderId.isEmpty || kIsWeb) return null;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        if (_androidApiKey.isEmpty || _androidAppId.isEmpty) return null;
        return const FirebaseOptions(
          apiKey: _androidApiKey,
          appId: _androidAppId,
          messagingSenderId: _senderId,
          projectId: _projectId,
        );
      case TargetPlatform.iOS:
        if (_iosApiKey.isEmpty || _iosAppId.isEmpty) return null;
        return const FirebaseOptions(
          apiKey: _iosApiKey,
          appId: _iosAppId,
          messagingSenderId: _senderId,
          projectId: _projectId,
          iosBundleId: _iosBundleId,
        );
      default:
        return null;
    }
  }
}
