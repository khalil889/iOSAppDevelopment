import 'package:geolocator/geolocator.dart';

/// Device location used by SOS alerts.
abstract class LocationService {
  /// Best-effort current position, or null if unavailable or not permitted.
  /// Must never throw: an SOS goes out with or without a location.
  Future<({double lat, double lng})?> current();
}

/// GPS via the platform location services (asks for permission on first use).
class GeolocatorLocationService implements LocationService {
  @override
  Future<({double lat, double lng})?> current() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) return await _lastKnown();
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return null;
      }
      final p = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 8)),
      );
      return (lat: p.latitude, lng: p.longitude);
    } catch (_) {
      // Timeout or platform error: fall back to the last fix rather than delaying the SOS.
      return await _lastKnown();
    }
  }

  Future<({double lat, double lng})?> _lastKnown() async {
    try {
      final p = await Geolocator.getLastKnownPosition();
      return p == null ? null : (lat: p.latitude, lng: p.longitude);
    } catch (_) {
      return null;
    }
  }
}

/// For tests and platforms without location.
class StubLocationService implements LocationService {
  StubLocationService([this.position]);
  final ({double lat, double lng})? position;

  @override
  Future<({double lat, double lng})?> current() async => position;
}
