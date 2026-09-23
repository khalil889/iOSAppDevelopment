import 'package:flutter_test/flutter_test.dart';
import 'package:tourguide_mobile/models/models.dart';

void main() {
  test('Booking.fromJson maps status, payment and review flags', () {
    final b = Booking.fromJson({
      'id': 'b1',
      'status': 'COMPLETED',
      'startAt': '2026-05-01T08:00:00.000Z',
      'endAt': '2026-05-01T11:00:00.000Z',
      'completedAt': '2026-05-01T11:00:00.000Z',
      'groupSize': 2,
      'totalMinor': 64000,
      'guidePayoutMinor': 54400,
      'currency': 'SAR',
      'payment': {'escrowStatus': 'HELD'},
      'guide': {'id': 'g1', 'name': 'Noura', 'phone': '+966500000102'},
      'review': null,
      'package': {
        'id': 'p1',
        'title': 'Hegra',
        'durationMinutes': 180,
        'priceMinor': 32000,
        'currency': 'SAR',
        'maxGroupSize': 8,
        'pricingType': 'PER_PERSON',
        'sites': [
          {'id': 's1', 'name': 'Hegra', 'category': 'HERITAGE', 'location': {'type': 'Point', 'coordinates': [37.95, 26.79]}},
        ],
      },
    });

    expect(b.status, BookingStatus.completed);
    expect(b.canReview, isTrue);
    expect(b.escrowStatus, 'HELD');
    expect(b.guide!.name, 'Noura');
    expect(b.package!.perPerson, isTrue);
    expect(b.package!.sites.single.lat, closeTo(26.79, 1e-9));
  });

  test('Booking with a review cannot be reviewed again', () {
    final b = Booking.fromJson({
      'id': 'b1',
      'status': 'COMPLETED',
      'startAt': '2026-05-01T08:00:00Z',
      'endAt': '2026-05-01T11:00:00Z',
      'groupSize': 1,
      'totalMinor': 1,
      'guidePayoutMinor': 1,
      'currency': 'SAR',
      'review': {'id': 'r1'},
    });
    expect(b.canReview, isFalse);
  });

  test('GuideSummary parses public guide JSON', () {
    final g = GuideSummary.fromJson({
      'id': 'g1',
      'name': 'Faisal Al-Harbi',
      'languages': ['ar', 'en'],
      'ratingAvg': 4.5,
      'ratingCount': 2,
      'yearsOfExperience': 9,
      'verified': true,
      'license': {'number': 'SA-****33', 'country': 'Saudi Arabia'},
      'cities': [
        {'id': 'c1', 'name': 'Riyadh', 'country': 'Saudi Arabia'},
      ],
      'fromPriceMinor': 15000,
      'currency': 'SAR',
    });
    expect(g.verified, isTrue);
    expect(g.licenseNumber, 'SA-****33');
    expect(g.cities.single.country, 'Saudi Arabia');
    expect(g.fromPriceMinor, 15000);
  });

  test('GuideDashboard exposes license submission state', () {
    final d = GuideDashboard.fromJson({
      'guide': {'name': 'X', 'verificationStatus': 'REJECTED', 'rejectionReason': 'Blurry', 'ratingAvg': '0', 'ratingCount': 0},
      'stats': {'COMPLETED': '3'},
      'earnings': [],
      'upcoming': [],
    });
    expect(d.canSubmitLicense, isTrue);
    expect(d.isApproved, isFalse);
    expect(d.stats['COMPLETED'], 3);
  });
}
