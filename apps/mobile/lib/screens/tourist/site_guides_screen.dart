import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../l10n/l10n.dart';
import '../../l10n/labels.dart';
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
    final l10n = context.l10n;
    final country = s.city?.country;
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
                  StatusChip(l10n.siteCategory(s.category)),
                  const SizedBox(width: 8),
                  if (s.city != null)
                    Flexible(
                      child:
                          Text(country == null || country.isEmpty ? s.city!.name : l10n.siteGuidesCityWithCountry(s.city!.name, country)),
                    ),
                ]),
                const SizedBox(height: 12),
                Text(s.description, style: t.bodyLarge),
                if (s.requiresLicensedGuide) ...[
                  const SizedBox(height: 12),
                  Card(
                    child: ListTile(
                      leading: const Icon(Icons.badge_outlined),
                      title: Text(l10n.siteGuidesLicenseRequired),
                      subtitle: Text(l10n.siteGuidesLicenseRequiredBody),
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                Text(l10n.siteGuidesHeading, style: t.titleLarge),
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
                return SliverToBoxAdapter(
                  child: EmptyView(icon: Icons.person_search, message: l10n.siteGuidesEmpty),
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
