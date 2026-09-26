import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../l10n/labels.dart';
import '../../models/models.dart';
import '../../services/location_service.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Live tour view for both tourist and guide, with an SOS button.
class LiveTourScreen extends StatefulWidget {
  const LiveTourScreen({super.key, required this.bookingId});
  final String bookingId;

  @override
  State<LiveTourScreen> createState() => _LiveTourScreenState();
}

class _LiveTourScreenState extends State<LiveTourScreen> {
  Booking? _booking;
  Object? _error;
  Timer? _ticker;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _load();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted && _booking?.isLive == true) setState(() {});
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final b = await context.read<Repository>().booking(widget.bookingId);
      if (mounted) {
        setState(() {
          _booking = b;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _sos() async {
    final message = await showDialog<String>(context: context, builder: (_) => const _SosDialog());
    if (message == null || !mounted) return;
    final repo = context.read<Repository>();
    final location = await context.read<LocationService>().current();
    try {
      await repo.sos(widget.bookingId, lat: location?.lat, lng: location?.lng, message: message.isEmpty ? null : message);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.support_agent, size: 44),
          title: Text(ctx.l10n.liveSosSentTitle),
          content: Text(ctx.l10n.liveSosSentBody),
          actions: [FilledButton(onPressed: () => Navigator.pop(ctx), child: Text(ctx.l10n.ok))],
        ),
      );
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  Future<void> _guideAction(Future<Booking> Function() action, String done) async {
    setState(() => _busy = true);
    try {
      final b = await action();
      if (!mounted) return;
      setState(() => _booking = b);
      showMessage(context, done);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = _booking;
    return Scaffold(
      appBar: AppBar(title: Text(b?.isLive == true ? context.l10n.liveTitleLive : context.l10n.liveTitleDetails)),
      body: b == null
          ? (_error != null ? ErrorView(error: _error!, onRetry: _load) : const Center(child: CircularProgressIndicator()))
          : RefreshIndicator(onRefresh: _load, child: _body(b)),
    );
  }

  Widget _body(Booking b) {
    final session = context.watch<Session>();
    final isGuide = session.isGuide;
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    final other = isGuide ? b.tourist : b.guide;
    final sosAvailable = b.isLive || b.status == BookingStatus.confirmed;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _statusBanner(b),
        const SizedBox(height: 16),
        Text(b.package?.title ?? l10n.liveTourFallback, style: t.headlineSmall),
        const SizedBox(height: 4),
        Text(l10n.liveScheduleLine(
          formatDateTime(b.startAt),
          _ltr(formatDateTime(b.endAt).split(', ').last),
          l10n.liveTravellers(b.groupSize),
        )),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: Avatar(name: other?.name ?? '', url: other?.avatarUrl),
            title: Text(other?.name ?? ''),
            subtitle: Text(isGuide ? l10n.liveYourTraveller(_ltr(other?.phone ?? '')) : l10n.liveYourGuide(_ltr(other?.phone ?? ''))),
            trailing: const Icon(Icons.phone_outlined),
          ),
        ),
        if (b.package?.sites.isNotEmpty == true) ...[
          const SizedBox(height: 12),
          Text(l10n.liveStops, style: t.titleMedium),
          for (final (i, s) in b.package!.sites.indexed)
            ListTile(
              dense: true,
              leading: CircleAvatar(radius: 12, child: Text('${i + 1}', style: const TextStyle(fontSize: 12))),
              title: Text(s.name),
            ),
        ],
        if (b.notes?.isNotEmpty == true) ...[
          const SizedBox(height: 8),
          Text(l10n.liveNotes(b.notes!), style: t.bodySmall),
        ],
        const SizedBox(height: 24),
        if (isGuide && b.status == BookingStatus.confirmed)
          FilledButton.icon(
            onPressed: _busy ? null : () => _guideAction(() => context.read<Repository>().startTour(b.id), l10n.liveTourStarted),
            icon: const Icon(Icons.play_arrow),
            label: Text(l10n.liveStartTour),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
        if (isGuide && b.isLive)
          FilledButton.icon(
            onPressed: _busy ? null : () => _guideAction(() => context.read<Repository>().completeTour(b.id), l10n.liveTourCompleted),
            icon: const Icon(Icons.flag),
            label: Text(l10n.liveCompleteTour),
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
          ),
        if (sosAvailable) ...[
          const SizedBox(height: 24),
          Center(child: _SosButton(onPressed: _sos)),
          const SizedBox(height: 8),
          Text(
            l10n.liveSosHint,
            textAlign: TextAlign.center,
            style: t.bodySmall,
          ),
        ],
      ],
    );
  }

  Widget _statusBanner(Booking b) {
    final scheme = Theme.of(context).colorScheme;
    if (b.isLive) {
      final elapsed = DateTime.now().difference(b.startedAt ?? b.startAt);
      final total = b.endAt.difference(b.startAt);
      final progress = (elapsed.inSeconds / total.inSeconds).clamp(0.0, 1.0);
      String two(int n) => n.toString().padLeft(2, '0');
      return Card(
        color: scheme.errorContainer,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(Icons.circle, size: 12, color: scheme.error),
              const SizedBox(width: 8),
              Text(context.l10n.liveBadge, style: TextStyle(fontWeight: FontWeight.bold, color: scheme.onErrorContainer)),
              const Spacer(),
              Text(
                textDirection: TextDirection.ltr,
                '${two(elapsed.inHours)}:${two(elapsed.inMinutes % 60)}:${two(elapsed.inSeconds % 60)}',
                style: TextStyle(fontFeatures: const [FontFeature.tabularFigures()], color: scheme.onErrorContainer, fontSize: 20),
              ),
            ]),
            const SizedBox(height: 12),
            LinearProgressIndicator(value: progress),
          ]),
        ),
      );
    }
    return Card(
      child: ListTile(
        leading: const Icon(Icons.event_available),
        title: Text(context.l10n.bookingStatus(b.status)),
        subtitle: Text(b.escrowStatus != null ? context.l10n.livePaymentStatus(context.l10n.escrowStatus(b.escrowStatus!)) : ''),
      ),
    );
  }
}

/// Keeps phone numbers and times left-to-right inside Arabic text.
String _ltr(String s) => s.isEmpty ? s : '\u2066$s\u2069';

/// Large red button that requires a 1-second hold to avoid accidental alerts.
class _SosButton extends StatefulWidget {
  const _SosButton({required this.onPressed});
  final VoidCallback onPressed;

  @override
  State<_SosButton> createState() => _SosButtonState();
}

class _SosButtonState extends State<_SosButton> with SingleTickerProviderStateMixin {
  late final AnimationController _hold = AnimationController(vsync: this, duration: const Duration(seconds: 1))
    ..addStatusListener((s) {
      if (s == AnimationStatus.completed) {
        _hold.reset();
        widget.onPressed();
      }
    });

  @override
  void dispose() {
    _hold.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: context.l10n.liveSosSemantics,
      child: GestureDetector(
        onTapDown: (_) => _hold.forward(),
        onTapUp: (_) => _hold.reverse(),
        onTapCancel: () => _hold.reverse(),
        child: AnimatedBuilder(
          animation: _hold,
          builder: (_, __) => Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 150,
                height: 150,
                child: CircularProgressIndicator(value: _hold.value, strokeWidth: 6, color: Colors.red.shade900),
              ),
              Container(
                width: 130,
                height: 130,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.red.shade600,
                  boxShadow: [BoxShadow(color: Colors.red.withValues(alpha: 0.4), blurRadius: 20, spreadRadius: 2)],
                ),
                alignment: Alignment.center,
                padding: const EdgeInsets.all(12),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    context.l10n.liveSosButton,
                    style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SosDialog extends StatefulWidget {
  const _SosDialog();

  @override
  State<_SosDialog> createState() => _SosDialogState();
}

class _SosDialogState extends State<_SosDialog> {
  final _msg = TextEditingController();

  @override
  void dispose() {
    _msg.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AlertDialog(
      icon: const Icon(Icons.warning_amber_rounded, color: Colors.red, size: 40),
      title: Text(l10n.liveSosDialogTitle),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(l10n.liveSosDialogBody),
        const SizedBox(height: 12),
        TextField(controller: _msg, decoration: InputDecoration(labelText: l10n.liveSosMessageLabel)),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.cancel)),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () => Navigator.pop(context, _msg.text.trim()),
          child: Text(l10n.liveSosSend),
        ),
      ],
    );
  }
}
