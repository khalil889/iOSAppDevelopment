import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import '../shared/live_tour_screen.dart';
import '../shared/push_listener.dart';
import 'availability_screen.dart';
import 'license_form_screen.dart';
import 'my_tours_screen.dart';

/// Guide mode home: verification status, earnings, stats and upcoming tours.
class GuideDashboardScreen extends StatefulWidget {
  const GuideDashboardScreen({super.key});

  @override
  State<GuideDashboardScreen> createState() => _GuideDashboardScreenState();
}

class _GuideDashboardScreenState extends State<GuideDashboardScreen> {
  late Future<GuideDashboard> _data = _load();

  Future<GuideDashboard> _load() => context.read<Repository>().dashboard();
  void _reload() => setState(() => _data = _load());

  @override
  Widget build(BuildContext context) {
    final user = context.watch<Session>().user;
    return Scaffold(
      appBar: AppBar(
        title: Text(context.l10n.dashboardGreeting(user?.firstName ?? '')),
        actions: [
          IconButton(onPressed: _reload, tooltip: context.l10n.dashboardRefresh, icon: const Icon(Icons.refresh)),
          const NotificationBell(),
        ],
      ),
      body: FutureBuilder<GuideDashboard>(
        future: _data,
        builder: (context, snap) {
          if (snap.hasError) return ErrorView(error: snap.error!, onRetry: _reload);
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          return RefreshIndicator(onRefresh: () async => _reload(), child: _body(snap.data!));
        },
      ),
    );
  }

  Widget _body(GuideDashboard d) {
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    final completed = d.stats['COMPLETED'] ?? 0;
    final upcoming = (d.stats['CONFIRMED'] ?? 0) + (d.stats['IN_PROGRESS'] ?? 0);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _verificationCard(d),
        const SizedBox(height: 12),
        Row(children: [
          Expanded(
            child: _stat(l10n.dashboardRating, d.ratingCount == 0 ? '—' : d.ratingAvg.toStringAsFixed(1), Icons.star_rounded,
                l10n.dashboardReviews(d.ratingCount)),
          ),
          const SizedBox(width: 8),
          Expanded(child: _stat(l10n.dashboardCompleted, '$completed', Icons.flag_outlined, l10n.dashboardToursUnit(completed))),
          const SizedBox(width: 8),
          Expanded(child: _stat(l10n.dashboardUpcoming, '$upcoming', Icons.event, l10n.dashboardBooked)),
        ]),
        const SizedBox(height: 12),
        for (final e in d.earnings)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(l10n.dashboardPaidOut, style: t.labelMedium),
                    Text(formatMoney(e.releasedMinor, e.currency), style: t.titleLarge),
                  ]),
                ),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(l10n.dashboardInEscrow, style: t.labelMedium),
                    Text(formatMoney(e.heldMinor, e.currency), style: t.titleLarge),
                  ]),
                ),
                Tooltip(
                  message: l10n.dashboardEscrowInfo,
                  child: Icon(Icons.info_outline, color: Theme.of(context).hintColor),
                ),
              ]),
            ),
          ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.tour_outlined),
            title: Text(l10n.toursTitle),
            subtitle: Text(l10n.toursDashboardSubtitle),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MyToursScreen())),
          ),
        ),
        Card(
          child: ListTile(
            leading: const Icon(Icons.schedule),
            title: Text(l10n.availabilityTitle),
            subtitle: Text(l10n.dashboardAvailabilitySubtitle),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AvailabilityScreen())),
          ),
        ),
        const SizedBox(height: 16),
        Text(l10n.dashboardUpcomingTours, style: t.titleLarge),
        if (d.upcoming.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24),
            child: Text(l10n.dashboardNoUpcomingTours, textAlign: TextAlign.center),
          ),
        for (final b in d.upcoming)
          Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: b.status == BookingStatus.inProgress ? Colors.red : null,
                child: Icon(b.status == BookingStatus.inProgress ? Icons.podcasts : Icons.event, color: b.status == BookingStatus.inProgress ? Colors.white : null),
              ),
              title: Text(b.packageTitle),
              subtitle: Text(
                '${formatDateTime(b.startAt)}\n${b.touristName} · ${l10n.dashboardGuests(b.groupSize)} · '
                '${l10n.dashboardPayout(formatMoney(b.guidePayoutMinor, b.currency))}',
              ),
              isThreeLine: true,
              trailing: b.status == BookingStatus.inProgress ? StatusChip(l10n.liveBadge, color: Colors.red) : const Icon(Icons.chevron_right),
              onTap: () async {
                await Navigator.push(context, MaterialPageRoute(builder: (_) => LiveTourScreen(bookingId: b.id)));
                _reload();
              },
            ),
          ),
      ],
    );
  }

  Widget _verificationCard(GuideDashboard d) {
    final scheme = Theme.of(context).colorScheme;
    final l10n = context.l10n;
    final (color, icon, title, body) = switch (d.verificationStatus) {
      'APPROVED' => (Colors.green, Icons.verified, l10n.dashboardVerifiedTitle, l10n.dashboardVerifiedBody),
      'PENDING' => (Colors.orange, Icons.hourglass_top, l10n.dashboardPendingTitle, l10n.dashboardPendingBody),
      'REJECTED' => (scheme.error, Icons.error_outline, l10n.dashboardRejectedTitle, d.rejectionReason ?? l10n.dashboardRejectedBody),
      'SUSPENDED' => (scheme.error, Icons.block, l10n.dashboardSuspendedTitle, d.rejectionReason ?? l10n.dashboardSuspendedBody),
      _ => (scheme.primary, Icons.badge_outlined, l10n.dashboardDraftTitle, l10n.dashboardDraftBody),
    };
    return Card(
      color: Color.alphaBlend(color.withValues(alpha: 0.10), scheme.surface),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(icon, color: color),
            const SizedBox(width: 8),
            Expanded(child: Text(title, style: Theme.of(context).textTheme.titleMedium)),
          ]),
          const SizedBox(height: 6),
          Text(body),
          if (d.canSubmitLicense) ...[
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () async {
                final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => const LicenseFormScreen()));
                if (ok == true) _reload();
              },
              child: Text(d.verificationStatus == 'REJECTED' ? l10n.dashboardResubmitLicense : l10n.dashboardSubmitLicense),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _stat(String label, String value, IconData icon, String sub) => Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 6),
            Text(value, style: Theme.of(context).textTheme.headlineSmall),
            Text(label, style: Theme.of(context).textTheme.labelMedium),
            Text(sub, style: Theme.of(context).textTheme.bodySmall),
          ]),
        ),
      );
}
