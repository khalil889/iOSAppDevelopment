import 'package:flutter/material.dart';

import '../l10n/l10n.dart';

/// Network image with a neutral placeholder when loading fails or offline.
class NetImage extends StatelessWidget {
  const NetImage(this.url, {super.key, this.height, this.width, this.radius = 12, this.icon = Icons.landscape});

  final String? url;
  final double? height, width;
  final double radius;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final placeholder = Container(
      height: height,
      width: width,
      color: scheme.surfaceContainerHighest,
      alignment: Alignment.center,
      child: Icon(icon, color: scheme.onSurfaceVariant),
    );
    return ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: url == null
          ? placeholder
          : Image.network(
              url!,
              height: height,
              width: width,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => placeholder,
              loadingBuilder: (_, child, progress) => progress == null ? child : placeholder,
            ),
    );
  }
}

class Avatar extends StatelessWidget {
  const Avatar({super.key, required this.name, this.url, this.radius = 24});
  final String name;
  final String? url;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final initials = name.trim().split(RegExp(r'\s+')).take(2).map((w) => w.isEmpty ? '' : w[0]).join().toUpperCase();
    return CircleAvatar(
      radius: radius,
      foregroundImage: url != null ? NetworkImage(url!) : null,
      onForegroundImageError: url != null ? (_, __) {} : null,
      child: Text(initials, style: TextStyle(fontSize: radius * 0.7)),
    );
  }
}

class RatingStars extends StatelessWidget {
  const RatingStars({super.key, required this.rating, this.count, this.size = 16});
  final double rating;
  final int? count;
  final double size;

  @override
  Widget build(BuildContext context) {
    final color = Colors.amber.shade700;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.star_rounded, size: size + 2, color: color),
        const SizedBox(width: 2),
        Text(
          count == 0 ? context.l10n.ratingNew : rating.toStringAsFixed(1),
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: size - 2),
        ),
        if (count != null && count! > 0)
          Text(' ($count)', style: TextStyle(fontSize: size - 3, color: Theme.of(context).hintColor)),
      ],
    );
  }
}

class VerifiedBadge extends StatelessWidget {
  const VerifiedBadge({super.key, this.compact = false});
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: compact ? 6 : 8, vertical: 2),
      decoration: BoxDecoration(color: scheme.primaryContainer, borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.verified, size: 14, color: scheme.primary),
          if (!compact) ...[
            const SizedBox(width: 4),
            Text('Licensed', style: TextStyle(fontSize: 12, color: scheme.onPrimaryContainer, fontWeight: FontWeight.w600)),
          ],
        ],
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip(this.label, {super.key, this.color});
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final c = color ?? Theme.of(context).colorScheme.secondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: c, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}

/// Error block with retry, used by FutureBuilders.
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error, this.onRetry});
  final Object error;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 40),
            const SizedBox(height: 8),
            Text(errorText(context, error), textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ],
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({super.key, required this.icon, required this.message, this.action});
  final IconData icon;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 48, color: Theme.of(context).hintColor),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            if (action != null) ...[const SizedBox(height: 16), action!],
          ],
        ),
      ),
    );
  }
}

void showError(BuildContext context, Object e) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(errorText(context, e))));
}

void showMessage(BuildContext context, String msg) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(msg)));
}
