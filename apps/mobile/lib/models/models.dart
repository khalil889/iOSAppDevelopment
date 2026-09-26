// Plain data classes mirroring the API's JSON. Parsing is defensive so the
// app tolerates optional/missing fields.

DateTime? _date(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());
int _int(dynamic v) => v is int ? v : (v is num ? v.toInt() : int.tryParse('$v') ?? 0);
double _double(dynamic v) => v is num ? v.toDouble() : double.tryParse('$v') ?? 0;
List<String> _strings(dynamic v) => v is List ? v.map((e) => '$e').toList() : const [];

enum UserRole { tourist, guide, admin }

UserRole _role(String? s) => switch (s) {
      'GUIDE' => UserRole.guide,
      'ADMIN' => UserRole.admin,
      _ => UserRole.tourist,
    };

class AppUser {
  AppUser({
    required this.id,
    required this.fullName,
    required this.role,
    this.email,
    this.phone,
    this.phoneVerified = false,
  });

  final String id;
  final String fullName;
  final UserRole role;
  final String? email;
  final String? phone;
  final bool phoneVerified;

  String get firstName => fullName.split(' ').first;

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
        id: j['id'],
        fullName: j['fullName'] ?? '',
        role: _role(j['role']),
        email: j['email'],
        phone: j['phone'],
        phoneVerified: j['phoneVerifiedAt'] != null,
      );
}

class AuthResult {
  AuthResult({required this.accessToken, required this.refreshToken, required this.user, this.devCode});
  final String accessToken, refreshToken;
  final AppUser user;

  /// OTP code echoed by the API in development only.
  final String? devCode;

  factory AuthResult.fromJson(Map<String, dynamic> j) => AuthResult(
        accessToken: j['accessToken'] as String,
        refreshToken: j['refreshToken'] as String,
        user: AppUser.fromJson(j['user']),
        devCode: j['devCode'] as String?,
      );
}

class Country {
  Country({required this.id, required this.code, required this.name, required this.currency});
  final String id, code, name, currency;

  factory Country.fromJson(Map<String, dynamic> j) =>
      Country(id: j['id'], code: j['code'], name: j['name'], currency: j['currency']);
}

class City {
  City({required this.id, required this.name, this.country});
  final String id, name;
  final String? country;

  factory City.fromJson(Map<String, dynamic> j) => City(
        id: j['id'],
        name: j['name'],
        country: j['country'] is Map ? j['country']['name'] : j['country']?.toString(),
      );
}

class Site {
  Site({
    required this.id,
    required this.name,
    required this.category,
    required this.description,
    this.city,
    this.imageUrl,
    this.distanceKm,
    this.requiresLicensedGuide = false,
    this.lat,
    this.lng,
  });

  final String id, name, category, description;
  final City? city;
  final String? imageUrl;
  final double? distanceKm;
  final bool requiresLicensedGuide;
  final double? lat, lng;

  factory Site.fromJson(Map<String, dynamic> j) {
    final coords = j['location'] is Map ? j['location']['coordinates'] as List? : null;
    return Site(
      id: j['id'],
      name: j['name'],
      category: j['category'] ?? '',
      description: j['description'] ?? '',
      city: j['city'] is Map ? City.fromJson(j['city']) : null,
      imageUrl: j['imageUrl'],
      distanceKm: j['distanceKm'] == null ? null : _double(j['distanceKm']),
      requiresLicensedGuide: j['requiresLicensedGuide'] == true,
      lng: coords != null ? _double(coords[0]) : null,
      lat: coords != null ? _double(coords[1]) : null,
    );
  }
}

class GuideSummary {
  GuideSummary({
    required this.id,
    required this.name,
    required this.languages,
    required this.ratingAvg,
    required this.ratingCount,
    required this.yearsOfExperience,
    required this.cities,
    required this.verified,
    this.bio = '',
    this.avatarUrl,
    this.licenseNumber,
    this.licenseCountry,
    this.fromPriceMinor,
    this.currency,
  });

  final String id, name, bio;
  final List<String> languages;
  final double ratingAvg;
  final int ratingCount, yearsOfExperience;
  final List<City> cities;
  final bool verified;
  final String? avatarUrl, licenseNumber, licenseCountry, currency;
  final int? fromPriceMinor;

  factory GuideSummary.fromJson(Map<String, dynamic> j) => GuideSummary(
        id: j['id'],
        name: j['name'] ?? 'Guide',
        bio: j['bio'] ?? '',
        languages: _strings(j['languages']),
        ratingAvg: _double(j['ratingAvg']),
        ratingCount: _int(j['ratingCount']),
        yearsOfExperience: _int(j['yearsOfExperience']),
        cities: (j['cities'] as List? ?? []).map((c) => City.fromJson(c)).toList(),
        verified: j['verified'] == true,
        avatarUrl: j['avatarUrl'],
        licenseNumber: j['license']?['number'],
        licenseCountry: j['license']?['country'],
        fromPriceMinor: j['fromPriceMinor'] == null ? null : _int(j['fromPriceMinor']),
        currency: j['currency'],
      );
}

class TourPackage {
  TourPackage({
    required this.id,
    required this.title,
    required this.description,
    required this.durationMinutes,
    required this.pricingType,
    required this.priceMinor,
    required this.currency,
    required this.maxGroupSize,
    required this.sites,
    this.cityName,
    this.isActive = true,
  });

  final String id, title, description, pricingType, currency;
  final int durationMinutes, priceMinor, maxGroupSize;
  final List<Site> sites;
  final String? cityName;
  final bool isActive;

  bool get perPerson => pricingType == 'PER_PERSON';

  factory TourPackage.fromJson(Map<String, dynamic> j) => TourPackage(
        id: j['id'],
        title: j['title'],
        description: j['description'] ?? '',
        durationMinutes: _int(j['durationMinutes']),
        pricingType: j['pricingType'] ?? 'PER_GROUP',
        priceMinor: _int(j['priceMinor']),
        currency: j['currency'] ?? 'USD',
        maxGroupSize: _int(j['maxGroupSize']),
        sites: (j['sites'] as List? ?? []).map((s) => Site.fromJson(s)).toList(),
        cityName: j['city'] is Map ? j['city']['name'] : null,
        isActive: j['isActive'] != false,
      );
}

class Review {
  Review({required this.id, required this.rating, required this.comment, required this.author, this.createdAt});
  final String id, comment, author;
  final int rating;
  final DateTime? createdAt;

  factory Review.fromJson(Map<String, dynamic> j) => Review(
        id: j['id'],
        rating: _int(j['rating']),
        comment: j['comment'] ?? '',
        author: j['author'] is String ? j['author'] : 'Traveller',
        createdAt: _date(j['createdAt']),
      );
}

class GuideProfile {
  GuideProfile({required this.guide, required this.packages, required this.reviews, required this.sites});
  final GuideSummary guide;
  final List<TourPackage> packages;
  final List<Review> reviews;
  final List<Site> sites;

  factory GuideProfile.fromJson(Map<String, dynamic> j) => GuideProfile(
        guide: GuideSummary.fromJson(j),
        packages: (j['packages'] as List? ?? []).map((p) => TourPackage.fromJson(p)).toList(),
        reviews: (j['reviews'] as List? ?? []).map((r) => Review.fromJson(r)).toList(),
        sites: (j['sites'] as List? ?? [])
            .map((s) => Site(id: s['id'], name: s['name'], category: s['category'] ?? '', description: ''))
            .toList(),
      );
}

enum BookingStatus { pendingPayment, confirmed, inProgress, completed, cancelled }

BookingStatus _bookingStatus(String? s) => switch (s) {
      'CONFIRMED' => BookingStatus.confirmed,
      'IN_PROGRESS' => BookingStatus.inProgress,
      'COMPLETED' => BookingStatus.completed,
      'CANCELLED' => BookingStatus.cancelled,
      _ => BookingStatus.pendingPayment,
    };

extension BookingStatusLabel on BookingStatus {
  String get label => switch (this) {
        BookingStatus.pendingPayment => 'Awaiting payment',
        BookingStatus.confirmed => 'Confirmed',
        BookingStatus.inProgress => 'Live now',
        BookingStatus.completed => 'Completed',
        BookingStatus.cancelled => 'Cancelled',
      };
}

class Person {
  Person({required this.id, required this.name, this.phone, this.avatarUrl});
  final String id, name;
  final String? phone, avatarUrl;

  factory Person.fromJson(Map<String, dynamic>? j) => Person(
        id: j?['id'] ?? '',
        name: j?['name'] ?? j?['fullName'] ?? j?['user']?['fullName'] ?? '',
        phone: j?['phone'] ?? j?['user']?['phone'],
        avatarUrl: j?['avatarUrl'] ?? j?['user']?['avatarUrl'],
      );
}

class Booking {
  Booking({
    required this.id,
    required this.status,
    required this.startAt,
    required this.endAt,
    required this.groupSize,
    required this.totalMinor,
    required this.guidePayoutMinor,
    required this.currency,
    this.package,
    this.guide,
    this.tourist,
    this.escrowStatus,
    this.paymentDueAt,
    this.startedAt,
    this.completedAt,
    this.hasReview = false,
    this.hasOpenDispute = false,
    this.notes,
  });

  final String id, currency;
  final BookingStatus status;
  final DateTime startAt, endAt;
  final DateTime? paymentDueAt, startedAt, completedAt;
  final int groupSize, totalMinor, guidePayoutMinor;
  final TourPackage? package;
  final Person? guide, tourist;
  final String? escrowStatus, notes;
  final bool hasReview, hasOpenDispute;

  bool get canReview => status == BookingStatus.completed && !hasReview;
  bool get isLive => status == BookingStatus.inProgress;

  factory Booking.fromJson(Map<String, dynamic> j) => Booking(
        id: j['id'],
        status: _bookingStatus(j['status']),
        startAt: _date(j['startAt'])!,
        endAt: _date(j['endAt'])!,
        groupSize: _int(j['groupSize']),
        totalMinor: _int(j['totalMinor']),
        guidePayoutMinor: _int(j['guidePayoutMinor']),
        currency: j['currency'] ?? 'USD',
        package: j['package'] is Map ? TourPackage.fromJson(j['package']) : null,
        guide: j['guide'] is Map ? Person.fromJson(j['guide']) : null,
        tourist: j['tourist'] is Map ? Person.fromJson(j['tourist']) : null,
        escrowStatus: j['payment'] is Map ? j['payment']['escrowStatus'] : null,
        paymentDueAt: _date(j['paymentDueAt']),
        startedAt: _date(j['startedAt']),
        completedAt: _date(j['completedAt']),
        hasReview: j['review'] != null,
        hasOpenDispute: j['openDispute'] != null,
        notes: j['notes'],
      );
}

class Quote {
  Quote({required this.totalMinor, required this.platformFeeMinor, required this.currency, required this.endAt});
  final int totalMinor, platformFeeMinor;
  final String currency;
  final DateTime endAt;

  factory Quote.fromJson(Map<String, dynamic> j) => Quote(
        totalMinor: _int(j['totalMinor']),
        platformFeeMinor: _int(j['platformFeeMinor']),
        currency: j['currency'],
        endAt: _date(j['endAt'])!,
      );
}

class ChatMessage {
  ChatMessage({required this.role, required this.content, this.suggestions = const []});
  final String role; // 'user' | 'assistant'
  final String content;
  final List<Suggestion> suggestions;

  Map<String, dynamic> toJson() => {'role': role, 'content': content};
}

class Suggestion {
  Suggestion({required this.type, required this.id, required this.title});
  final String type, id, title; // type: 'site' | 'guide'

  factory Suggestion.fromJson(Map<String, dynamic> j) => Suggestion(type: j['type'], id: j['id'], title: j['title']);
}

class Earnings {
  Earnings({required this.currency, required this.releasedMinor, required this.heldMinor});
  final String currency;
  final int releasedMinor, heldMinor;

  factory Earnings.fromJson(Map<String, dynamic> j) =>
      Earnings(currency: j['currency'], releasedMinor: _int(j['releasedMinor']), heldMinor: _int(j['heldMinor']));
}

class DashboardBooking {
  DashboardBooking({
    required this.id,
    required this.status,
    required this.startAt,
    required this.groupSize,
    required this.packageTitle,
    required this.touristName,
    required this.guidePayoutMinor,
    required this.currency,
  });

  final String id, packageTitle, touristName, currency;
  final BookingStatus status;
  final DateTime startAt;
  final int groupSize, guidePayoutMinor;

  factory DashboardBooking.fromJson(Map<String, dynamic> j) => DashboardBooking(
        id: j['id'],
        status: _bookingStatus(j['status']),
        startAt: _date(j['startAt'])!,
        groupSize: _int(j['groupSize']),
        packageTitle: j['packageTitle'] ?? '',
        touristName: j['touristName'] ?? '',
        guidePayoutMinor: _int(j['guidePayoutMinor']),
        currency: j['currency'] ?? 'USD',
      );
}

class GuideDashboard {
  GuideDashboard({
    required this.name,
    required this.verificationStatus,
    required this.ratingAvg,
    required this.ratingCount,
    required this.stats,
    required this.earnings,
    required this.upcoming,
    this.rejectionReason,
  });

  final String name, verificationStatus;
  final String? rejectionReason;
  final double ratingAvg;
  final int ratingCount;
  final Map<String, int> stats;
  final List<Earnings> earnings;
  final List<DashboardBooking> upcoming;

  bool get isApproved => verificationStatus == 'APPROVED';
  bool get canSubmitLicense => verificationStatus == 'DRAFT' || verificationStatus == 'REJECTED';

  factory GuideDashboard.fromJson(Map<String, dynamic> j) {
    final g = j['guide'] as Map<String, dynamic>;
    return GuideDashboard(
      name: g['name'] ?? '',
      verificationStatus: g['verificationStatus'] ?? 'DRAFT',
      rejectionReason: g['rejectionReason'],
      ratingAvg: _double(g['ratingAvg']),
      ratingCount: _int(g['ratingCount']),
      stats: (j['stats'] as Map? ?? {}).map((k, v) => MapEntry('$k', _int(v))),
      earnings: (j['earnings'] as List? ?? []).map((e) => Earnings.fromJson(e)).toList(),
      upcoming: (j['upcoming'] as List? ?? []).map((b) => DashboardBooking.fromJson(b)).toList(),
    );
  }
}

class PaymentClientConfig {
  PaymentClientConfig({required this.provider, this.publishableKey, this.callbackUrl});
  final String provider;
  final String? publishableKey, callbackUrl;

  factory PaymentClientConfig.fromJson(Map<String, dynamic> j) => PaymentClientConfig(
        provider: j['provider'] ?? 'stub',
        publishableKey: j['publishableKey'],
        callbackUrl: j['callbackUrl'],
      );
}

class TimeSlot {
  TimeSlot({required this.startAt, required this.endAt, required this.localTime});
  final DateTime startAt, endAt;

  /// Start time in the tour city's timezone, e.g. "09:30".
  final String localTime;

  factory TimeSlot.fromJson(Map<String, dynamic> j) => TimeSlot(
        startAt: _date(j['startAt'])!,
        endAt: _date(j['endAt'])!,
        localTime: j['localTime'] ?? '',
      );
}

class DaySlots {
  DaySlots({required this.date, required this.timeZone, required this.slots});
  final String date, timeZone;
  final List<TimeSlot> slots;

  factory DaySlots.fromJson(Map<String, dynamic> j) => DaySlots(
        date: j['date'],
        timeZone: j['timeZone'] ?? 'UTC',
        slots: (j['slots'] as List? ?? []).map((s) => TimeSlot.fromJson(s)).toList(),
      );
}

class WeeklyWindow {
  WeeklyWindow({required this.weekday, required this.start, required this.end});

  /// 0 = Sunday … 6 = Saturday
  final int weekday;
  final String start, end; // "HH:MM"

  factory WeeklyWindow.fromJson(Map<String, dynamic> j) =>
      WeeklyWindow(weekday: _int(j['weekday']), start: j['start'], end: j['end']);
  Map<String, dynamic> toJson() => {'weekday': weekday, 'start': start, 'end': end};
}

class TimeOffRange {
  TimeOffRange({required this.startDate, required this.endDate, this.reason});
  final String startDate, endDate; // YYYY-MM-DD
  final String? reason;

  factory TimeOffRange.fromJson(Map<String, dynamic> j) =>
      TimeOffRange(startDate: j['startDate'], endDate: j['endDate'], reason: j['reason']);
  Map<String, dynamic> toJson() => {
        'startDate': startDate,
        'endDate': endDate,
        if (reason != null && reason!.isNotEmpty) 'reason': reason,
      };
}

class GuideAvailability {
  GuideAvailability({required this.weeklyHours, required this.timeOff});
  final List<WeeklyWindow> weeklyHours;
  final List<TimeOffRange> timeOff;

  factory GuideAvailability.fromJson(Map<String, dynamic> j) => GuideAvailability(
        weeklyHours: (j['weeklyHours'] as List? ?? []).map((w) => WeeklyWindow.fromJson(w)).toList(),
        timeOff: (j['timeOff'] as List? ?? []).map((t) => TimeOffRange.fromJson(t)).toList(),
      );
}

class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.data,
    required this.createdAt,
    this.readAt,
  });

  final String id, type, title, body;
  final Map<String, String> data;
  final DateTime createdAt;
  final DateTime? readAt;

  bool get unread => readAt == null;
  String? get bookingId => data['bookingId'];

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'],
        type: j['type'] ?? '',
        title: j['title'] ?? '',
        body: j['body'] ?? '',
        data: (j['data'] as Map? ?? {}).map((k, v) => MapEntry('$k', '$v')),
        createdAt: _date(j['createdAt']) ?? DateTime.now(),
        readAt: _date(j['readAt']),
      );
}

class Inbox {
  Inbox({required this.items, required this.unread});
  final List<AppNotification> items;
  final int unread;

  factory Inbox.fromJson(Map<String, dynamic> j) => Inbox(
        items: (j['items'] as List? ?? []).map((n) => AppNotification.fromJson(n)).toList(),
        unread: _int(j['unread']),
      );
}
