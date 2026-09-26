import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Rate a completed tour (the API enforces: completed, own booking, once, within 30 days).
class ReviewScreen extends StatefulWidget {
  const ReviewScreen({super.key, required this.booking});
  final Booking booking;

  @override
  State<ReviewScreen> createState() => _ReviewScreenState();
}

class _ReviewScreenState extends State<ReviewScreen> {
  int _rating = 0;
  final _comment = TextEditingController();
  bool _busy = false;

  static String _label(AppLocalizations l10n, int rating) => switch (rating) {
        1 => l10n.reviewRatingPoor,
        2 => l10n.reviewRatingFair,
        3 => l10n.reviewRatingGood,
        4 => l10n.reviewRatingGreat,
        5 => l10n.reviewRatingOutstanding,
        _ => '',
      };

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      await context.read<Repository>().review(widget.booking.id, _rating, _comment.text.trim());
      if (!mounted) return;
      showMessage(context, context.l10n.reviewThanks);
      Navigator.pop(context, true);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final b = widget.booking;
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.reviewTitle)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(child: Avatar(name: b.guide?.name ?? '', url: b.guide?.avatarUrl, radius: 40)),
          const SizedBox(height: 12),
          Text(l10n.reviewPrompt(b.package?.title ?? l10n.reviewYourTour, b.guide?.name ?? l10n.reviewYourGuide),
              textAlign: TextAlign.center, style: t.titleMedium),
          Text(formatDate(b.startAt), textAlign: TextAlign.center, style: t.bodySmall),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final filled = i < _rating;
              return IconButton(
                iconSize: 44,
                tooltip: _label(l10n, i + 1),
                onPressed: () => setState(() => _rating = i + 1),
                icon: Icon(filled ? Icons.star_rounded : Icons.star_outline_rounded, color: Colors.amber.shade700),
              );
            }),
          ),
          Text(_label(l10n, _rating), textAlign: TextAlign.center, style: t.titleSmall),
          const SizedBox(height: 24),
          TextField(
            controller: _comment,
            maxLines: 5,
            maxLength: 2000,
            decoration: InputDecoration(
              labelText: l10n.reviewCommentLabel,
              alignLabelWithHint: true,
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(
            onPressed: _rating == 0 || _busy ? null : _submit,
            style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(52)),
            child: Text(_busy ? l10n.reviewSubmitting : l10n.reviewSubmit),
          ),
        ),
      ),
    );
  }
}
