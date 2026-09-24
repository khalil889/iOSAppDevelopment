import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

const _dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
      showMessage(context, 'Availability saved. Existing bookings are unchanged.');
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
    final start = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 9, minute: 0), helpText: 'Start');
    if (start == null || !mounted) return;
    final end = await showTimePicker(context: context, initialTime: TimeOfDay(hour: (start.hour + 8).clamp(0, 23), minute: start.minute), helpText: 'End');
    if (end == null) return;
    if (end.hour * 60 + end.minute <= start.hour * 60 + start.minute) {
      if (mounted) showMessage(context, 'End time must be after the start time.');
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
    return PopScope(
      canPop: !_dirty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final leave = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Discard changes?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep editing')),
              FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Discard')),
            ],
          ),
        );
        if (leave == true && context.mounted) Navigator.pop(context);
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('Availability')),
        body: _hours == null
            ? (_error != null ? ErrorView(error: _error!, onRetry: _load) : const Center(child: CircularProgressIndicator()))
            : ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                children: [
                  Text('Weekly hours', style: t.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    _hours!.isEmpty
                        ? 'No hours set — tourists can book you any day between 08:00 and 20:00.'
                        : "Local time of each tour's city. Tourists only see start times that fit.",
                    style: t.bodySmall,
                  ),
                  const SizedBox(height: 8),
                  for (var d = 0; d < 7; d++) _dayCard(d),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: Text('Time off', style: t.titleLarge)),
                    TextButton.icon(onPressed: _addTimeOff, icon: const Icon(Icons.add), label: const Text('Add')),
                  ]),
                  if (_timeOff.isEmpty) const Text('No days off planned.'),
                  for (final (i, r) in _timeOff.indexed)
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.beach_access_outlined),
                        title: Text(r.startDate == r.endDate ? r.startDate : '${r.startDate} – ${r.endDate}'),
                        subtitle: r.reason != null ? Text(r.reason!) : null,
                        trailing: IconButton(
                          tooltip: 'Remove',
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
                    child: Text(_saving ? 'Saving…' : _dirty ? 'Save changes' : 'Saved'),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _dayCard(int weekday) {
    final windows = _hours!.where((w) => w.weekday == weekday).toList()..sort((a, b) => a.start.compareTo(b.start));
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 96,
              child: Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(_dayNames[weekday], style: const TextStyle(fontWeight: FontWeight.w600)),
              ),
            ),
            Expanded(
              child: Wrap(
                spacing: 6,
                runSpacing: 6,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (windows.isEmpty) const Padding(padding: EdgeInsets.only(top: 10), child: Text('Off')),
                  for (final w in windows)
                    InputChip(
                      label: Text('${w.start}–${w.end}'),
                      onPressed: () async {
                        final start = await showTimePicker(context: context, initialTime: _parse(w.start), helpText: 'Start');
                        if (start == null || !mounted) return;
                        final end = await showTimePicker(context: context, initialTime: _parse(w.end), helpText: 'End');
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
                const PopupMenuItem(value: 'add', child: Text('Add hours')),
                if (windows.isNotEmpty) const PopupMenuItem(value: 'copy', child: Text('Copy to Sun–Thu')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
