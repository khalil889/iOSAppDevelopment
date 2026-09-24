import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../core/firebase_config.dart';
import 'repository.dart';

/// A notification the app received while open, or that the user tapped.
class PushEvent {
  PushEvent({required this.title, required this.body, required this.data, required this.tapped});
  final String title, body;
  final Map<String, String> data;

  /// True when the user opened the app from the notification.
  final bool tapped;
}

/// Registers the device for push and reports incoming messages.
abstract class PushService {
  Stream<PushEvent> get events;
  Future<void> onSignedIn(Repository repo);
  Future<void> onSignedOut(Repository repo);
}

/// Used when Firebase isn't configured: in-app inbox only.
class DisabledPushService implements PushService {
  @override
  Stream<PushEvent> get events => const Stream.empty();
  @override
  Future<void> onSignedIn(Repository repo) async {}
  @override
  Future<void> onSignedOut(Repository repo) async {}
}

/// Firebase Cloud Messaging (Android, and iOS through APNs).
class FirebasePushService implements PushService {
  FirebasePushService._();

  final _events = StreamController<PushEvent>.broadcast();
  StreamSubscription<String>? _refresh;
  String? _token;

  /// Initialises Firebase; falls back to [DisabledPushService] if it isn't
  /// configured or fails to start, so the app always runs.
  static Future<PushService> create() async {
    final options = FirebaseConfig.currentPlatform;
    if (options == null) return DisabledPushService();
    try {
      await Firebase.initializeApp(options: options);
      final service = FirebasePushService._();
      FirebaseMessaging.onMessage.listen((m) => service._emit(m, tapped: false));
      FirebaseMessaging.onMessageOpenedApp.listen((m) => service._emit(m, tapped: true));
      final initial = await FirebaseMessaging.instance.getInitialMessage();
      if (initial != null) scheduleMicrotask(() => service._emit(initial, tapped: true));
      return service;
    } catch (e) {
      debugPrint('Push disabled: $e');
      return DisabledPushService();
    }
  }

  void _emit(RemoteMessage m, {required bool tapped}) {
    _events.add(PushEvent(
      title: m.notification?.title ?? '',
      body: m.notification?.body ?? '',
      data: m.data.map((k, v) => MapEntry(k, '$v')),
      tapped: tapped,
    ));
  }

  @override
  Stream<PushEvent> get events => _events.stream;

  @override
  Future<void> onSignedIn(Repository repo) async {
    try {
      final settings = await FirebaseMessaging.instance.requestPermission();
      if (settings.authorizationStatus == AuthorizationStatus.denied) return;
      _token = await FirebaseMessaging.instance.getToken();
      if (_token != null) await repo.registerDevice(_token!, _platform);
      await _refresh?.cancel();
      _refresh = FirebaseMessaging.instance.onTokenRefresh.listen((t) async {
        _token = t;
        await repo.registerDevice(t, _platform).catchError((_) {});
      });
    } catch (e) {
      debugPrint('Push registration failed: $e');
    }
  }

  @override
  Future<void> onSignedOut(Repository repo) async {
    await _refresh?.cancel();
    final token = _token;
    _token = null;
    if (token != null) await repo.unregisterDevice(token).catchError((_) {});
  }

  static String get _platform => defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';
}
