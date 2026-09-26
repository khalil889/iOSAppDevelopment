import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/session.dart';
import '../l10n/l10n.dart';
import 'guide/guide_dashboard_screen.dart';
import 'shared/account_screen.dart';
import 'shared/assistant_screen.dart';
import 'tourist/explore_screen.dart';
import 'tourist/trips_screen.dart';

/// Bottom navigation. Tabs depend on the mode: tourist (incl. guests) or guide.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final session = context.watch<Session>();
    final l10n = context.l10n;

    final tabs = session.isGuide
        ? [
            (Icons.dashboard_outlined, Icons.dashboard, l10n.tabDashboard, const GuideDashboardScreen()),
            (Icons.auto_awesome_outlined, Icons.auto_awesome, l10n.tabAssistant, const AssistantScreen()),
            (Icons.person_outline, Icons.person, l10n.tabAccount, const AccountScreen()),
          ]
        : [
            (Icons.explore_outlined, Icons.explore, l10n.tabExplore, const ExploreScreen()),
            (Icons.luggage_outlined, Icons.luggage, l10n.tabTrips, const TripsScreen()),
            (Icons.auto_awesome_outlined, Icons.auto_awesome, l10n.tabAssistant, const AssistantScreen()),
            (Icons.person_outline, Icons.person, l10n.tabAccount, const AccountScreen()),
          ];
    final index = _index.clamp(0, tabs.length - 1);

    return Scaffold(
      body: IndexedStack(index: index, children: [for (final t in tabs) t.$4]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: [
          for (final t in tabs) NavigationDestination(icon: Icon(t.$1), selectedIcon: Icon(t.$2), label: t.$3),
        ],
      ),
    );
  }
}
