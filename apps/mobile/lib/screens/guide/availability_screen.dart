import 'package:flutter/material.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:provider/provider.dart';

import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Localized weekday name for the API's 0 = Sunday … 6 = Saturday.
String _dayName(String locale, int weekday) => DateFormat.EEEE(locale).format(DateTime(2023, 1, 1 + weekday)); // 2023-01-01 is a Sunday

/// Guide edits weekly working hours (local time of the tour city) and days off.
class AvailabilityScreen extends StatefulWidget {
  const AvailabilityScreen({super.key});

  @override
  State<AvailabilityScreen> createState() => _AvailabilityScreenState();
}

class _AvailabilityScreenState extends State<AvailabilityScreen> {
  List<WeeklyWindow>? _hours;
  List<TimeOffRange> _timeOff = [];
  Object? _error;
  bool _saving = false;
  bool _dirty = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final a = await context.read<Repository>().myAvailability();
      if (mounted) {
        setState(() {
          _hours = a.weeklyHours;
          _timeOff = a.timeOff;
          _dirty = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final a = await context.read<Repository>().saveAvailability(_hours!, _timeOff);
      if (!mounted) return;
      setState(() {
        _hours = a.weeklyHours;
        _timeOff = a.timeOff;
        _dirty = false;
      });
      showMessage(context, context.l10n.availabilitySaved);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _edit(void Function() change) => setState(() {
        change();
        _dirty = true;
      });

  static String _fmt(TimeOfDay t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  static TimeOfDay _parse(String s) {
    final [h, m] = s.split(':').map(int.parse).toList();
    return TimeOfDay(hour: h % 24, minute: m);
  }

  Future<void> _addWindow(int weekday) async {
    final start = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 9, minute: 0), helpText: context.l10n.availabilityStart);
    if (start == null || !mounted) return;
    final end = await showTimePicker(
      context: context,
      initialTime: TimeOfDay(hour: (start.hour + 8).clamp(0, 23), minute: start.minute),
      helpText: context.l10n.availabilityEnd,
    );
    if (end == null) return;
    if (end.hour * 60 + end.minute <= start.hour * 60 + start.minute) {
      if (mounted) showMessage(context, context.l10n.availabilityEndBeforeStart);
      return;
    }
    _edit(() => _hours!.add(WeeklyWindow(weekday: weekday, start: _fmt(start), end: _fmt(end))));
  }

  Future<void> _copyToWorkweek(int weekday) async {
    final source = _hours!.where((w) => w.weekday == weekday).toList();
    _edit(() {
      for (final d in [0, 1, 2, 3, 4]) {
        if (d == weekday) continue;
        _hours!.removeWhere((w) => w.weekday == d);
        _hours!.addAll(source.map((w) => WeeklyWindow(weekday: d, start: w.start, end: w.end)));
      }
    });
  }

  Future<void> _addTimeOff() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateUtils.dateOnly(DateTime.now()),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (range == null) return;
    final f = DateFormat('yyyy-MM-dd');
    _edit(() => _timeOff.add(TimeOffRange(startDate: f.format(range.start), endDate: f.format(range.end))));
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    return PopScope(
      canPop: !_dirty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: Text(l10n.availabilityDiscardTitle),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(l10n.availabilityKeepEditing)),
              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: Text(l10n.availabilityDiscard)),
            ],
          ),
        );
        if (leave == true && context.mounted) Navigator.pop(context);
      },
      child: Scaffold(
        appBar: AppBar(title: Text(l10n.availabilityTitle)),
        body: _hours == null
            ? (_error != null ? ErrorView(error: _error!, onRetry: _load) : const Center(child: CircularProgressIndicator()))
            : ListView(
                padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 16, 96),
                children: [
                  Text(l10n.availabilityWeeklyHours, style: t.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    _hours!.isEmpty
                        ? l10n.availabilityNoHours('08:00', '20:00')
                        : l10n.availabilityHoursHint,
                    style: t.bodySmall,
                  ),
                  const SizedBox(height: 8),
                  for (var d = 0; d < 7; d++) _dayCard(d),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: Text(l10n.availabilityTimeOff, style: t.titleLarge)),
                    TextButton.icon(onPressed: _addTimeOff, icon: const Icon(Icons.add), label: Text(l10n.availabilityAdd)),
                  ]),
                  if (_timeOff.isEmpty) Text(l10n.availabilityNoTimeOff),
                  for (final (i, r) in _timeOff.indexed)
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.beach_access_outlined),
                        title: Text(r.startDate == r.endDate
                            ? _date(r.startDate)
                            : l10n.availabilityDateRange(_date(r.startDate), _date(r.endDate))),
                        subtitle: r.reason != null ? Text(r.reason!) : null,
                        trailing: IconButton(
                          tooltip: l10n.availabilityRemove,
                          icon: const Icon(Icons.delete_outline),
                          onPressed: () => _edit(() => _timeOff.removeAt(i)),
                        ),
                      ),
                    ),
                ],
              ),
        bottomNavigationBar: _hours == null
            ? null
            : SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: FilledButton(
                    onPressed: _saving || !_dirty ? null : _save,
                    style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
                    child: Text(_saving
                        ? l10n.availabilitySaving
                        : _dirty
                            ? l10n.availabilitySaveChanges
                            : l10n.availabilitySavedState),
                  ),
                ),
              ),
      ),
    );
  }

  /// "2026-10-01" → "1 Oct 2026" / "١ أكتوبر ٢٠٢٦" in the current locale.
  String _date(String ymd) {
    final d = DateTime.tryParse(ymd);
    return d == null ? ymd : DateFormat.yMMMd(Localizations.localeOf(context).toLanguageTag()).format(d);
  }

  Widget _dayCard(int weekday) {
    final l10n = context.l10n;
    final windows = _hours!.where((w) => w.weekday == weekday).toList()..sort((a, b) => a.start.compareTo(b.start));
    return Card(
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 8, 8, 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 96,
              child: Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  _dayName(Localizations.localeOf(context).toLanguageTag(), weekday),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
            ),
            Expanded(
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (windows.isEmpty) Padding(padding: const EdgeInsets.only(top: 10), child: Text(l10n.availabilityDayOff)),
                  for (final w in windows)
                    InputChip(
                      // Clock ranges stay LTR ("09:00–17:00") in Arabic too.
                      label: Text('${w.start}–${w.end}', textDirection: TextDirection.ltr),
                      onPressed: () async {
                        final start = await showTimePicker(context: context, initialTime: _parse(w.start), helpText: l10n.availabilityStart);
                        if (start == null || !mounted) return;
                        final end = await showTimePicker(context: context, initialTime: _parse(w.end), helpText: l10n.availabilityEnd);
                        if (end == null) return;
                        _edit(() {
                          _hours!.remove(w);
                          _hours!.add(WeeklyWindow(weekday: weekday, start: _fmt(start), end: _fmt(end)));
                        });
                      },
                      onDeleted: () => _edit(() => _hours!.remove(w)),
                    ),
                ],
              ),
            ),
            PopupMenuButton<String>(
              onSelected: (v) => v == 'add' ? _addWindow(weekday) : _copyToWorkweek(weekday),
              itemBuilder: (_) => [
                PopupMenuItem(value: 'add', child: Text(l10n.availabilityAddHours)),
                if (windows.isNotEmpty) PopupMenuItem(value: 'copy', child: Text(l10n.availabilityCopyToWorkweek)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
