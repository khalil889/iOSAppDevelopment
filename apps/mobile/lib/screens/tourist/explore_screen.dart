import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../core/session.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/cards.dart';
import '../../widgets/common.dart';
import 'guide_profile_screen.dart';
import 'site_guides_screen.dart';

const _categories = ['HERITAGE', 'MUSEUM', 'NATURE', 'RELIGIOUS', 'CITY', 'ADVENTURE', 'FOOD'];
const _languages = {'en': 'English', 'ar': 'Arabic', 'fr': 'French', 'de': 'German', 'es': 'Spanish', 'it': 'Italian', 'ur': 'Urdu'};

/// Search sites and licensed guides with filters.
class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> with SingleTickerProviderStateMixin {
  late final _tabs = TabController(length: 2, vsync: this)..addListener(() => setState(() {}));
  final _search = TextEditingController();
  Timer? _debounce;

  List<City> _cities = [];
  String? _cityId;
  String? _category;
  String? _language;
  double? _minRating;
  String _sort = 'rating';

  late Future<List<Site>> _sites;
  late Future<List<GuideSummary>> _guides;

  Repository get _repo => context.read<Repository>();

  @override
  void initState() {
    super.initState();
    _reload();
    _repo.cities().then((c) => mounted ? setState(() => _cities = c) : null).catchError((_) => null);
  }

  @override
  void dispose() {
    _tabs.dispose();
    _search.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _reload() {
    final q = _search.text.trim();
    setState(() {
      _sites = _repo.sites(q: q, cityId: _cityId, category: _category);
      _guides = _repo.guides(q: q, cityId: _cityId, language: _language, minRating: _minRating, sort: _sort);
    });
  }

  void _onSearchChanged(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), _reload);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<Session>().user;
    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, _) => [
          SliverAppBar(
            pinned: true,
            floating: true,
            expandedHeight: 120,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: const EdgeInsetsDirectional.only(start: 16, bottom: 62),
              title: Text(user == null ? 'Explore' : 'Hi ${user.firstName} 👋'),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(56),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: SearchBar(
                  controller: _search,
                  hintText: 'Search sites, guides, cities',
                  leading: const Icon(Icons.search),
                  onChanged: _onSearchChanged,
                  elevation: const WidgetStatePropertyAll(0),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(child: _filters()),
          SliverPersistentHeader(pinned: true, delegate: _TabHeader(TabBar(controller: _tabs, tabs: const [Tab(text: 'Places'), Tab(text: 'Guides')]))),
        ],
        body: TabBarView(controller: _tabs, children: [_siteList(), _guideList()]),
      ),
    );
  }

  Widget _filters() {
    final guidesTab = _tabs.index == 1;
    return SizedBox(
      height: 52,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: [
          _menuChip<String?>(
            label: _cityId == null ? 'Any city' : _cities.firstWhere((c) => c.id == _cityId, orElse: () => City(id: '', name: 'City')).name,
            selected: _cityId != null,
            items: {null: 'Any city', for (final c in _cities) c.id: '${c.name}, ${c.country ?? ''}'},
            onSelected: (v) => _cityId = v,
          ),
          if (!guidesTab)
            for (final c in _categories)
              Padding(
                padding: const EdgeInsets.only(left: 6),
                child: FilterChip(
                  label: Text(titleCase(c)),
                  selected: _category == c,
                  onSelected: (sel) {
                    _category = sel ? c : null;
                    _reload();
                  },
                ),
              ),
          if (guidesTab) ...[
            _menuChip<String?>(
              label: _language == null ? 'Any language' : _languages[_language]!,
              selected: _language != null,
              items: {null: 'Any language', ..._languages},
              onSelected: (v) => _language = v,
            ),
            Padding(
              padding: const EdgeInsets.only(left: 6),
              child: FilterChip(
                label: const Text('4.5★+'),
                selected: _minRating != null,
                onSelected: (sel) {
                  _minRating = sel ? 4.5 : null;
                  _reload();
                },
              ),
            ),
            _menuChip<String>(
              label: {'rating': 'Top rated', 'price': 'Lowest price', 'experience': 'Most experienced'}[_sort]!,
              selected: false,
              items: const {'rating': 'Top rated', 'price': 'Lowest price', 'experience': 'Most experienced'},
              onSelected: (v) => _sort = v ?? 'rating',
              icon: Icons.sort,
            ),
          ],
        ],
      ),
    );
  }

  Widget _menuChip<T>({
    required String label,
    required bool selected,
    required Map<T, String> items,
    required void Function(T?) onSelected,
    IconData icon = Icons.arrow_drop_down,
  }) {
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: PopupMenuButton<T>(
        itemBuilder: (_) => [for (final e in items.entries) PopupMenuItem(value: e.key, child: Text(e.value))],
        onSelected: (v) {
          onSelected(v);
          _reload();
        },
        child: Chip(
          label: Text(label),
          avatar: Icon(icon, size: 18),
          backgroundColor: selected ? Theme.of(context).colorScheme.secondaryContainer : null,
        ),
      ),
    );
  }

  Widget _siteList() => FutureBuilder<List<Site>>(
        future: _sites,
        builder: (context, snap) {
          if (snap.hasError) return ErrorView(error: snap.error!, onRetry: _reload);
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final sites = snap.data!;
          if (sites.isEmpty) return const EmptyView(icon: Icons.travel_explore, message: 'No places match your filters.');
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: sites.length,
              itemBuilder: (_, i) => SiteCard(
                site: sites[i],
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => SiteGuidesScreen(site: sites[i]))),
              ),
            ),
          );
        },
      );

  Widget _guideList() => FutureBuilder<List<GuideSummary>>(
        future: _guides,
        builder: (context, snap) {
          if (snap.hasError) return ErrorView(error: snap.error!, onRetry: _reload);
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final guides = snap.data!;
          if (guides.isEmpty) return const EmptyView(icon: Icons.person_search, message: 'No licensed guides match your filters.');
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: guides.length,
              itemBuilder: (_, i) => GuideCard(
                guide: guides[i],
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => GuideProfileScreen(guideId: guides[i].id))),
              ),
            ),
          );
        },
      );
}

class _TabHeader extends SliverPersistentHeaderDelegate {
  _TabHeader(this.tabBar);
  final TabBar tabBar;

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) =>
      Material(color: Theme.of(context).colorScheme.surface, child: tabBar);

  @override
  bool shouldRebuild(covariant _TabHeader old) => old.tabBar != tabBar;
}
