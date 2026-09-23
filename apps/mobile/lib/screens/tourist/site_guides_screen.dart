import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/cards.dart';
import '../../widgets/common.dart';
import 'guide_profile_screen.dart';

/// Site details plus the licensed guides who cover it.
class SiteGuidesScreen extends StatefulWidget {
  const SiteGuidesScreen({super.key, required this.site});
  final Site site;

  @override
  State<SiteGuidesScreen> createState() => _SiteGuidesScreenState();
}

class _SiteGuidesScreenState extends State<SiteGuidesScreen> {
  late Future<List<GuideSummary>> _guides = _load();

  Future<List<GuideSummary>> _load() => context.read<Repository>().guides(siteId: widget.site.id);

  @override
  Widget build(BuildContext context) {
    final s = widget.site;
    final t = Theme.of(context).textTheme;
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 220,
            flexibleSpace: FlexibleSpaceBar(
              title: Text(s.name, maxLines: 1, overflow: TextOverflow.ellipsis),
              background: NetImage(s.imageUrl, radius: 0),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList.list(
              children: [
                Row(children: [
                  StatusChip(titleCase(s.category)),
                  const SizedBox(width: 8),
                  if (s.city != null) Text('${s.city!.name}${s.city!.country != null ? ', ${s.city!.country}' : ''}'),
                ]),
                const SizedBox(height: 12),
                Text(s.description, style: t.bodyLarge),
                if (s.requiresLicensedGuide) ...[
                  const SizedBox(height: 12),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.badge_outlined),
                      title: const Text('Licensed guide required'),
                      subtitle: const Text('Every guide below holds a verified tourism license.'),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                Text('Guides for this place', style: t.titleLarge),
              ],
            ),
          ),
          FutureBuilder<List<GuideSummary>>(
            future: _guides,
            builder: (context, snap) {
              if (snap.hasError) {
                return SliverToBoxAdapter(
                  child: ErrorView(error: snap.error!, onRetry: () => setState(() => _guides = _load())),
                );
              }
              if (!snap.hasData) {
                return const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator()));
              }
              if (snap.data!.isEmpty) {
                return const SliverToBoxAdapter(
                  child: EmptyView(icon: Icons.person_search, message: 'No guides cover this place yet.'),
                );
              }
              return SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                sliver: SliverList.builder(
                  itemCount: snap.data!.length,
                  itemBuilder: (_, i) => GuideCard(
                    guide: snap.data![i],
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => GuideProfileScreen(guideId: snap.data![i].id)),
                    ),
                  ),
                ),
              );
            },
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}
