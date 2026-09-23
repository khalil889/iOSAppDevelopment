import '../core/api_client.dart';
import '../models/models.dart';

/// All marketplace API calls used by the app.
class Repository {
  Repository(this.api);
  final ApiClient api;

  // ---- Auth ---------------------------------------------------------------
  Future<({String token, AppUser user, String? devCode})> register({
    required String email,
    required String password,
    required String fullName,
    required String phone,
    required UserRole role,
  }) async {
    final j = await api.post('/auth/register', {
      'email': email,
      'password': password,
      'fullName': fullName,
      'phone': phone,
      'role': role == UserRole.guide ? 'GUIDE' : 'TOURIST',
    });
    return (token: j['accessToken'] as String, user: AppUser.fromJson(j['user']), devCode: j['devCode'] as String?);
  }

  Future<({String token, AppUser user})> login(String email, String password) async {
    final j = await api.post('/auth/login', {'email': email, 'password': password});
    return (token: j['accessToken'] as String, user: AppUser.fromJson(j['user']));
  }

  /// Returns the code in dev mode (OTP_DEV_ECHO=true) for convenience.
  Future<String?> requestOtp(String phone, {bool login = true}) async {
    final j = await api.post('/auth/otp/request', {'phone': phone, 'purpose': login ? 'LOGIN' : 'VERIFY_PHONE'});
    return j['devCode'] as String?;
  }

  Future<({String token, AppUser user})> verifyOtp(String phone, String code, {bool login = true}) async {
    final j = await api.post('/auth/otp/verify', {
      'phone': phone,
      'code': code,
      'purpose': login ? 'LOGIN' : 'VERIFY_PHONE',
    });
    return (token: j['accessToken'] as String, user: AppUser.fromJson(j['user']));
  }

  Future<AppUser> me() async => AppUser.fromJson(await api.get('/auth/me'));

  // ---- Explore ------------------------------------------------------------
  Future<List<City>> cities() async => (await api.get('/cities') as List).map((c) => City.fromJson(c)).toList();

  Future<List<Country>> countries() async =>
      (await api.get('/countries') as List).map((c) => Country.fromJson(c)).toList();

  Future<List<Site>> sites({String? q, String? cityId, String? category, int limit = 30}) async {
    final j = await api.get('/sites', query: {'q': q, 'cityId': cityId, 'category': category, 'limit': limit});
    return (j['items'] as List).map((s) => Site.fromJson(s)).toList();
  }

  Future<List<GuideSummary>> guides({
    String? q,
    String? cityId,
    String? siteId,
    String? language,
    double? minRating,
    String? date,
    String sort = 'rating',
  }) async {
    final j = await api.get('/guides', query: {
      'q': q,
      'cityId': cityId,
      'siteId': siteId,
      'language': language,
      'minRating': minRating,
      'date': date,
      'sort': sort,
      'limit': 30,
    });
    return (j['items'] as List).map((g) => GuideSummary.fromJson(g)).toList();
  }

  Future<GuideProfile> guideProfile(String id) async => GuideProfile.fromJson(await api.get('/guides/$id'));

  // ---- Bookings -----------------------------------------------------------
  Map<String, dynamic> _bookingBody(String packageId, DateTime startAt, int groupSize, String? notes) => {
        'packageId': packageId,
        'startAt': startAt.toUtc().toIso8601String(),
        'groupSize': groupSize,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };

  Future<Quote> quote(String packageId, DateTime startAt, int groupSize) async =>
      Quote.fromJson(await api.post('/bookings/quote', _bookingBody(packageId, startAt, groupSize, null)));

  Future<Booking> createBooking(String packageId, DateTime startAt, int groupSize, {String? notes}) async =>
      Booking.fromJson(await api.post('/bookings', _bookingBody(packageId, startAt, groupSize, notes)));

  Future<Booking> pay(String bookingId, String token) async {
    final j = await api.post('/bookings/$bookingId/pay', {'paymentMethodToken': token});
    return Booking.fromJson(j['booking']);
  }

  Future<List<Booking>> myBookings({String? status}) async {
    final j = await api.get('/bookings', query: {'status': status, 'limit': 50});
    return (j['items'] as List).map((b) => Booking.fromJson(b)).toList();
  }

  Future<Booking> booking(String id) async => Booking.fromJson(await api.get('/bookings/$id'));

  Future<Booking> startTour(String id) async => Booking.fromJson(await api.post('/bookings/$id/start'));

  Future<Booking> completeTour(String id) async => Booking.fromJson(await api.post('/bookings/$id/complete'));

  Future<({Booking booking, int refundPercent})> cancel(String id, {String? reason}) async {
    final j = await api.post('/bookings/$id/cancel', {if (reason != null) 'reason': reason});
    return (booking: Booking.fromJson(j['booking']), refundPercent: (j['refundPercent'] as num).toInt());
  }

  Future<void> sos(String id, {double? lat, double? lng, String? message}) =>
      api.post('/bookings/$id/sos', {
        if (lat != null) 'lat': lat,
        if (lng != null) 'lng': lng,
        if (message != null) 'message': message,
      });

  Future<void> review(String bookingId, int rating, String comment) =>
      api.post('/bookings/$bookingId/review', {'rating': rating, 'comment': comment});

  Future<void> openDispute(String bookingId, String reason, String description) =>
      api.post('/bookings/$bookingId/disputes', {'reason': reason, 'description': description});

  // ---- Guide --------------------------------------------------------------
  Future<GuideDashboard> dashboard() async => GuideDashboard.fromJson(await api.get('/guides/me/dashboard'));

  Future<void> submitLicense({
    required String licenseNumber,
    required String countryId,
    required String expiresAt,
    String? documentUrl,
  }) =>
      api.post('/guides/me/application', {
        'licenseNumber': licenseNumber,
        'licenseCountryId': countryId,
        'licenseExpiresAt': expiresAt,
        if (documentUrl != null && documentUrl.isNotEmpty) 'licenseDocumentUrl': documentUrl,
      });

  // ---- Assistant ----------------------------------------------------------
  Future<ChatMessage> chat(List<ChatMessage> history) async {
    final j = await api.post('/assistant/chat', {'messages': history.map((m) => m.toJson()).toList()});
    return ChatMessage(
      role: 'assistant',
      content: j['reply'] ?? '',
      suggestions: (j['suggestions'] as List? ?? []).map((s) => Suggestion.fromJson(s)).toList(),
    );
  }
}
