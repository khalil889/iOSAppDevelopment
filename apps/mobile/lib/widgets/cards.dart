import 'package:flutter/material.dart';

import '../core/format.dart';
import '../l10n/l10n.dart';
import '../l10n/labels.dart';
import '../models/models.dart';
import 'common.dart';

class GuideCard extends StatelessWidget {
  const GuideCard({super.key, required this.guide, required this.onTap});
  final GuideSummary guide;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Avatar(name: guide.name, url: guide.avatarUrl, radius: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(child: Text(guide.name, style: t.titleMedium, overflow: TextOverflow.ellipsis)),
                        const SizedBox(width: 6),
                        if (guide.verified) const VerifiedBadge(compact: true),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      guide.cities.map((c) => c.name).join(' · '),
                      style: t.bodySmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        RatingStars(rating: guide.ratingAvg, count: guide.ratingCount),
                        const SizedBox(width: 12),
                        Icon(Icons.translate, size: 14, color: Theme.of(context).hintColor),
                        const SizedBox(width: 4),
                        Text(guide.languages.map((l) => l.toUpperCase()).join(' '), style: t.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),
              if (guide.fromPriceMinor != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(context.l10n.widgetFromPrice, style: t.labelSmall),
                    Text(formatMoney(guide.fromPriceMinor!, guide.currency ?? 'USD'), style: t.titleSmall),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class SiteCard extends StatelessWidget {
  const SiteCard({super.key, required this.site, required this.onTap});
  final Site site;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            NetImage(site.imageUrl, height: 140, width: double.infinity, radius: 0),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(site.name, style: t.titleMedium),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      StatusChip(context.l10n.siteCategory(site.category)),
                      const SizedBox(width: 8),
                      if (site.city != null) Text(site.city!.name, style: t.bodySmall),
                      if (site.distanceKm != null) Text(' · ${context.l10n.widgetDistanceKm(site.distanceKm!.toStringAsFixed(1))}', style: t.bodySmall),
                      const Spacer(),
                      if (site.requiresLicensedGuide)
                        Tooltip(
                          message: context.l10n.widgetLicensedGuideRequired,
                          child: Icon(Icons.badge_outlined, size: 18, color: Theme.of(context).colorScheme.primary),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
