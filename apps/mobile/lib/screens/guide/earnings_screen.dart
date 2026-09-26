import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/format.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';
import 'payout_account_screen.dart';

/// Owed balance, payout bank account and payout history for the guide.
class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});

  @override
  State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  late Future<GuideEarnings> _data = _load();

  Future<GuideEarnings> _load() => context.read<Repository>().earnings();

  Future<void> _refresh() {
    final next = _load();
    setState(() {
      _data = next;
    });
    return next.then((_) {}, onError: (_) {});
  }

  Future<void> _editAccount(PayoutAccount? current) async {
    final saved = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => PayoutAccountScreen(current: current)),
    );
    if (saved == true && mounted) _refresh();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(context.l10n.earningsTitle)),
      body: FutureBuilder<GuideEarnings>(
        future: _data,
        builder: (context, snap) {
          if (snap.hasError && !snap.hasData) return ErrorView(error: snap.error!, onRetry: _refresh);
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          return RefreshIndicator(onRefresh: _refresh, child: _body(snap.data!));
        },
      ),
    );
  }

  Widget _body(GuideEarnings e) {
    final l10n = context.l10n;
    final t = Theme.of(context).textTheme;
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsetsDirectional.all(16),
      children: [
        Text(l10n.earningsOwedTitle, style: t.titleMedium),
        const SizedBox(height: 4),
        Text(l10n.earningsOwedInfo, style: t.bodySmall),
        const SizedBox(height: 8),
        if (e.owed.isEmpty)
          Card(
            child: Padding(
              padding: const EdgeInsetsDirectional.all(16),
              child: Row(children: [
                Icon(Icons.savings_outlined, color: Theme.of(context).hintColor),
                const SizedBox(width: 12),
                Expanded(child: Text(l10n.earningsOwedEmpty)),
              ]),
            ),
          ),
        for (final o in e.owed)
          Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.account_balance_wallet_outlined)),
              // Amounts stay left-to-right inside Arabic text.
              title: Text(bidiLtr(formatMoney(o.amountMinor, o.currency)), style: t.headlineSmall),
              subtitle: Text(l10n.earningsFromPayments(o.paymentCount)),
            ),
          ),
        const SizedBox(height: 16),
        _accountCard(e.account),
        const SizedBox(height: 16),
        Text(l10n.earningsHistoryTitle, style: t.titleMedium),
        const SizedBox(height: 8),
        if (e.payouts.isEmpty)
          Padding(
            padding: const EdgeInsetsDirectional.symmetric(vertical: 8),
            child: EmptyView(icon: Icons.receipt_long_outlined, message: l10n.earningsHistoryEmpty),
          ),
        for (final p in e.payouts) _payoutTile(p),
      ],
    );
  }

  Widget _accountCard(PayoutAccount? a) {
    final l10n = context.l10n;
    final t = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    return Card(
      key: const ValueKey('payoutAccountCard'),
      color: a == null ? Color.alphaBlend(Colors.orange.withValues(alpha: 0.10), scheme.surface) : null,
      child: Padding(
        padding: const EdgeInsetsDirectional.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.account_balance_outlined, color: a == null ? Colors.orange : scheme.primary),
            const SizedBox(width: 8),
            Expanded(child: Text(l10n.earningsAccountTitle, style: t.titleMedium)),
          ]),
          const SizedBox(height: 8),
          if (a == null)
            Text(l10n.earningsAccountMissing)
          else ...[
            _row(l10n.earningsAccountHolder, Text(a.holderName)),
            _row(
              l10n.earningsAccountIban,
              Text(a.ibanMasked, key: const ValueKey('ibanMasked'), textDirection: TextDirection.ltr),
            ),
            if ((a.bankName ?? '').isNotEmpty) _row(l10n.earningsAccountBank, Text(a.bankName!)),
            // New or changed details are held for 24 hours before payouts use them.
            if (a.updatedAt != null && a.updatedAt!.add(const Duration(hours: 24)).isAfter(DateTime.now())) ...[
              const SizedBox(height: 6),
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.shield_outlined, size: 18, color: Colors.orange),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    l10n.earningsAccountHeld(bidiLtr(formatDateTime(a.updatedAt!.add(const Duration(hours: 24))))),
                    key: const ValueKey('payoutAccountHeld'),
                    style: t.bodySmall,
                  ),
                ),
              ]),
            ],
          ],
          const SizedBox(height: 8),
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: a == null
                ? FilledButton.icon(
                    onPressed: () => _editAccount(null),
                    icon: const Icon(Icons.add),
                    label: Text(l10n.earningsAccountAdd),
                  )
                : OutlinedButton.icon(
                    onPressed: () => _editAccount(a),
                    icon: const Icon(Icons.edit_outlined),
                    label: Text(l10n.earningsAccountChange),
                  ),
          ),
        ]),
      ),
    );
  }

  Widget _row(String label, Widget value) => Padding(
        padding: const EdgeInsetsDirectional.symmetric(vertical: 3),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 120, child: Text(label, style: Theme.of(context).textTheme.labelMedium)),
          Expanded(child: Align(alignment: AlignmentDirectional.centerStart, child: value)),
        ]),
      );

  Widget _payoutTile(Payout p) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final (label, color) = switch (p.status) {
      PayoutStatus.paid => (l10n.payoutStatusPaid, Colors.green),
      PayoutStatus.failed => (l10n.payoutStatusFailed, scheme.error),
      PayoutStatus.pending => (l10n.payoutStatusPending, Colors.orange),
    };
    final date = p.status == PayoutStatus.paid && p.paidAt != null
        ? l10n.earningsPaidOn(bidiLtr(formatDate(p.paidAt!)))
        : l10n.earningsCreatedOn(bidiLtr(formatDate(p.createdAt)));
    final note = (p.note ?? '').trim();
    final lines = [
      '$date · ${l10n.earningsPayoutTo(bidiLtr(p.ibanMasked))}',
      l10n.earningsFromPayments(p.paymentCount),
      if (note.isNotEmpty) p.status == PayoutStatus.paid ? l10n.earningsReference(bidiLtr(note)) : note,
    ];
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.12),
          child: Icon(
            switch (p.status) {
              PayoutStatus.paid => Icons.check,
              PayoutStatus.failed => Icons.error_outline,
              PayoutStatus.pending => Icons.schedule,
            },
            color: color,
          ),
        ),
        title: Text(bidiLtr(formatMoney(p.amountMinor, p.currency))),
        subtitle: Text(lines.join('\n')),
        isThreeLine: lines.length > 1,
        trailing: StatusChip(label, color: color),
      ),
    );
  }
}
