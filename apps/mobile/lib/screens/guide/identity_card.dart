import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Opens the identity provider's hosted page; returns false if it couldn't.
typedef UrlOpener = Future<bool> Function(Uri url);

Future<bool> _launch(Uri url) async {
  try {
    return await launchUrl(url, mode: LaunchMode.externalApplication);
  } catch (_) {
    return false;
  }
}

/// Identity check (ID document + selfie) status with the action to start or
/// retry it. The result arrives by webhook, so the dashboard re-reads the
/// status when the app resumes and [onChanged] is called after each attempt.
class IdentityCard extends StatefulWidget {
  const IdentityCard({super.key, required this.status, this.comment, this.onChanged, this.openUrl});

  final IdentityStatus status;
  final String? comment;
  final VoidCallback? onChanged;
  final UrlOpener? openUrl;

  @override
  State<IdentityCard> createState() => _IdentityCardState();
}

class _IdentityCardState extends State<IdentityCard> {
  late IdentityStatus _status = widget.status;
  bool _busy = false;
  bool _openedBrowser = false;

  @override
  void didUpdateWidget(IdentityCard old) {
    super.didUpdateWidget(old);
    if (old.status != widget.status) {
      _status = widget.status;
      if (_status != IdentityStatus.notStarted) _openedBrowser = false;
    }
  }

  Future<void> _start() async {
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      final res = await context.read<Repository>().startIdentityCheck();
      if (!mounted) return;
      final url = res.url == null ? null : Uri.tryParse(res.url!);
      setState(() => _status = res.status);
      if (url != null) {
        final opened = await (widget.openUrl ?? _launch)(url);
        if (!mounted) return;
        if (opened) {
          setState(() => _openedBrowser = true);
        } else {
          showMessage(context, l10n.identityOpenFailed);
        }
      }
      widget.onChanged?.call();
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final (color, icon, label, body) = switch (_status) {
      IdentityStatus.approved => (Colors.green, Icons.verified_user, l10n.identityStatusApproved, l10n.identityApprovedBody),
      IdentityStatus.pending => (Colors.orange, Icons.hourglass_top, l10n.identityStatusPending, l10n.identityPendingBody),
      IdentityStatus.retry => (Colors.orange, Icons.replay, l10n.identityStatusRetry, l10n.identityRetryBody),
      IdentityStatus.rejected => (scheme.error, Icons.gpp_bad_outlined, l10n.identityStatusRejected, l10n.identityRejectedBody),
      IdentityStatus.notStarted => (scheme.primary, Icons.badge_outlined, l10n.identityStatusNotStarted, l10n.identityExplain),
    };
    final canStart = _status == IdentityStatus.notStarted || _status == IdentityStatus.retry;
    final comment = widget.comment?.trim();
    return Card(
      key: const ValueKey('identityCard'),
      child: Padding(
        padding: const EdgeInsetsDirectional.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(icon, color: color),
            const SizedBox(width: 8),
            Expanded(child: Text(l10n.identityTitle, style: Theme.of(context).textTheme.titleMedium)),
            StatusChip(label, color: color),
          ]),
          const SizedBox(height: 6),
          Text(body),
          if (_status == IdentityStatus.retry) ...[
            if (comment != null && comment.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(l10n.identityReviewerNote(comment), style: TextStyle(color: scheme.onSurfaceVariant)),
            ],
            const SizedBox(height: 4),
            Text(l10n.identityExplain, style: Theme.of(context).textTheme.bodySmall),
          ],
          if (_openedBrowser && canStart) ...[
            const SizedBox(height: 6),
            Text(l10n.identityReturnHint, style: Theme.of(context).textTheme.bodySmall),
          ],
          if (canStart) ...[
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _busy ? null : _start,
              icon: const Icon(Icons.camera_front_outlined),
              label: Text(_busy
                  ? l10n.identityStarting
                  : _status == IdentityStatus.retry
                      ? l10n.identityTryAgain
                      : l10n.identityStart),
            ),
          ],
        ]),
      ),
    );
  }
}
