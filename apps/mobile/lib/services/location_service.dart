/// Device location used by SOS alerts.
///
/// Phase 1 ships a stub so the app builds without platform permissions.
/// To use real GPS, add `geolocator`, request permission and return
/// `Position.latitude/longitude` from [current].
abstract class LocationService {
  Future<({double lat, double lng})?> current();
}

class StubLocationService implements LocationService {
  @override
  Future<({double lat, double lng})?> current() async => null;
}
