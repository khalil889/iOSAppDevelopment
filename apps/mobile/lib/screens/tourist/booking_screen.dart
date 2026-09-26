import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:provider/provider.dart';

import '../../core/api_client.dart';
import '../../core/format.dart';
import '../../l10n/l10n.dart';
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
      if (mounted) setState(() => _slotsError = e is ApiException ? errorText(context, e) : context.l10n.bookingCouldNotLoadTimes);
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
        if (mounted) setState(() => _setQuote(null, errorText(context, e)));
      } catch (e) {
        if (mounted) setState(() => _setQuote(null, context.l10n.bookingCouldNotGetPrice));
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
    final l10n = context.l10n;
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
          description: l10n.bookingPaymentDescription(pkg.title, widget.guide.name),
        ),
      );
      if (token == null) {
        if (mounted) showMessage(context, l10n.bookingHeldMessage);
        return;
      }
      final paid = await repo.pay(booking.id, token);
      if (!mounted) return;
      if (paid.status == BookingStatus.pendingPayment) {
        showMessage(context, l10n.bookingVerifyingPayment);
        Navigator.of(context).popUntil((r) => r.isFirst);
        return;
      }
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          icon: const Icon(Icons.check_circle, size: 48, color: Colors.green),
          title: Text(l10n.bookingSuccessTitle),
          content: Text(
            l10n.bookingSuccessBody(pkg.title, widget.guide.name, formatDateTime(paid.startAt)),
            textAlign: TextAlign.center,
          ),
          actions: [FilledButton(onPressed: () => Navigator.pop(ctx), child: Text(l10n.bookingDone))],
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
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.bookingTitle)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Avatar(name: widget.guide.name, url: widget.guide.avatarUrl),
            title: Text(pkg.title, style: t.titleMedium),
            subtitle: Text(l10n.bookingWithGuide(widget.guide.name, formatDuration(pkg.durationMinutes))),
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.calendar_today),
            title: Text(l10n.bookingDate),
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
            padding: const EdgeInsetsDirectional.fromSTEB(16, 4, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Text(l10n.bookingStartTime, style: t.titleSmall),
                  const SizedBox(width: 8),
                  if (_slots != null) Flexible(child: Text(l10n.bookingLocalTimeZone(_slots!.timeZone), style: t.bodySmall)),
                ]),
                const SizedBox(height: 8),
                if (_slotsError != null)
                  Text(_slotsError!, style: TextStyle(color: Theme.of(context).colorScheme.error))
                else if (_slots == null)
                  const LinearProgressIndicator()
                else if (_slots!.slots.isEmpty)
                  Text(l10n.bookingNoSlots)
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final s in _slots!.slots)
                        ChoiceChip(
                          label: Text(s.localTime, textDirection: TextDirection.ltr),
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
            title: Text(l10n.bookingTravellers),
            subtitle: Text(l10n.bookingMaxGroup(pkg.maxGroupSize)),
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
            decoration: InputDecoration(labelText: l10n.bookingNotesLabel),
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
                      ? Text(_slot == null ? l10n.bookingPickTimeForPrice : l10n.bookingGettingPrice)
                      : Column(children: [
                          _line(
                            pkg.perPerson ? '${formatMoney(pkg.priceMinor, pkg.currency)} × $_group' : l10n.bookingPrivateGroup,
                            formatMoney(_quote!.totalMinor, _quote!.currency),
                          ),
                          _line(
                            l10n.bookingTimeLabel,
                            '${_slot!.localTime}–${addMinutesToClock(_slot!.localTime, pkg.durationMinutes)} (${_slots?.timeZone ?? l10n.bookingLocalFallback})',
                          ),
                          const Divider(),
                          _line(l10n.bookingTotal, formatMoney(_quote!.totalMinor, _quote!.currency), bold: true),
                        ]),
            ),
          ),
          const SizedBox(height: 8),
          Text(l10n.bookingPolicy, style: const TextStyle(fontSize: 12)),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _busy || _quote == null || _slot == null ? null : _confirm,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: Text(_busy ? l10n.bookingProcessing : l10n.bookingConfirmPay),
          ),
        ),
      ),
    );
  }

  /// A label/value row. The value (money, clock times) is always laid out LTR.
  Widget _line(String a, String b, {bool bold = false}) {
    final style = bold ? Theme.of(context).textTheme.titleMedium : null;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Expanded(
          child: Text(a, style: style),
        ),
        Text(b, style: style, textDirection: TextDirection.ltr),
      ]),
    );
  }
}
