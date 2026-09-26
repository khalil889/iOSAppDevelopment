import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import 'tour_form_screen.dart';

/// The guide's own tour packages: list, pause/resume, create and edit.
class MyToursScreen extends StatefulWidget {
  const MyToursScreen({super.key});

  @override
  State<MyToursScreen> createState() => _MyToursScreenState();
}

class _MyToursScreenState extends State<MyToursScreen> {
  List<GuideTour>? _tours;
  Object? _error;
  final Set<String> _toggling = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final tours = await context.read<Repository>().myTours();
      if (mounted) {
        setState(() {
          _tours = tours;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = e);
    }
  }

  void _replace(GuideTour t) {
    final list = [...?_tours];
    final i = list.indexWhere((x) => x.id == t.id);
    if (i >= 0) {
      list[i] = t;
    } else {
      list.insert(0, t);
    }
    setState(() => _tours = list);
  }

  Future<void> _open([GuideTour? tour]) async {
    final saved = await Navigator.push<GuideTour>(
      context,
      MaterialPageRoute(builder: (_) => TourFormScreen(tour: tour)),
    );
    if (saved != null && mounted) _replace(saved);
  }

  Future<void> _setActive(GuideTour tour, bool active) async {
    final repo = context.read<Repository>();
    final l10n = context.l10n;
    setState(() => _toggling.add(tour.id));
    try {
      final updated = await repo.updateTour(tour.id, {'isActive': active});
      if (!mounted) return;
      _replace(updated);
      showMessage(context, updated.isActive ? l10n.toursNowActive : l10n.toursNowPaused);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _toggling.remove(tour.id));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final tours = _tours;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.toursTitle)),
      floatingActionButton: tours == null || tours.isEmpty
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _open(),
              icon: const Icon(Icons.add),
              label: Text(l10n.toursAdd),
            ),
      body: switch ((tours, _error)) {
        (null, final Object e) => ErrorView(error: e, onRetry: () {
            setState(() => _error = null);
            _load();
          }),
        (null, _) => const Center(child: CircularProgressIndicator()),
        (final List<GuideTour> list, _) => RefreshIndicator(
            onRefresh: _load,
            child: list.isEmpty
                ? LayoutBuilder(
                    builder: (context, box) => ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: box.maxHeight,
                          child: EmptyView(
                            icon: Icons.tour_outlined,
                            message: l10n.toursEmpty,
                            action: FilledButton.icon(
                              onPressed: () => _open(),
                              icon: const Icon(Icons.add),
                              label: Text(l10n.toursCreateFirst),
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsetsDirectional.fromSTEB(16, 16, 16, 96),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _tile(list[i]),
                  ),
          ),
      },
    );
  }

  Widget _tile(GuideTour t) {
    final l10n = context.l10n;
    final ar = context.isArabic;
    final theme = Theme.of(context);
    final price = bidiLtr(formatMoney(t.priceMinor, t.currency));
    final city = t.city?.displayName(ar);
    return Card(
      clipBehavior: Clip.antiAlias,
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: () => _open(t),
        child: Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(12, 12, 4, 12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              NetImage(t.coverUrl, width: 80, height: 80, icon: Icons.tour_outlined),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.displayTitle(ar), style: theme.textTheme.titleMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(
                      [if (city != null && city.isNotEmpty) city, formatDuration(t.durationMinutes)].join(' · '),
                      style: theme.textTheme.bodySmall,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      t.perPerson ? l10n.toursPricePerPerson(price) : l10n.toursPricePerGroup(price),
                      style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 6),
                    StatusChip(
                      t.isActive ? l10n.toursActive : l10n.toursPaused,
                      color: t.isActive ? Colors.green.shade700 : theme.hintColor,
                    ),
                  ],
                ),
              ),
              Semantics(
                label: l10n.toursActiveToggle,
                child: Switch(
                  value: t.isActive,
                  onChanged: _toggling.contains(t.id) ? null : (v) => _setActive(t, v),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
