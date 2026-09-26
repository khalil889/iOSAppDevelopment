import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/iban.dart';
import '../../l10n/l10n.dart';
import '../../models/models.dart';
import '../../services/repository.dart';
import '../../widgets/common.dart';

/// Add or replace the bank account payouts are sent to. Pops with `true`
/// after saving.
class PayoutAccountScreen extends StatefulWidget {
  const PayoutAccountScreen({super.key, this.current});

  /// The saved account, if any (its IBAN is masked, so it isn't prefilled).
  final PayoutAccount? current;

  @override
  State<PayoutAccountScreen> createState() => _PayoutAccountScreenState();
}

class _PayoutAccountScreenState extends State<PayoutAccountScreen> {
  final _form = GlobalKey<FormState>();
  late final _holder = TextEditingController(text: widget.current?.holderName ?? '');
  final _iban = TextEditingController();
  late final _bank = TextEditingController(text: widget.current?.bankName ?? '');
  bool _busy = false;

  @override
  void dispose() {
    _holder.dispose();
    _iban.dispose();
    _bank.dispose();
    super.dispose();
  }

  String? _ibanError(String? v) {
    final l10n = context.l10n;
    final iban = normalizeIban(v ?? '');
    final error = validateIban(iban);
    if (error == IbanError.length) {
      final country = iban.substring(0, 2);
      final len = ibanLengths[country];
      return len == null ? l10n.payoutIbanLengthGeneric : l10n.payoutIbanLength(country, len);
    }
    return switch (error) {
      null => null,
      IbanError.empty => l10n.payoutIbanRequired,
      IbanError.format => l10n.payoutIbanFormat,
      IbanError.length || IbanError.checksum => l10n.payoutIbanChecksum,
    };
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    final l10n = context.l10n;
    setState(() => _busy = true);
    try {
      await context.read<Repository>().savePayoutAccount(
            holderName: _holder.text.trim(),
            iban: normalizeIban(_iban.text),
            bankName: _bank.text.trim().isEmpty ? null : _bank.text.trim(),
          );
      if (!mounted) return;
      showMessage(context, l10n.payoutSaved);
      Navigator.pop(context, true);
    } catch (e) {
      // INVALID_IBAN and validation messages arrive translated from the API.
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    final current = widget.current;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.payoutAccountTitle)),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsetsDirectional.all(24),
          children: [
            Text(l10n.payoutAccountIntro),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsetsDirectional.all(12),
              decoration: BoxDecoration(color: scheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Icon(Icons.lock_outline, size: 20, color: scheme.primary),
                const SizedBox(width: 8),
                Expanded(child: Text(l10n.payoutAccountSecurity, style: Theme.of(context).textTheme.bodySmall)),
              ]),
            ),
            const SizedBox(height: 8),
            Text(l10n.payoutAccountHoldNote, style: Theme.of(context).textTheme.bodySmall),
            if (current != null) ...[
              const SizedBox(height: 12),
              Text(l10n.payoutAccountCurrent(bidiLtr(current.ibanMasked))),
            ],
            const SizedBox(height: 20),
            TextFormField(
              key: const ValueKey('payoutHolder'),
              controller: _holder,
              textCapitalization: TextCapitalization.words,
              autofillHints: const [AutofillHints.name],
              maxLength: 120,
              decoration: InputDecoration(labelText: l10n.payoutHolderLabel, counterText: ''),
              validator: (v) => (v ?? '').trim().length < 3 ? l10n.payoutHolderError : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              key: const ValueKey('payoutIban'),
              controller: _iban,
              // IBANs are Latin letters and digits; keep them LTR in Arabic too.
              textDirection: TextDirection.ltr,
              textCapitalization: TextCapitalization.characters,
              keyboardType: TextInputType.visiblePassword,
              autocorrect: false,
              enableSuggestions: false,
              inputFormatters: [IbanInputFormatter()],
              decoration: InputDecoration(
                labelText: l10n.payoutIbanLabel,
                hintText: 'SA00 0000 0000 0000 0000 0000',
                hintTextDirection: TextDirection.ltr,
              ),
              validator: _ibanError,
            ),
            const SizedBox(height: 12),
            TextFormField(
              key: const ValueKey('payoutBank'),
              controller: _bank,
              textCapitalization: TextCapitalization.words,
              maxLength: 80,
              decoration: InputDecoration(labelText: l10n.payoutBankLabel, counterText: ''),
              validator: (v) {
                final s = (v ?? '').trim();
                return s.isNotEmpty && s.length < 2 ? l10n.payoutBankError : null;
              },
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: Text(_busy ? l10n.payoutSaving : l10n.payoutSave),
            ),
          ],
        ),
      ),
    );
  }
}
