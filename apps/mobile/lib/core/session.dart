import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/push_service.dart';
import '../services/repository.dart';
import 'api_client.dart';
import 'token_store.dart';

/// Holds the signed-in user and tokens; persists them in secure storage.
class Session extends ChangeNotifier {
  Session(this.api, this.repo, {PushService? push, TokenStore? store})
      : push = push ?? DisabledPushService(),
        store = store ?? SecureTokenStore() {
    api.onUnauthorized = _expired;
    api.onTokensRefreshed = this.store.write;
  }

  final ApiClient api;
  final Repository repo;
  final PushService push;
  final TokenStore store;

  AppUser? user;
  bool restoring = true;

  bool get isSignedIn => user != null;
  bool get isGuide => user?.role == UserRole.guide;

  Future<void> restore() async {
    try {
      final saved = await store.read();
      if (saved != null) {
        api.token = saved.accessToken;
        api.refreshToken = saved.refreshToken;
        user = await repo.me(); // refreshes transparently if the access token expired
        push.onSignedIn(repo);
      }
    } catch (_) {
      await _clear();
    } finally {
      restoring = false;
      notifyListeners();
    }
  }

  Future<void> signIn(AuthResult auth) async {
    api.token = auth.accessToken;
    api.refreshToken = auth.refreshToken;
    user = auth.user;
    await store.write(auth.accessToken, auth.refreshToken);
    notifyListeners();
    push.onSignedIn(repo);
  }

  Future<void> refreshUser() async {
    user = await repo.me();
    notifyListeners();
  }

  /// Signs out this device: unregisters push and revokes the refresh token.
  Future<void> signOut() async {
    if (api.token != null) {
      await push.onSignedOut(repo);
      final refresh = api.refreshToken;
      if (refresh != null) await repo.logout(refresh).catchError((_) {});
    }
    await _clear();
    notifyListeners();
  }

  /// Signs out every device (e.g. after losing a phone).
  Future<void> signOutEverywhere() async {
    await repo.logoutAll();
    await signOut();
  }

  Future<void> _expired() async {
    await _clear();
    notifyListeners();
  }

  Future<void> _clear() async {
    api.token = null;
    api.refreshToken = null;
    user = null;
    await store.clear();
  }
}
