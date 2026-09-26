import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/inbox_controller.dart';
import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/push_service.dart';
import '../../services/repository.dart';
import '../guide/earnings_screen.dart';
import '../tourist/review_screen.dart';
import 'live_tour_screen.dart';

final appNavigatorKey = GlobalKey<NavigatorState>();
final appMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Whether tapping a notification with [data] leads somewhere.
bool hasNotificationTarget(Map<String, String> data) =>
    data['bookingId'] != null || data['screen'] == 'earnings' || data['screen'] == 'dashboard';

/// Opens the screen a notification points at (from a push tap or the inbox).
Future<void> openNotificationTarget(BuildContext context, Map<String, String> data) async {
  final bookingId = data['bookingId'];
  final nav = appNavigatorKey.currentState ?? Navigator.of(context);
  final screen = data['screen'];
  if (screen == 'earnings' || screen == 'dashboard') {
    // Guide-only targets (payouts, identity check); the dashboard is the
    // guide's home tab, so going back to the root shows it (refreshed on resume).
    if (!context.read<Session>().isGuide) return;
    if (screen == 'earnings') {
      nav.push(MaterialPageRoute(builder: (_) => const EarningsScreen()));
    } else {
      nav.popUntil((r) => r.isFirst);
    }
    return;
  }
  if (bookingId == null) return;
  if (data['screen'] == 'review') {
    try {
      final booking = await context.read<Repository>().booking(bookingId);
      if (booking.canReview) {
        nav.push(MaterialPageRoute(builder: (_) => ReviewScreen(booking: booking)));
        return;
      }
    } catch (_) {}
  }
  nav.push(MaterialPageRoute(builder: (_) => LiveTourScreen(bookingId: bookingId)));
}

/// Keeps the inbox fresh and reacts to pushes: a banner while the app is
/// open, navigation when the user tapped the notification.
class PushListener extends StatefulWidget {
  const PushListener({super.key, required this.child});
  final Widget child;

  @override
  State<PushListener> createState() => _PushListenerState();
}

class _PushListenerState extends State<PushListener> {
  StreamSubscription<PushEvent>? _sub;

  @override
  void initState() {
    super.initState();
    _sub = context.read<PushService>().events.listen(_onPush);
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncInbox());
  }

  void _syncInbox() {
    if (!mounted) return;
    final inbox = context.read<InboxController>();
    context.read<Session>().isSignedIn ? inbox.refresh() : inbox.clear();
  }

  void _onPush(PushEvent e) {
    if (!mounted) return;
    context.read<InboxController>().refresh();
    if (e.tapped) {
      openNotificationTarget(context, e.data);
      return;
    }
    appMessengerKey.currentState?.showSnackBar(SnackBar(
      content: Text(e.body.isEmpty ? e.title : '${e.title}\n${e.body}'),
      action: !hasNotificationTarget(e.data)
          ? null
          : SnackBarAction(label: context.l10n.notifOpen, onPressed: () => openNotificationTarget(context, e.data)),
    ));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Re-sync when the signed-in user changes (HomeShell is keyed by user id).
    WidgetsBinding.instance.addPostFrameCallback((_) => _syncInbox());
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

/// App-bar bell with the unread count; opens the inbox.
class NotificationBell extends StatelessWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context) {
    if (!context.watch<Session>().isSignedIn) return const SizedBox.shrink();
    final unread = context.watch<InboxController>().unread;
    return IconButton(
      tooltip: context.l10n.notifTitle,
      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const InboxScreen())),
      icon: Badge(
        isLabelVisible: unread > 0,
        label: Text(unread > 9 ? '9+' : '$unread'),
        child: const Icon(Icons.notifications_outlined),
      ),
    );
  }
}

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  @override
  void initState() {
    super.initState();
    context.read<InboxController>().refresh();
  }

  static IconData _icon(String type) => switch (type) {
        'SOS_RAISED' || 'SOS_ACKNOWLEDGED' => Icons.sos,
        'REVIEW_REMINDER' || 'TOUR_COMPLETED' => Icons.rate_review_outlined,
        'BOOKING_CANCELLED' => Icons.event_busy,
        'TOUR_STARTED' => Icons.podcasts,
        'GUIDE_APPROVED' => Icons.verified,
        'GUIDE_REJECTED' => Icons.error_outline,
        'DISPUTE_OPENED' || 'DISPUTE_RESOLVED' => Icons.gavel,
        'IDENTITY_VERIFIED' => Icons.verified_user,
        'IDENTITY_NEEDS_ACTION' => Icons.badge_outlined,
        'PAYOUT_SENT' => Icons.payments_outlined,
        'PAYOUT_ACCOUNT_CHANGED' => Icons.account_balance_outlined,
        _ => Icons.event_available,
      };

  static String _ago(AppLocalizations l10n, DateTime t) {
    final d = DateTime.now().difference(t);
    if (d.inMinutes < 1) return l10n.notifAgoNow;
    if (d.inHours < 1) return l10n.notifAgoMinutes(d.inMinutes);
    if (d.inDays < 1) return l10n.notifAgoHours(d.inHours);
    return l10n.notifAgoDays(d.inDays);
  }

  @override
  Widget build(BuildContext context) {
    final inbox = context.watch<InboxController>();
    final items = inbox.inbox?.items;
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notifTitle),
        actions: [
          if (inbox.unread > 0) TextButton(onPressed: inbox.markAllRead, child: Text(l10n.notifMarkAllRead)),
        ],
      ),
      body: items == null
          ? const Center(child: CircularProgressIndicator())
          : items.isEmpty
              ? Center(child: Text(l10n.notifEmpty))
              : RefreshIndicator(
                  onRefresh: inbox.refresh,
                  child: ListView.separated(
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final AppNotification n = items[i];
                      return ListTile(
                        leading: CircleAvatar(child: Icon(_icon(n.type), size: 20)),
                        title: Text(n.title, style: TextStyle(fontWeight: n.unread ? FontWeight.w700 : FontWeight.w400)),
                        subtitle: Text(n.body),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(_ago(l10n, n.createdAt), style: Theme.of(context).textTheme.bodySmall),
                            if (n.unread) ...[
                              const SizedBox(height: 4),
                              CircleAvatar(radius: 4, backgroundColor: Theme.of(context).colorScheme.primary),
                            ],
                          ],
                        ),
                        onTap: hasNotificationTarget(n.data) ? () => openNotificationTarget(context, n.data) : null,
                      );
                    },
                  ),
                ),
    );
  }
}
