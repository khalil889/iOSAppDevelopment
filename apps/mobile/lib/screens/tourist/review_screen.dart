import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
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

  static const _labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Outstanding'];

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
      showMessage(context, 'Thanks for your review!');
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
    return Scaffold(
      appBar: AppBar(title: const Text('Review your tour')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(child: Avatar(name: b.guide?.name ?? '', url: b.guide?.avatarUrl, radius: 40)),
          const SizedBox(height: 12),
          Text('How was ${b.package?.title ?? 'your tour'} with ${b.guide?.name ?? 'your guide'}?',
              textAlign: TextAlign.center, style: t.titleMedium),
          Text(formatDate(b.startAt), textAlign: TextAlign.center, style: t.bodySmall),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (i) {
              final filled = i < _rating;
              return IconButton(
                iconSize: 44,
                tooltip: _labels[i + 1],
                onPressed: () => setState(() => _rating = i + 1),
                icon: Icon(filled ? Icons.star_rounded : Icons.star_outline_rounded, color: Colors.amber.shade700),
              );
            }),
          ),
          Text(_labels[_rating], textAlign: TextAlign.center, style: t.titleSmall),
          const SizedBox(height: 24),
          TextField(
            controller: _comment,
            maxLines: 5,
            maxLength: 2000,
            decoration: const InputDecoration(
              labelText: 'Tell other travellers about it (optional)',
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
            child: Text(_busy ? 'Submitting…' : 'Submit review'),
          ),
        ),
      ),
    );
  }
}
