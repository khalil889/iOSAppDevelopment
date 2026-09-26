import 'package:flutter/foundation.dart';

import '../models/models.dart';
import '../services/repository.dart';

/// Holds the notification inbox so the bell badge and inbox screen agree.
class InboxController extends ChangeNotifier {
  InboxController(this.repo);
  final Repository repo;

  Inbox? inbox;
  int get unread => inbox?.unread ?? 0;

  Future<void> refresh() async {
    try {
      inbox = await repo.inbox();
      notifyListeners();
    } catch (_) {
      // Keep the last known state; the bell is not worth an error.
    }
  }

  Future<void> markAllRead() async {
    if (unread == 0) return;
    await repo.markAllRead();
    await refresh();
  }

  void clear() {
    inbox = null;
    notifyListeners();
  }
}
