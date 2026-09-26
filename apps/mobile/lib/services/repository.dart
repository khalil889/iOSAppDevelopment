import '../core/api_client.dart';
import '../models/models.dart';

/// All marketplace API calls used by the app.
class Repository {
  Repository(this.api);
  final ApiClient api;

  // ---- Auth ---------------------------------------------------------------
  Future<AuthResult> register({
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
      'locale': api.language,
      'role': role == UserRole.guide ? 'GUIDE' : 'TOURIST',
    });
    return AuthResult.fromJson(j);
  }

  Future<AuthResult> login(String email, String password) async =>
      AuthResult.fromJson(await api.post('/auth/login', {'email': email, 'password': password}));

  Future<void> logout(String refreshToken) => api.post('/auth/logout', {'refreshToken': refreshToken});

  Future<void> logoutAll() => api.post('/auth/logout-all');

  /// Returns the code in dev mode (OTP_DEV_ECHO=true) for convenience.
  Future<String?> requestOtp(String phone, {bool login = true}) async {
    final j = await api.post('/auth/otp/request', {'phone': phone, 'purpose': login ? 'LOGIN' : 'VERIFY_PHONE'});
    return j['devCode'] as String?;
  }

  Future<AuthResult> verifyOtp(String phone, String code, {bool login = true}) async {
    final j = await api.post('/auth/otp/verify', {
      'phone': phone,
      'code': code,
      'purpose': login ? 'LOGIN' : 'VERIFY_PHONE',
    });
    return AuthResult.fromJson(j);
  }

  Future<AppUser> me() async => AppUser.fromJson(await api.get('/auth/me'));

  /// Language for this user's notifications and SMS.
  Future<void> updateLocale(String locale) => api.patch('/auth/me', {'locale': locale});

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

  // ---- Availability -------------------------------------------------------
  /// Free start times for [packageId] on a local calendar [date] (YYYY-MM-DD).
  Future<DaySlots> slots(String packageId, String date) async =>
      DaySlots.fromJson(await api.get('/availability/slots', query: {'packageId': packageId, 'date': date}));

  Future<GuideAvailability> myAvailability() async =>
      GuideAvailability.fromJson(await api.get('/guides/me/availability'));

  Future<GuideAvailability> saveAvailability(List<WeeklyWindow> hours, List<TimeOffRange> timeOff) async =>
      GuideAvailability.fromJson(await api.put('/guides/me/availability', {
        'weeklyHours': hours.map((w) => w.toJson()).toList(),
        'timeOff': timeOff.map((t) => t.toJson()).toList(),
      }));

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

  Future<PaymentClientConfig> paymentConfig() async =>
      PaymentClientConfig.fromJson(await api.get('/payments/config'));

  /// Pays and, if the gateway still needs confirmation (3-D Secure), re-checks
  /// once. Returns the booking — CONFIRMED when the money is held.
  Future<Booking> pay(String bookingId, String token) async {
    final j = await api.post('/bookings/$bookingId/pay', {'paymentMethodToken': token});
    final booking = Booking.fromJson(j['booking']);
    if (booking.status != BookingStatus.pendingPayment) return booking;
    return confirmPayment(bookingId);
  }

  Future<Booking> confirmPayment(String bookingId) async {
    final j = await api.post('/bookings/$bookingId/pay/confirm');
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

  /// Uploads a license scan to private storage and returns its storage key.
  Future<String> uploadLicense(List<int> bytes, String contentType) async {
    final signed = await api.post('/guides/me/license-upload', {'contentType': contentType, 'sizeBytes': bytes.length});
    final headers = Map<String, String>.from(signed['headers'] as Map);
    await api.uploadBytes(signed['uploadUrl'] as String, bytes, headers);
    return signed['key'] as String;
  }

  Future<void> submitLicense({
    required String licenseNumber,
    required String countryId,
    required String expiresAt,
    String? documentKey,
  }) =>
      api.post('/guides/me/application', {
        'licenseNumber': licenseNumber,
        'licenseCountryId': countryId,
        'licenseExpiresAt': expiresAt,
        if (documentKey != null) 'licenseDocumentKey': documentKey,
      });

  // ---- Notifications ------------------------------------------------------
  Future<void> registerDevice(String token, String platform) =>
      api.post('/me/devices', {'token': token, 'platform': platform});

  Future<void> unregisterDevice(String token) => api.post('/me/devices/unregister', {'token': token});

  Future<Inbox> inbox() async => Inbox.fromJson(await api.get('/me/notifications', query: {'limit': 50}));

  Future<void> markAllRead() => api.post('/me/notifications/read', {});

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
