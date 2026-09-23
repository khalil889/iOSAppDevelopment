# TourGuide mobile (Flutter)

Tourist and guide app for the certified tour guide marketplace. See the
[root README](../../README.md) for the full setup.

```bash
flutter pub get
# Android emulator reaches the host at 10.0.2.2; iOS simulator can use localhost
flutter run --dart-define=API_URL=http://10.0.2.2:3000/api
flutter analyze && flutter test
```

| Folder | Contents |
| --- | --- |
| `lib/core` | config (`API_URL`), HTTP client, session, formatting |
| `lib/models` | JSON models mirroring the API |
| `lib/services` | `Repository` (all API calls) and pluggable `LocationService` / `PaymentSheet` stubs |
| `lib/screens/tourist` | Explore, site guides, guide profile, booking, trips, review |
| `lib/screens/guide` | dashboard, license submission |
| `lib/screens/shared` | live tour + SOS, AI assistant, account |
