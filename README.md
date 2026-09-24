# Certified Tour Guide Marketplace — MVP (phase 1)

A marketplace where travellers book **licensed, admin-verified** local guides.
Payments are held in **escrow** until the tour is completed, reviews are only
possible for completed bookings, and the live-tour screen has an **SOS** button.

```
apps/
  mobile/     Flutter app — tourist mode + guide mode (Android / iOS)
  admin/      Next.js admin portal — guide verification queue
services/
  api/        NestJS REST API — PostgreSQL + PostGIS (TypeORM)
infra/        Postgres init scripts
docker-compose.yml   PostGIS 16
```

## Quick start

Prerequisites: Node 20+, Docker (or a local PostgreSQL 16 with PostGIS 3), Flutter 3.27+.

```bash
cp .env.example .env                 # the API also reads the root .env
npm install                          # installs api + admin workspaces
npm run db:up                        # PostGIS on :5432
npm run api:migrate                  # create the schema
npm run api:seed                     # demo data (resets all tables)
npm run api:dev                      # http://localhost:3000/api  — Swagger at /api/docs
npm run admin:dev                    # http://localhost:3001

cd apps/mobile && flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:3000/api   # Android emulator
```

### Demo accounts (from the seed)

| Role | Login | Password | What to try |
| --- | --- | --- | --- |
| Admin | admin@tourguide.test | `Admin123!` | Admin portal: approve Khalid, reject Layla |
| Tourist | sara@example.com | `Password123!` | Live tour + SOS, review the AlUla tour, upcoming booking |
| Guide | faisal@guides.test | `Password123!` | Dashboard, live tour → *Complete tour* |

Other seeded guides: noura, omar, mona, yousef (approved), khalid & layla
(pending), sami (rejected) — all `@guides.test` / `Password123!`.

Phone OTP: with `OTP_DEV_ECHO=true` the code is returned by
`/auth/otp/request` (and pre-filled in the app); otherwise it is only logged by
the stub SMS sender.

## Phase 1 scope

### Data model (`services/api/src/**/**.entity.ts`)

| Table | Notes |
| --- | --- |
| `users` | email (citext) + E.164 phone, role `TOURIST`/`GUIDE`/`ADMIN`, `phoneVerifiedAt` |
| `otp_codes` | bcrypt-hashed 6-digit codes, TTL, attempt counter |
| `countries`, `cities`, `sites` | cities and sites carry `geography(Point,4326)` with GiST indexes |
| `guides` | **license number** (unique), issuing country, expiry, document URL, **verification status** (`DRAFT → PENDING → APPROVED/REJECTED`, `SUSPENDED`), KYC status + result, denormalised rating, covered cities/sites |
| `guide_verification_events` | append-only audit trail of submissions and admin decisions |
| `tour_packages` | per-person or per-group price in **integer minor units**, duration, max group size, sites |
| `bookings` | status machine, price snapshot (subtotal / platform fee / guide payout), payment window |
| `payments` | provider ref, **escrow status** (`PENDING`, `HELD`, `RELEASED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `DISPUTED`, `FAILED`), refunded/released amounts, `releaseAfter` |
| `reviews` | one per booking (unique + rating `CHECK 1..5`) |
| `disputes` | reason, status, resolution (`REFUND_TOURIST` / `RELEASE_TO_GUIDE` / `PARTIAL_REFUND`) |
| `sos_alerts` | raised from the live-tour screen, optional location |

### Business rules

The rules are plain TypeScript functions with no framework imports, and each
has a unit test next to it:

- `bookings/booking.rules.ts`: who can book (a tourist with a verified phone,
  not the guide themselves), an **approved guide whose license is valid on the
  tour date**, an active package, group size, 2h minimum lead time, 365-day
  horizon, calendar conflicts (unpaid holds lapse after 15 min), the
  `pay/start/complete/cancel` transitions per actor, pricing, and the refund
  policy (≥48h: 100%, 24–48h: 50%, <24h: 0%; guide cancellations always 100%).
- `reviews/review.rules.ts`: a review needs a **COMPLETED** booking, must come
  from the booking's tourist, one per booking, within `REVIEW_WINDOW_DAYS`
  (30), with an integer rating from 1 to 5.
- `disputes/dispute.rules.ts`, `payments/escrow.rules.ts`: disputes are
  allowed while the tour is in progress or up to `DISPUTE_WINDOW_DAYS` (7)
  after it, and they freeze escrow. Escrow auto-releases after that window
  when no dispute is open (cron every 10 min).
- `guides/guide-verification.rules.ts`: only pending guides can be approved
  or rejected, approval needs an unexpired license, and rejecting needs a
  reason.

### API (`/api`, full list in Swagger at `/api/docs`)

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register` (email + password, sends phone OTP) · `POST /auth/login` · `POST /auth/otp/request` · `POST /auth/otp/verify` (verifies phone, signs in) · `GET /auth/me` |
| Explore | `GET /countries` · `GET /cities` · `GET /sites?q&countryId&cityId&category&lat&lng&radiusKm` · `GET /sites/:id` |
| Guides | `GET /guides?q&countryId&cityId&siteId&language&minRating&maxPriceMinor&date&lat&lng&radiusKm&sort` (verified only) · `GET /guides/:id` · `GET/PATCH /guides/me` · `POST /guides/me/application` · `GET /guides/me/dashboard` |
| Packages | `GET /packages/:id` · `GET /packages/mine` · `POST /packages` · `PATCH /packages/:id` |
| Bookings | `POST /bookings/quote` · `POST /bookings` · `GET /bookings` · `GET /bookings/:id` · `POST /bookings/:id/pay` · `/pay/confirm` · `/start` · `/complete` · `/cancel` · `/sos` |
| Payments | `GET /payments/config` (provider + publishable key) · `POST /payments/webhooks/moyasar` |
| Reviews / disputes | `POST /bookings/:id/review` · `POST /bookings/:id/disputes` · `GET /disputes/mine` |
| Assistant | `POST /assistant/chat` |
| Admin | `GET /admin/guides?status` · `GET /admin/guides/counts` · `GET /admin/guides/:id` · `POST /admin/guides/:id/approve` · `/reject` · `/suspend` · `GET /admin/disputes` · `POST /admin/disputes/:id/resolve` · `GET /admin/sos` · `POST /admin/payments/release-due` |

Rule violations come back with a stable error code, for example
`{"statusCode":409,"error":"SLOT_UNAVAILABLE","message":"..."}`.

### Mobile screens (`apps/mobile/lib/screens`)

Explore (places and guides with filters) · Guide profile · Booking (live
quote, then escrow payment) · Trips · Live tour (timer, stops, contact, and an
**SOS** button you hold for 1 second) · Review · AI travel assistant chat ·
Guide dashboard (verification status, earnings in escrow and paid out,
upcoming tours, start and complete tour) · License submission. The bottom
navigation switches between tourist and guide mode based on the account's
role. Guests can browse without signing in.

### Admin portal (`apps/admin`)

Verification queue with status tabs and counts, oldest submission first.
Opening a guide shows the license, the automated KYC checks, contact details,
coverage and audit history. From there an admin can **approve**, **reject**
(a reason is required, with templates to pick from) or suspend.

## Providers

Each external dependency is an interface. `ProvidersModule`
(`services/api/src/providers/providers.module.ts`) picks the implementation
from an env var, and a real provider refuses to boot if its keys are missing.
`stub` is the default everywhere, so local development and CI need no keys.

| Interface | Env | Real provider (phase 2) | Stub behaviour |
| --- | --- | --- | --- |
| `PaymentProvider` — `hold` / `verify` / `release` / `refund` | `PAYMENT_PROVIDER` | `moyasar` | Always holds, except token `tok_fail` (declined) and `tok_3ds` (needs action) |
| `SmsSender` | `SMS_PROVIDER` | `mobishastra` | Logs the message |
| `AiAssistant` — `chat(messages, context)` | `AI_PROVIDER` | `claude` | Intent rules answer from the sites and guides the service passes in |
| `KycProvider` — `checkLicense` | `KYC_PROVIDER` | — | `CC-NNNN` license numbers pass, anything containing "FAKE" fails, everything else returns "consider" |

The keys for each provider are listed in `.env.example`.

### Moyasar payments

1. The app calls `GET /api/payments/config` and gets the provider name and the
   **publishable** key.
2. The Moyasar Flutter SDK creates the payment in the app (card or mada, with
   3-D Secure) and puts the booking id in the payment metadata.
3. The app sends the payment id to `POST /bookings/:id/pay`. The API fetches the
   payment with the **secret** key and accepts it only if the booking id, amount
   and currency all match. The same payment can never fund two bookings: this is
   enforced by a unique index on the gateway reference.
4. If 3-D Secure is still pending, the booking stays `PENDING_PAYMENT`. It is
   confirmed either when the app calls `POST /bookings/:id/pay/confirm`, or when
   the Moyasar webhook arrives at `POST /api/payments/webhooks/moyasar`. The
   webhook is checked against `MOYASAR_WEBHOOK_SECRET`, and replaying it is safe.
5. If the payment completes after the 15-minute hold has lapsed and someone else
   has booked that slot meanwhile, the API refunds the payment in full and
   cancels the booking.

Refunds from cancellations and disputes go through Moyasar's refund API. Money
is captured straight away and held by the platform, because a card
authorisation expires long before most tours happen. Paying a guide ("release")
is recorded in the database, but moving the money to the guide is still a
finance step: a Moyasar payout or a bank transfer, done outside this API.

### Mobishastra SMS

Phone OTPs are sent through Mobishastra's HTTP API (`sendurl.aspx`). The SMS is
sent before the code is stored, so a rejected message doesn't lock the user out
for the 30-second resend wait. If the gateway fails, the request returns a 503
with a "try again shortly" message, and the account password is never written
to the logs. Sender IDs must be approved by Mobishastra; Saudi numbers need a
CITC-registered sender ID.

### Claude travel assistant

- **Model:** Claude (`claude-opus-5` by default, set by `ANTHROPIC_MODEL`), at
  low effort by default because chat is latency-sensitive.
- **Refusal fallback:** `fallbacks: "default"` is enabled, so a refused request
  is retried server-side on the model Anthropic recommends.
- **Grounding:** the system prompt never changes between requests. The sites
  and verified guides for the city are attached to the latest message instead.
- **Structured replies:** Claude answers in a JSON schema. Any suggested guide
  or site id that isn't in the supplied data is dropped.
- **Graceful fallback:** if the Claude API is unavailable, or the response is
  cut off or invalid, the rule-based assistant answers instead, so the chat
  never breaks.

The mobile app still has one stub: `LocationService` (use `geolocator` for GPS
in SOS alerts).

## Tests

```bash
npm run api:test                     # 95 Jest tests: business rules + Moyasar, Mobishastra and Claude providers (mocked HTTP)
cd apps/mobile && flutter test       # formatting, models, review screen, payment sheet selection and pay/confirm
cd apps/admin && npx tsc --noEmit    # type-check the admin portal
```

GitHub Actions (`.github/workflows/ci.yml`) runs the same checks on every pull request
and on pushes to `master`: API type-check, tests, build, migrations (up/down/up)
and seed against a PostGIS service; admin type-check and build; Flutter analyze and test.

## Not built yet

Document upload (the license is a URL for now), a real KYC provider, automated guide payouts, push
notifications and paging on SOS, guide availability calendars, payouts
onboarding, multi-currency price filtering (`maxPriceMinor` and price sort
compare raw minor units, so filter by city or country too), refresh tokens,
and admin screens for disputes and SOS (the API endpoints already exist).

---

## Legacy: iOS 10 & Swift 3 tutorials

Snapped code for iOS 10 & Swfit 3 app development Tutorial For Beginners PlayList in YouTube, check the videos Tutorial  [here](https://www.youtube.com/playlist?list=PLF8OvnCBlEY1BC20Bl73DuyW3LE5sGCUH)



![main](http://attach.alruabye.net/iOSAppDevelopment/swift31.png)
 
# iOSAppDevelopment
