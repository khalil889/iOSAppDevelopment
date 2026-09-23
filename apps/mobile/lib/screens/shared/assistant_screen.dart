import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import '../tourist/guide_profile_screen.dart';
import '../tourist/site_guides_screen.dart';

/// Chat with the AI travel assistant (provider is pluggable on the API side).
class AssistantScreen extends StatefulWidget {
  const AssistantScreen({super.key});

  @override
  State<AssistantScreen> createState() => _AssistantScreenState();
}

class _AssistantScreenState extends State<AssistantScreen> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _thinking = false;

  static const _starters = [
    'Plan 2 days in AlUla',
    'Find me a guide in Cairo',
    'What should I see in Riyadh?',
    'Is it safe to hike in Petra?',
  ];

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  Future<void> _send(String text) async {
    text = text.trim();
    if (text.isEmpty || _thinking) return;
    _input.clear();
    setState(() {
      _messages.add(ChatMessage(role: 'user', content: text));
      _thinking = true;
    });
    _scrollToEnd();
    try {
      final reply = await context.read<Repository>().chat(_messages);
      if (mounted) setState(() => _messages.add(reply));
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _thinking = false);
      _scrollToEnd();
    }
  }

  void _scrollToEnd() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) {
          _scroll.animateTo(_scroll.position.maxScrollExtent + 80, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
        }
      });

  Future<void> _openSuggestion(Suggestion s) async {
    if (s.type == 'guide') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => GuideProfileScreen(guideId: s.id)));
      return;
    }
    final repo = context.read<Repository>();
    try {
      final sites = await repo.sites(q: s.title, limit: 1);
      if (!mounted || sites.isEmpty) return;
      Navigator.push(context, MaterialPageRoute(builder: (_) => SiteGuidesScreen(site: sites.first)));
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: const Row(children: [Icon(Icons.auto_awesome), SizedBox(width: 8), Text('Travel assistant')]),
        actions: [
          if (_messages.isNotEmpty)
            IconButton(tooltip: 'New chat', onPressed: () => setState(_messages.clear), icon: const Icon(Icons.add_comment_outlined)),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty
                ? ListView(
                    padding: const EdgeInsets.all(24),
                    children: [
                      const SizedBox(height: 24),
                      Icon(Icons.travel_explore, size: 56, color: scheme.primary),
                      const SizedBox(height: 12),
                      const Text(
                        'Ask me about places to visit, itineraries or finding a licensed guide.',
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.center,
                        children: [for (final s in _starters) ActionChip(label: Text(s), onPressed: () => _send(s))],
                      ),
                    ],
                  )
                : ListView.builder(
                    controller: _scroll,
                    padding: const EdgeInsets.all(12),
                    itemCount: _messages.length + (_thinking ? 1 : 0),
                    itemBuilder: (_, i) => i == _messages.length ? const _Typing() : _bubble(_messages[i]),
                  ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 4, 12, 8),
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: _send,
                    decoration: const InputDecoration(hintText: 'Ask anything…', isDense: true),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(onPressed: _thinking ? null : () => _send(_input.text), icon: const Icon(Icons.send)),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _bubble(ChatMessage m) {
    final scheme = Theme.of(context).colorScheme;
    final mine = m.role == 'user';
    return Align(
      alignment: mine ? Alignment.centerRight : Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.82),
        child: Column(
          crossAxisAlignment: mine ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              margin: const EdgeInsets.symmetric(vertical: 4),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: mine ? scheme.primary : scheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(16).copyWith(
                  bottomRight: mine ? const Radius.circular(4) : null,
                  bottomLeft: mine ? null : const Radius.circular(4),
                ),
              ),
              child: Text(m.content, style: TextStyle(color: mine ? scheme.onPrimary : scheme.onSurface)),
            ),
            if (m.suggestions.isNotEmpty)
              Wrap(spacing: 6, runSpacing: 6, children: [
                for (final s in m.suggestions)
                  ActionChip(
                    avatar: Icon(s.type == 'guide' ? Icons.person : Icons.place, size: 16),
                    label: Text(s.title),
                    onPressed: () => _openSuggestion(s),
                  ),
              ]),
          ],
        ),
      ),
    );
  }
}

class _Typing extends StatelessWidget {
  const _Typing();

  @override
  Widget build(BuildContext context) => const Align(
        alignment: Alignment.centerLeft,
        child: Padding(
          padding: EdgeInsets.all(12),
          child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
        ),
      );
}
