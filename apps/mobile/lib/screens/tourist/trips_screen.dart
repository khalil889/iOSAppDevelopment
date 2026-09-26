import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/session.dart';
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
    return Scaffold(
      appBar: AppBar(title: const Text('My trips'), actions: [
        if (signedIn) IconButton(onPressed: _reload, icon: const Icon(Icons.refresh)),
        const NotificationBell(),
      ]),
      body: !signedIn
          ? EmptyView(
              icon: Icons.luggage_outlined,
              message: 'Sign in to see your bookings.',
              action: FilledButton(
                onPressed: () async {
                  if (await requireSignIn(context)) _reload();
                },
                child: const Text('Sign in'),
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
    final now = DateTime.now();
    final live = all.where((b) => b.isLive).toList();
    final upcoming = all
        .where((b) => (b.status == BookingStatus.confirmed || b.status == BookingStatus.pendingPayment) && b.endAt.isAfter(now))
        .toList()
      ..sort((a, b) => a.startAt.compareTo(b.startAt));
    final past = all.where((b) => !live.contains(b) && !upcoming.contains(b)).toList();

    if (all.isEmpty) {
      return ListView(children: const [
        SizedBox(height: 80),
        EmptyView(icon: Icons.map_outlined, message: 'No trips yet. Find a licensed guide in Explore.'),
      ]);
    }
    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        if (live.isNotEmpty) _header('Live now'),
        for (final b in live) _tile(b),
        if (upcoming.isNotEmpty) _header('Upcoming'),
        for (final b in upcoming) _tile(b),
        if (past.isNotEmpty) _header('Past'),
        for (final b in past) _tile(b),
      ],
    );
  }

  Widget _header(String s) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 16, 4, 4),
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Expanded(child: Text(b.package?.title ?? 'Tour', style: t.titleMedium)),
              StatusChip(b.status.label, color: _statusColor(b.status)),
            ]),
            const SizedBox(height: 4),
            Text('${formatDateTime(b.startAt)} · ${b.groupSize} traveller${b.groupSize == 1 ? '' : 's'}'),
            Text('Guide: ${b.guide?.name ?? ''} · ${formatMoney(b.totalMinor, b.currency)}', style: t.bodySmall),
            const SizedBox(height: 8),
            Wrap(spacing: 8, children: _actions(b)),
          ],
        ),
      ),
    );
  }

  List<Widget> _actions(Booking b) {
    final repo = context.read<Repository>();
    return [
      if (b.isLive || b.status == BookingStatus.confirmed)
        FilledButton.icon(
          onPressed: () async {
            await Navigator.push(context, MaterialPageRoute(builder: (_) => LiveTourScreen(bookingId: b.id)));
            _reload();
          },
          icon: Icon(b.isLive ? Icons.podcasts : Icons.info_outline),
          label: Text(b.isLive ? 'Open live tour' : 'Details & safety'),
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
                description: b.package?.title ?? 'Tour booking',
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
          child: const Text('Pay now'),
        ),
      if (b.canReview)
        FilledButton.tonalIcon(
          onPressed: () async {
            final ok = await Navigator.push<bool>(context, MaterialPageRoute(builder: (_) => ReviewScreen(booking: b)));
            if (ok == true) _reload();
          },
          icon: const Icon(Icons.rate_review_outlined),
          label: const Text('Leave a review'),
        ),
      if (b.status == BookingStatus.confirmed || b.status == BookingStatus.pendingPayment)
        TextButton(onPressed: () => _cancel(b), child: const Text('Cancel')),
    ];
  }

  Future<void> _cancel(Booking b) async {
    final hours = b.startAt.difference(DateTime.now()).inMinutes / 60;
    final refund = b.status == BookingStatus.pendingPayment
        ? 'No payment has been taken.'
        : hours >= 48
            ? 'You will get a full refund.'
            : hours >= 24
                ? 'You will get a 50% refund.'
                : 'Cancelling within 24 hours is not refundable.';
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel booking?'),
        content: Text(refund),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Cancel booking')),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    try {
      final res = await context.read<Repository>().cancel(b.id, reason: 'Cancelled by tourist in app');
      if (mounted) showMessage(context, 'Booking cancelled. Refund: ${res.refundPercent}%');
      _reload();
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }
}
