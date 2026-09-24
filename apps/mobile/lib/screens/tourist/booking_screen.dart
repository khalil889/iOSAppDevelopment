import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../models/models.dart';
import '../../services/payment_sheet.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Pick date/time and group size, see a live quote, then book and pay into escrow.
class BookingScreen extends StatefulWidget {
  const BookingScreen({super.key, required this.guide, required this.package});
  final GuideSummary guide;
  final TourPackage package;

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late DateTime _date = DateUtils.dateOnly(DateTime.now().add(const Duration(days: 2)));
  DaySlots? _slots;
  String? _slotsError;
  TimeSlot? _slot;
  int _group = 2;
  final _notes = TextEditingController();

  Quote? _quote;
  String? _quoteError;
  bool _busy = false;
  Timer? _debounce;

  TourPackage get pkg => widget.package;
  String get _dateKey => DateFormat('yyyy-MM-dd').format(_date);

  @override
  void initState() {
    super.initState();
    _group = _group.clamp(1, pkg.maxGroupSize);
    _loadSlots();
  }

  Future<void> _loadSlots() async {
    setState(() {
      _slots = null;
      _slotsError = null;
      _slot = null;
      _quote = null;
      _quoteError = null;
    });
    try {
      final s = await context.read<Repository>().slots(pkg.id, _dateKey);
      if (mounted) setState(() => _slots = s);
    } catch (e) {
      if (mounted) setState(() => _slotsError = e is ApiException ? e.message : 'Could not load times');
    }
  }

  void _pickSlot(TimeSlot s) {
    setState(() => _slot = s);
    _refreshQuote();
  }

  @override
  void dispose() {
    _notes.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _refreshQuote() {
    final slot = _slot;
    if (slot == null) return;
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () async {
      try {
        final q = await context.read<Repository>().quote(pkg.id, slot.startAt, _group);
        if (mounted) setState(() => _setQuote(q, null));
      } on ApiException catch (e) {
        if (mounted) setState(() => _setQuote(null, e.message));
      } catch (e) {
        if (mounted) setState(() => _setQuote(null, 'Could not get a price'));
      }
    });
  }

  void _setQuote(Quote? q, String? error) {
    _quote = q;
    _quoteError = error;
  }

  void _setGroup(int n) {
    setState(() => _group = n);
    _refreshQuote();
  }

  Future<void> _confirm() async {
    final repo = context.read<Repository>();
    final sheet = context.read<PaymentSheet>();
    setState(() => _busy = true);
    try {
      final booking = await repo.createBooking(pkg.id, _slot!.startAt, _group, notes: _notes.text.trim());
      if (!mounted) return;
      final token = await sheet.collect(
        context,
        PaymentRequest(
          bookingId: booking.id,
          amountMinor: booking.totalMinor,
          currency: booking.currency,
          description: '${pkg.title} with ${widget.guide.name}',
        ),
      );
      if (token == null) {
        if (mounted) showMessage(context, 'Booking held for 15 minutes — pay from Trips to confirm.');
        return;
      }
      final paid = await repo.pay(booking.id, token);
      if (!mounted) return;
      if (paid.status == BookingStatus.pendingPayment) {
        showMessage(context, "We're still verifying your payment — check Trips in a moment.");
        Navigator.of(context).popUntil((r) => r.isFirst);
        return;
      }
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.check_circle, size: 48, color: Colors.green),
          title: const Text("You're booked!"),
          content: Text(
            '${pkg.title} with ${widget.guide.name}\n${formatDateTime(paid.startAt)}\n\n'
            'Your payment is held securely in escrow and released to the guide only after the tour.',
            textAlign: TextAlign.center,
          ),
          actions: [FilledButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done'))],
        ),
      );
      if (mounted) Navigator.of(context).popUntil((r) => r.isFirst);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Scaffold(
      appBar: AppBar(title: const Text('Book tour')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Avatar(name: widget.guide.name, url: widget.guide.avatarUrl),
            title: Text(pkg.title, style: t.titleMedium),
            subtitle: Text('with ${widget.guide.name} · ${formatDuration(pkg.durationMinutes)}'),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.calendar_today),
            title: const Text('Date'),
            trailing: Text(formatDate(_date), style: t.titleSmall),
            onTap: () async {
              final d = await showDatePicker(
                context: context,
                initialDate: _date,
                firstDate: DateUtils.dateOnly(DateTime.now()),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (d != null) {
                setState(() => _date = d);
                _loadSlots();
              }
            },
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text('Start time', style: t.titleSmall),
                  const SizedBox(width: 8),
                  if (_slots != null) Text('local time · ${_slots!.timeZone}', style: t.bodySmall),
                ]),
                const SizedBox(height: 8),
                if (_slotsError != null)
                  Text(_slotsError!, style: TextStyle(color: Theme.of(context).colorScheme.error))
                else if (_slots == null)
                  const LinearProgressIndicator()
                else if (_slots!.slots.isEmpty)
                  const Text('No free times on this day. Try another date.')
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final s in _slots!.slots)
                        ChoiceChip(
                          label: Text(s.localTime),
                          selected: _slot?.startAt == s.startAt,
                          onSelected: (_) => _pickSlot(s),
                        ),
                    ],
                  ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.group_outlined),
            title: const Text('Travellers'),
            subtitle: Text('Max ${pkg.maxGroupSize}'),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              IconButton.outlined(
                onPressed: _group > 1 ? () => _setGroup(_group - 1) : null,
                icon: const Icon(Icons.remove),
              ),
              SizedBox(width: 32, child: Text('$_group', textAlign: TextAlign.center, style: t.titleMedium)),
              IconButton.outlined(
                onPressed: _group < pkg.maxGroupSize ? () => _setGroup(_group + 1) : null,
                icon: const Icon(Icons.add),
              ),
            ]),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _notes,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Notes for your guide (optional)'),
          ),
          const SizedBox(height: 20),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: _quoteError != null
                  ? Row(children: [
                      Icon(Icons.info_outline, color: Theme.of(context).colorScheme.error),
                      const SizedBox(width: 8),
                      Expanded(child: Text(_quoteError!, style: TextStyle(color: Theme.of(context).colorScheme.error))),
                    ])
                  : _quote == null
                      ? Text(_slot == null ? 'Pick a start time to see the price.' : 'Getting price…')
                      : Column(children: [
                          _line(
                            pkg.perPerson
                                ? '${formatMoney(pkg.priceMinor, pkg.currency)} × $_group'
                                : 'Private group tour',
                            formatMoney(_quote!.totalMinor, _quote!.currency),
                          ),
                          _line('Time', '${_slot!.localTime}–${addMinutesToClock(_slot!.localTime, pkg.durationMinutes)} (${_slots?.timeZone ?? 'local'})'),
                          const Divider(),
                          _line('Total', formatMoney(_quote!.totalMinor, _quote!.currency), bold: true),
                        ]),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Free cancellation up to 48 hours before. 50% refund between 24 and 48 hours. '
            'Your payment is held in escrow until the tour is completed.',
            style: TextStyle(fontSize: 12),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _busy || _quote == null || _slot == null ? null : _confirm,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: Text(_busy ? 'Processing…' : 'Confirm & pay'),
          ),
        ),
      ),
    );
  }

  Widget _line(String a, String b, {bool bold = false}) {
    final style = bold ? Theme.of(context).textTheme.titleMedium : null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [Expanded(child: Text(a, style: style)), Text(b, style: style)]),
    );
  }
}
