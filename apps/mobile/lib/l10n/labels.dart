import '../models/models.dart';
import 'l10n.dart';

/// Translated labels for API enums shared by several screens.
extension EnumLabels on AppLocalizations {
  String bookingStatus(BookingStatus s) => switch (s) {
        BookingStatus.pendingPayment => bookingStatusPendingPayment,
        BookingStatus.confirmed => bookingStatusConfirmed,
        BookingStatus.inProgress => bookingStatusInProgress,
        BookingStatus.completed => bookingStatusCompleted,
        BookingStatus.cancelled => bookingStatusCancelled,
      };

  /// Site category from the API, e.g. `HERITAGE`.
  String siteCategory(String c) => switch (c) {
        'HERITAGE' => categoryHeritage,
        'MUSEUM' => categoryMuseum,
        'NATURE' => categoryNature,
        'RELIGIOUS' => categoryReligious,
        'CITY' => categoryCity,
        'ADVENTURE' => categoryAdventure,
        'FOOD' => categoryFood,
        _ => c,
      };

  /// Payment escrow status from the API, e.g. `HELD`.
  String escrowStatus(String s) => switch (s) {
        'PENDING' => escrowPending,
        'HELD' => escrowHeld,
        'SETTLING' => escrowSettling,
        'RELEASED' => escrowReleased,
        'REFUNDED' => escrowRefunded,
        'PARTIALLY_REFUNDED' => escrowPartiallyRefunded,
        'DISPUTED' => escrowDisputed,
        'FAILED' => escrowFailed,
        _ => s,
      };
}
