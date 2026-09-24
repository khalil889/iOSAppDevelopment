import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../services/push_service.dart';
import '../services/repository.dart';
import 'api_client.dart';

/// Holds the signed-in user and token; persists the token across launches.
class Session extends ChangeNotifier {
  Session(this.api, this.repo, {PushService? push}) : push = push ?? DisabledPushService() {
    api.onUnauthorized = signOut;
  }

  final PushService push;

  static const _tokenKey = 'auth_token';

  final ApiClient api;
  final Repository repo;

  AppUser? user;
  bool restoring = true;

  bool get isSignedIn => user != null;
  bool get isGuide => user?.role == UserRole.guide;

  Future<void> restore() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_tokenKey);
      if (token != null) {
        api.token = token;
        user = await repo.me();
        push.onSignedIn(repo);
      }
    } catch (_) {
      api.token = null;
      user = null;
    } finally {
      restoring = false;
      notifyListeners();
    }
  }

  Future<void> signIn(String token, AppUser u) async {
    api.token = token;
    user = u;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    notifyListeners();
    push.onSignedIn(repo);
  }

  Future<void> refreshUser() async {
    user = await repo.me();
    notifyListeners();
  }

  Future<void> signOut() async {
    // Unregister while the token is still valid so this phone stops getting pushes.
    if (api.token != null) await push.onSignedOut(repo);
    api.token = null;
    user = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    notifyListeners();
  }
}
