import 'package:flutter/material.dart';

/// Collects a payment method and returns a token for `POST /bookings/:id/pay`.
///
/// Replace [StubPaymentSheet] with a gateway SDK (Stripe, Moyasar, Apple Pay)
/// that returns its own token; the API's PaymentProvider does the rest.
abstract class PaymentSheet {
  Future<String?> collect(BuildContext context, {required String amountLabel});
}

/// Lets the tester pick a stub outcome understood by StubPaymentProvider.
class StubPaymentSheet implements PaymentSheet {
  @override
  Future<String?> collect(BuildContext context, {required String amountLabel}) {
    return showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
              child: Text('Pay $amountLabel', style: Theme.of(ctx).textTheme.titleLarge),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Test mode — no real charge. Funds are held in escrow until your tour is completed.',
                textAlign: TextAlign.center,
              ),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.credit_card),
              title: const Text('Test card — succeeds'),
              subtitle: const Text('•••• 4242'),
              onTap: () => Navigator.pop(ctx, 'tok_ok'),
            ),
            ListTile(
              leading: const Icon(Icons.credit_card_off),
              title: const Text('Test card — declined'),
              subtitle: const Text('•••• 0002'),
              onTap: () => Navigator.pop(ctx, 'tok_fail'),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
