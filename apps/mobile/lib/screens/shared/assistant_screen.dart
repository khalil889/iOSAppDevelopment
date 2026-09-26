import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../l10n/l10n.dart';
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

  List<String> _starters(AppLocalizations l10n) => [
        l10n.assistantStarter1,
        l10n.assistantStarter2,
        l10n.assistantStarter3,
        l10n.assistantStarter4,
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
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [const Icon(Icons.auto_awesome), const SizedBox(width: 8), Text(l10n.assistantTitle)]),
        actions: [
          if (_messages.isNotEmpty)
            IconButton(tooltip: l10n.assistantNewChat, onPressed: () => setState(_messages.clear), icon: const Icon(Icons.add_comment_outlined)),
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
                      Text(
                        l10n.assistantIntro,
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        alignment: WrapAlignment.center,
                        children: [for (final s in _starters(l10n)) ActionChip(label: Text(s), onPressed: () => _send(s))],
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
              padding: const EdgeInsetsDirectional.fromSTEB(12, 4, 12, 8),
              child: Row(children: [
                Expanded(
                  child: TextField(
                    controller: _input,
                    minLines: 1,
                    maxLines: 4,
                    textInputAction: TextInputAction.send,
                    onSubmitted: _send,
                    decoration: InputDecoration(hintText: l10n.assistantInputHint, isDense: true),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton.filled(
                  tooltip: l10n.assistantSend,
                  // Icons.send mirrors itself in right-to-left layouts.
                  onPressed: _thinking ? null : () => _send(_input.text), icon: const Icon(Icons.send)),
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
    const tail = Radius.circular(4);
    const round = Radius.circular(16);
    // The user's messages sit on the end side (right in LTR, left in RTL).
    return Align(
      alignment: mine ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
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
                borderRadius: BorderRadiusDirectional.only(
                  topStart: round,
                  topEnd: round,
                  bottomEnd: mine ? tail : round,
                  bottomStart: mine ? round : tail,
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
  Widget build(BuildContext context) => Align(
        alignment: AlignmentDirectional.centerStart,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Semantics(
            label: context.l10n.assistantThinking,
            child: const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
          ),
        ),
      );
}
