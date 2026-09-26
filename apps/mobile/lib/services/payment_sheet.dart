import 'package:flutter/material.dart';
import 'package:moyasar/moyasar.dart' as moyasar;

import '../core/format.dart';
import '../l10n/l10n.dart';
import 'repository.dart';

/// What the app is asking the tourist to pay for.
class PaymentRequest {
  const PaymentRequest({
    required this.bookingId,
    required this.amountMinor,
    required this.currency,
    required this.description,
  });

  final String bookingId;
  final int amountMinor;
  final String currency;
  final String description;

  String get amountLabel => formatMoney(amountMinor, currency);
}

/// Collects payment and returns the reference to send to `POST /bookings/:id/pay`
/// (a gateway payment id or token), or null if the tourist closed the sheet.
abstract class PaymentSheet {
  Future<String?> collect(BuildContext context, PaymentRequest request);
}

/// Picks the sheet matching the API's configured provider (`GET /payments/config`).
class ConfiguredPaymentSheet implements PaymentSheet {
  ConfiguredPaymentSheet(this.repo);
  final Repository repo;
  PaymentSheet? _resolved;

  Future<PaymentSheet> _sheet() async {
    if (_resolved != null) return _resolved!;
    final config = await repo.paymentConfig();
    final key = config.publishableKey;
    return _resolved = config.provider == 'moyasar' && key != null && key.isNotEmpty
        ? MoyasarPaymentSheet(publishableKey: key, callbackUrl: config.callbackUrl)
        : StubPaymentSheet();
  }

  @override
  Future<String?> collect(BuildContext context, PaymentRequest request) async {
    final sheet = await _sheet();
    if (!context.mounted) return null;
    return sheet.collect(context, request);
  }
}

/// Moyasar card form (mada, Visa, Mastercard). The SDK creates the payment with
/// the publishable key and runs 3-D Secure; the API then verifies it by id
/// with the secret key, so the booking id travels in the payment metadata.
class MoyasarPaymentSheet implements PaymentSheet {
  MoyasarPaymentSheet({required this.publishableKey, this.callbackUrl});
  final String publishableKey;
  final String? callbackUrl;

  @override
  Future<String?> collect(BuildContext context, PaymentRequest request) {
    if (callbackUrl != null && callbackUrl!.isNotEmpty) {
      moyasar.PaymentConfig.callbackUrl = callbackUrl!;
    }
    final config = moyasar.PaymentConfig(
      publishableApiKey: publishableKey,
      amount: request.amountMinor,
      currency: request.currency,
      description: request.description,
      metadata: {'booking_id': request.bookingId},
      creditCard: moyasar.CreditCardConfig(saveCard: false, manual: false),
    );
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (ctx) => _MoyasarForm(config: config, amountLabel: request.amountLabel),
    );
  }
}

class _MoyasarForm extends StatefulWidget {
  const _MoyasarForm({required this.config, required this.amountLabel});
  final moyasar.PaymentConfig config;
  final String amountLabel;

  @override
  State<_MoyasarForm> createState() => _MoyasarFormState();
}

class _MoyasarFormState extends State<_MoyasarForm> {
  String? _error;

  void _onResult(dynamic result) {
    if (result is moyasar.PaymentResponse) {
      switch (result.status) {
        case moyasar.PaymentStatus.paid:
        case moyasar.PaymentStatus.authorized:
        case moyasar.PaymentStatus.captured:
        case moyasar.PaymentStatus.initiated: // the API finishes verification
          Navigator.pop(context, result.id);
          return;
        case moyasar.PaymentStatus.failed:
          final source = result.source;
          final message = source is moyasar.CardPaymentResponseSource ? source.message : null;
          setState(() => _error = message ?? context.l10n.paymentFailedTryAnother);
          return;
      }
    }
    final message = switch (result) {
      moyasar.ApiError(:final message) => message,
      moyasar.ValidationError(:final message) => message,
      moyasar.PaymentCanceledError() => null,
      moyasar.NetworkError(:final message) => message,
      moyasar.TimeoutError(:final message) => message,
      _ => context.l10n.paymentNotCompleted,
    };
    if (message == null) {
      Navigator.pop(context);
    } else {
      setState(() => _error = message);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context).textTheme;
    final l10n = context.l10n;
    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(16, 0, 16, MediaQuery.of(context).viewInsets.bottom + 16),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.paymentPayAmount(widget.amountLabel), style: t.titleLarge, textAlign: TextAlign.center),
            const SizedBox(height: 4),
            Text(
              l10n.paymentEscrowNote,
              textAlign: TextAlign.center,
            ),
            if (_error != null) ...[
              const SizedBox(height: 8),
              Text(_error!, textAlign: TextAlign.center, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 12),
            moyasar.CreditCard(
              config: widget.config,
              onPaymentResult: _onResult,
              locale: context.isArabic
                  ? const moyasar.Localization.ar()
                  : const moyasar.Localization.en(),
            ),
          ],
        ),
      ),
    );
  }
}

/// Test-mode sheet for the API's stub provider: pick a success or decline.
class StubPaymentSheet implements PaymentSheet {
  @override
  Future<String?> collect(BuildContext context, PaymentRequest request) {
    return showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: _StubSheetBody(amountLabel: request.amountLabel),
      ),
    );
  }
}

class _StubSheetBody extends StatelessWidget {
  const _StubSheetBody({required this.amountLabel});
  final String amountLabel;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsetsDirectional.fromSTEB(24, 0, 24, 8),
          child: Text(l10n.paymentPayAmount(amountLabel), style: Theme.of(context).textTheme.titleLarge),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(l10n.paymentTestModeNote, textAlign: TextAlign.center),
        ),
        const SizedBox(height: 8),
        ListTile(
          leading: const Icon(Icons.credit_card),
          title: Text(l10n.paymentTestCardSucceeds),
          subtitle: const Text('•••• 4242', textDirection: TextDirection.ltr),
          onTap: () => Navigator.pop(context, 'tok_ok'),
        ),
        ListTile(
          leading: const Icon(Icons.credit_card_off),
          title: Text(l10n.paymentTestCardDeclined),
          subtitle: const Text('•••• 0002', textDirection: TextDirection.ltr),
          onTap: () => Navigator.pop(context, 'tok_fail'),
        ),
        const SizedBox(height: 12),
      ],
    );
  }
}
