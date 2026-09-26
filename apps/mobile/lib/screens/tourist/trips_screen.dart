import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../l10n/labels.dart';
import '../../models/models.dart';
import '../../services/payment_sheet.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import '../auth/require_sign_in.dart';
import '../shared/live_tour_screen.dart';
import 'review_screen.dart';
import '../shared/push_listener.dart';

/// Tourist's bookings: live now, upcoming and past.
class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> {
  Future<List<Booking>>? _bookings;

  @override
  void initState() {
    super.initState();
    if (context.read<Session>().isSignedIn) _reload();
  }

  void _reload() => setState(() => _bookings = context.read<Repository>().myBookings());

  @override
  Widget build(BuildContext context) {
    final signedIn = context.watch<Session>().isSignedIn;
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.tripsTitle), actions: [
        if (signedIn) IconButton(tooltip: l10n.tripsRefresh, onPressed: _reload, icon: const Icon(Icons.refresh)),
        const NotificationBell(),
      ]),
      body: !signedIn
          ? EmptyView(
              icon: Icons.luggage_outlined,
              message: l10n.tripsSignInPrompt,
              action: FilledButton(
                onPressed: () async {
                  if (await requireSignIn(context)) _reload();
                },
                child: Text(l10n.tripsSignIn),
              ),
            )
          : FutureBuilder<List<Booking>>(
              future: _bookings,
              builder: (context, snap) {
                if (snap.hasError) return ErrorView(error: snap.error!, onRetry: _reload);
                if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                return RefreshIndicator(onRefresh: () async => _reload(), child: _list(snap.data!));
              },
            ),
    );
  }

  Widget _list(List<Booking> all) {
    final l10n = context.l10n;
    final now = DateTime.now();
    final live = all.where((b) => b.isLive).toList();
    final upcoming = all
        .where((b) => (b.status == BookingStatus.confirmed || b.status == BookingStatus.pendingPayment) && b.endAt.isAfter(now))
        .toList()
      ..sort((a, b) => a.startAt.compareTo(b.startAt));
    final past = all.where((b) => !live.contains(b) && !upcoming.contains(b)).toList();

    if (all.isEmpty) {
      return ListView(children: [
        const SizedBox(height: 80),
        EmptyView(icon: Icons.map_outlined, message: l10n.tripsEmpty),
      ]);
    }
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (live.isNotEmpty) _header(l10n.tripsSectionLive),
        for (final b in live) _tile(b),
        if (upcoming.isNotEmpty) _header(l10n.tripsSectionUpcoming),
        for (final b in upcoming) _tile(b),
        if (past.isNotEmpty) _header(l10n.tripsSectionPast),
        for (final b in past) _tile(b),
      ],
    );
  }

  Widget _header(String s) => Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(4, 16, 4, 4),
        child: Text(s, style: Theme.of(context).textTheme.titleMedium),
      );

  Color _statusColor(BookingStatus s) => switch (s) {
        BookingStatus.inProgress => Colors.red,
        BookingStatus.confirmed => Colors.green,
        BookingStatus.pendingPayment => Colors.orange,
        BookingStatus.completed => Colors.blueGrey,
        BookingStatus.cancelled => Colors.grey,
      };

  Widget _tile(Booking b) {
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(b.package?.title ?? l10n.tripsTourFallback, style: t.titleMedium)),
              StatusChip(l10n.bookingStatus(b.status), color: _statusColor(b.status)),
            ]),
            const SizedBox(height: 4),
            Text(l10n.tripsScheduleLine(formatDateTime(b.startAt), l10n.tripsTravellers(b.groupSize))),
            Text(l10n.tripsGuideLine(b.guide?.name ?? '', formatMoney(b.totalMinor, b.currency)), style: t.bodySmall),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: _actions(b)),
          ],
        ),
      ),
    );
  }

  List<Widget> _actions(Booking b) {
    final repo = context.read<Repository>();
    final l10n = context.l10n;
    return [
      if (b.isLive || b.status == BookingStatus.confirmed)
        FilledButton.icon(
          onPressed: () async {
            await Navigator.push(context, MaterialPageRoute(builder: (_) => LiveTourScreen(bookingId: b.id)));
            _reload();
          },
          icon: Icon(b.isLive ? Icons.podcasts : Icons.info_outline),
          label: Text(b.isLive ? l10n.tripsOpenLiveTour : l10n.tripsDetailsSafety),
        ),
      if (b.status == BookingStatus.pendingPayment)
        FilledButton(
          onPressed: () async {
            final token = await context.read<PaymentSheet>().collect(
              context,
              PaymentRequest(
                bookingId: b.id,
                amountMinor: b.totalMinor,
                currency: b.currency,
                description: b.package?.title ?? l10n.tripsPaymentDescription,
              ),
            );
            if (token == null) return;
            try {
              await repo.pay(b.id, token);
              _reload();
            } catch (e) {
              if (mounted) showError(context, e);
            }
          },
          child: Text(l10n.tripsPayNow),
        ),
      if (b.canReview)
        FilledButton.tonalIcon(
          onPressed: () async {
            final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => ReviewScreen(booking: b)));
            if (ok == true) _reload();
          },
          icon: const Icon(Icons.rate_review_outlined),
          label: Text(l10n.tripsLeaveReview),
        ),
      if (b.status == BookingStatus.confirmed || b.status == BookingStatus.pendingPayment)
        TextButton(onPressed: () => _cancel(b), child: Text(l10n.cancel)),
    ];
  }

  Future<void> _cancel(Booking b) async {
    final l10n = context.l10n;
    final hours = b.startAt.difference(DateTime.now()).inMinutes / 60;
    final refund = b.status == BookingStatus.pendingPayment
        ? l10n.tripsRefundNoPayment
        : hours >= 48
            ? l10n.tripsRefundFull
            : hours >= 24
                ? l10n.tripsRefundHalf
                : l10n.tripsRefundNone;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.tripsCancelTitle),
        content: Text(refund),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.tripsKeep)),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l10n.tripsCancelConfirm)),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      final res = await context.read<Repository>().cancel(b.id, reason: 'Cancelled by tourist in app');
      if (mounted) showMessage(context, context.l10n.tripsCancelled(res.refundPercent));
      _reload();
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }
}
