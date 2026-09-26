import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/session.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import '../auth/require_sign_in.dart';
import 'booking_screen.dart';

class GuideProfileScreen extends StatefulWidget {
  const GuideProfileScreen({super.key, required this.guideId});
  final String guideId;

  @override
  State<GuideProfileScreen> createState() => _GuideProfileScreenState();
}

class _GuideProfileScreenState extends State<GuideProfileScreen> {
  late Future<GuideProfile> _profile = _load();

  Future<GuideProfile> _load() => context.read<Repository>().guideProfile(widget.guideId);

  Future<void> _book(GuideProfile p, TourPackage pkg) async {
    if (!await requireSignIn(context) || !mounted) return;
    if (context.read<Session>().isGuide) {
      showMessage(context, context.l10n.guideProfileTouristOnly);
      return;
    }
    Navigator.push(context, MaterialPageRoute(builder: (_) => BookingScreen(guide: p.guide, package: pkg)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: FutureBuilder<GuideProfile>(
        future: _profile,
        builder: (context, snap) {
          if (snap.hasError) return ErrorView(error: snap.error!, onRetry: () => setState(() => _profile = _load()));
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          return _body(snap.data!);
        },
      ),
    );
  }

  Widget _body(GuideProfile p) {
    final g = p.guide;
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    final sep = l10n.guideProfileListSeparator;
    return ListView(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 0, 16, 32),
      children: [
        Row(
          children: [
            Avatar(name: g.name, url: g.avatarUrl, radius: 40),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(g.name, style: t.headlineSmall),
                  const SizedBox(height: 4),
                  Wrap(spacing: 8, runSpacing: 4, crossAxisAlignment: WrapCrossAlignment.center, children: [
                    if (g.verified) const VerifiedBadge(),
                    RatingStars(rating: g.ratingAvg, count: g.ratingCount),
                  ]),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                _fact(Icons.badge_outlined, l10n.guideProfileLicense,
                    [g.licenseNumber ?? '—', if ((g.licenseCountry ?? '').isNotEmpty) g.licenseCountry!].join(' · ')),
                _fact(Icons.translate, l10n.guideProfileLanguages, g.languages.map((l) => l.toUpperCase()).join(sep)),
                _fact(Icons.workspace_premium_outlined, l10n.guideProfileExperience, l10n.guideProfileYears(g.yearsOfExperience)),
                _fact(Icons.location_city, l10n.guideProfileCities, g.cities.map((c) => c.name).join(sep)),
              ],
            ),
          ),
        ),
        if (g.bio.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(g.bio, style: t.bodyLarge),
        ],
        const SizedBox(height: 20),
        Text(l10n.guideProfileTours, style: t.titleLarge),
        if (p.packages.isEmpty) Padding(padding: const EdgeInsets.all(8), child: Text(l10n.guideProfileNoTours)),
        for (final pkg in p.packages) _packageCard(p, pkg),
        const SizedBox(height: 20),
        Text(l10n.guideProfileReviews, style: t.titleLarge),
        if (p.reviews.isEmpty) Padding(padding: const EdgeInsets.all(8), child: Text(l10n.guideProfileNoReviews)),
        for (final r in p.reviews)
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Avatar(name: r.author, radius: 18),
            title: Row(children: [
              Text(r.author),
              const SizedBox(width: 8),
              ...List.generate(
                  5, (i) => Icon(i < r.rating ? Icons.star_rounded : Icons.star_outline_rounded, size: 16, color: Colors.amber.shade700)),
            ]),
            subtitle: Text(r.comment),
          ),
      ],
    );
  }

  Widget _fact(IconData icon, String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(children: [
          Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
          const SizedBox(width: 10),
          SizedBox(width: 90, child: Text(label, style: TextStyle(color: Theme.of(context).hintColor))),
          Expanded(child: Text(value)),
        ]),
      );

  Widget _packageCard(GuideProfile p, TourPackage pkg) {
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(pkg.title, style: t.titleMedium),
            const SizedBox(height: 4),
            Text(pkg.description),
            const SizedBox(height: 8),
            Wrap(spacing: 12, runSpacing: 4, children: [
              _meta(Icons.schedule, formatDuration(pkg.durationMinutes)),
              _meta(Icons.group_outlined, l10n.guideProfileUpTo(pkg.maxGroupSize)),
              if (pkg.cityName != null) _meta(Icons.place_outlined, pkg.cityName!),
            ]),
            if (pkg.sites.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(l10n.guideProfileVisits(pkg.sites.map((s) => s.name).join(l10n.guideProfileListSeparator)), style: t.bodySmall),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                Text(formatMoney(pkg.priceMinor, pkg.currency), style: t.titleLarge),
                Text(pkg.perPerson ? l10n.guideProfilePerPerson : l10n.guideProfilePerGroup, style: t.bodySmall),
                const Spacer(),
                FilledButton(onPressed: () => _book(p, pkg), child: Text(l10n.guideProfileBook)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _meta(IconData icon, String text) => Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 16, color: Theme.of(context).hintColor),
        const SizedBox(width: 4),
        Text(text),
      ]);
}
