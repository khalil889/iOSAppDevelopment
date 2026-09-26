// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get accountSignedOutMessage =>
      'Sign in to book licensed guides, or create a guide account to offer tours.';

  @override
  String get accountSignInOrRegister => 'Sign in or register';

  @override
  String get accountGuideMode => 'Guide mode';

  @override
  String get accountTouristMode => 'Tourist mode';

  @override
  String get accountNoPhone => 'No phone';

  @override
  String get accountPhoneVerified => 'Verified';

  @override
  String get accountPhoneNotVerified => 'Not verified — required to book';

  @override
  String get accountVerify => 'Verify';

  @override
  String get accountPhoneVerifiedToast => 'Phone verified';

  @override
  String get accountSignOut => 'Sign out';

  @override
  String get accountSignOutAll => 'Sign out of all devices';

  @override
  String get accountSignOutAllHint => 'Use this if you lost a phone';

  @override
  String get accountSignOutAllTitle => 'Sign out everywhere?';

  @override
  String get accountSignOutAllBody =>
      'You will need to sign in again on every device.';

  @override
  String accountApiUrl(String url) {
    return 'API: $url';
  }

  @override
  String get assistantTitle => 'Travel assistant';

  @override
  String get assistantNewChat => 'New chat';

  @override
  String get assistantIntro =>
      'Ask me about places to visit, itineraries or finding a licensed guide.';

  @override
  String get assistantStarter1 => 'Plan 2 days in AlUla';

  @override
  String get assistantStarter2 => 'Find me a guide in Cairo';

  @override
  String get assistantStarter3 => 'What should I see in Riyadh?';

  @override
  String get assistantStarter4 => 'Is it safe to hike in Petra?';

  @override
  String get assistantInputHint => 'Ask anything…';

  @override
  String get assistantSend => 'Send';

  @override
  String get assistantThinking => 'Assistant is typing';

  @override
  String get authSignInTitle => 'Sign in';

  @override
  String get authTabEmail => 'Email';

  @override
  String get authTabPhone => 'Phone';

  @override
  String get authEmailLabel => 'Email';

  @override
  String get authPasswordLabel => 'Password';

  @override
  String get authSigningIn => 'Signing in…';

  @override
  String get authSignInButton => 'Sign in';

  @override
  String authDemoHint(String touristEmail, String guideEmail, String password) {
    return 'Demo: $touristEmail (tourist) or $guideEmail (guide), password $password';
  }

  @override
  String get authPhoneLabel => 'Phone number';

  @override
  String get authSendCode => 'Send code';

  @override
  String get authCreateAccountPrompt => 'New here? Create an account';

  @override
  String get authCreateAccount => 'Create account';

  @override
  String get authRoleTourist => 'I\'m travelling';

  @override
  String get authRoleGuide => 'I\'m a guide';

  @override
  String get authGuideLicenseNote =>
      'After sign-up, submit your tourism license from the dashboard. You can receive bookings once an admin verifies it.';

  @override
  String get authFullNameLabel => 'Full name';

  @override
  String get authNameRequired => 'Enter your name';

  @override
  String get authEmailInvalid => 'Enter a valid email';

  @override
  String get authMobileLabel => 'Mobile number';

  @override
  String authPhoneFormatError(String example) {
    return 'Use international format, e.g. $example';
  }

  @override
  String get authPasswordMinLabel => 'Password (min 8 characters)';

  @override
  String get authPasswordTooShort => 'At least 8 characters';

  @override
  String get authCreating => 'Creating…';

  @override
  String get authVerifyLater => 'You can verify your phone later from Account.';

  @override
  String get authVerifyPhoneTitle => 'Verify your phone';

  @override
  String authVerifyPhoneBody(String phone) {
    return 'Enter the code sent to $phone. A verified phone is required to book.';
  }

  @override
  String get authVerify => 'Verify';

  @override
  String get authResendCode => 'Resend code';

  @override
  String get authLater => 'Later';

  @override
  String get authEnterCodeTitle => 'Enter the code';

  @override
  String authCodeSentTo(String phone) {
    return 'We sent a 6-digit code to $phone.';
  }

  @override
  String get authDevCodePrefilled => 'Dev mode: code pre-filled';

  @override
  String get authVerifying => 'Verifying…';

  @override
  String get availabilityTitle => 'Availability';

  @override
  String get availabilitySaved =>
      'Availability saved. Existing bookings are unchanged.';

  @override
  String get availabilityStart => 'Start';

  @override
  String get availabilityEnd => 'End';

  @override
  String get availabilityEndBeforeStart =>
      'End time must be after the start time.';

  @override
  String get availabilityDiscardTitle => 'Discard changes?';

  @override
  String get availabilityKeepEditing => 'Keep editing';

  @override
  String get availabilityDiscard => 'Discard';

  @override
  String get availabilityWeeklyHours => 'Weekly hours';

  @override
  String availabilityNoHours(String start, String end) {
    return 'No hours set — tourists can book you any day between $start and $end.';
  }

  @override
  String get availabilityHoursHint =>
      'Local time of each tour\'s city. Tourists only see start times that fit.';

  @override
  String get availabilityTimeOff => 'Time off';

  @override
  String get availabilityAdd => 'Add';

  @override
  String get availabilityNoTimeOff => 'No days off planned.';

  @override
  String availabilityDateRange(String start, String end) {
    return '$start – $end';
  }

  @override
  String get availabilityRemove => 'Remove';

  @override
  String get availabilitySaving => 'Saving…';

  @override
  String get availabilitySaveChanges => 'Save changes';

  @override
  String get availabilitySavedState => 'Saved';

  @override
  String get availabilityDayOff => 'Off';

  @override
  String get availabilityAddHours => 'Add hours';

  @override
  String get availabilityCopyToWorkweek => 'Copy to Sun–Thu';

  @override
  String get bookingCouldNotLoadTimes => 'Could not load times';

  @override
  String get bookingCouldNotGetPrice => 'Could not get a price';

  @override
  String bookingPaymentDescription(String tour, String guide) {
    return '$tour with $guide';
  }

  @override
  String get bookingHeldMessage =>
      'Booking held for 15 minutes — pay from Trips to confirm.';

  @override
  String get bookingVerifyingPayment =>
      'We\'re still verifying your payment — check Trips in a moment.';

  @override
  String get bookingSuccessTitle => 'You\'re booked!';

  @override
  String bookingSuccessBody(String tour, String guide, String dateTime) {
    return '$tour with $guide\n$dateTime\n\nYour payment is held securely in escrow and released to the guide only after the tour.';
  }

  @override
  String get bookingDone => 'Done';

  @override
  String get bookingTitle => 'Book tour';

  @override
  String bookingWithGuide(String guide, String duration) {
    return 'with $guide · $duration';
  }

  @override
  String get bookingDate => 'Date';

  @override
  String get bookingStartTime => 'Start time';

  @override
  String bookingLocalTimeZone(String timeZone) {
    return 'local time · $timeZone';
  }

  @override
  String get bookingNoSlots => 'No free times on this day. Try another date.';

  @override
  String get bookingTravellers => 'Travellers';

  @override
  String bookingMaxGroup(int count) {
    return 'Max $count';
  }

  @override
  String get bookingNotesLabel => 'Notes for your guide (optional)';

  @override
  String get bookingPickTimeForPrice => 'Pick a start time to see the price.';

  @override
  String get bookingGettingPrice => 'Getting price…';

  @override
  String get bookingPrivateGroup => 'Private group tour';

  @override
  String get bookingTimeLabel => 'Time';

  @override
  String get bookingLocalFallback => 'local';

  @override
  String get bookingTotal => 'Total';

  @override
  String get bookingPolicy =>
      'Free cancellation up to 48 hours before. 50% refund between 24 and 48 hours. Your payment is held in escrow until the tour is completed.';

  @override
  String get bookingProcessing => 'Processing…';

  @override
  String get bookingConfirmPay => 'Confirm & pay';

  @override
  String get appTitle => 'TourGuide';

  @override
  String get tabExplore => 'Explore';

  @override
  String get tabTrips => 'Trips';

  @override
  String get tabAssistant => 'Assistant';

  @override
  String get tabAccount => 'Account';

  @override
  String get tabDashboard => 'Dashboard';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String get retry => 'Retry';

  @override
  String get close => 'Close';

  @override
  String get ok => 'OK';

  @override
  String get somethingWentWrong => 'Something went wrong';

  @override
  String get errorNetwork => 'Cannot reach the server. Check your connection.';

  @override
  String get errorUploadFailed =>
      'Upload failed. Check your connection and try again.';

  @override
  String errorUploadRejected(int status) {
    return 'Upload was rejected ($status). Please try again.';
  }

  @override
  String errorRequestFailed(int status) {
    return 'Request failed ($status)';
  }

  @override
  String get language => 'Language';

  @override
  String get languageSystem => 'Device language';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageArabic => 'العربية';

  @override
  String get ratingNew => 'New';

  @override
  String get bookingStatusPendingPayment => 'Awaiting payment';

  @override
  String get bookingStatusConfirmed => 'Confirmed';

  @override
  String get bookingStatusInProgress => 'Live now';

  @override
  String get bookingStatusCompleted => 'Completed';

  @override
  String get bookingStatusCancelled => 'Cancelled';

  @override
  String get categoryHeritage => 'Heritage';

  @override
  String get categoryMuseum => 'Museum';

  @override
  String get categoryNature => 'Nature';

  @override
  String get categoryReligious => 'Religious';

  @override
  String get categoryCity => 'City';

  @override
  String get categoryAdventure => 'Adventure';

  @override
  String get categoryFood => 'Food';

  @override
  String get escrowPending => 'Pending';

  @override
  String get escrowHeld => 'Held in escrow';

  @override
  String get escrowSettling => 'Settling';

  @override
  String get escrowReleased => 'Released to guide';

  @override
  String get escrowRefunded => 'Refunded';

  @override
  String get escrowPartiallyRefunded => 'Partially refunded';

  @override
  String get escrowDisputed => 'Disputed';

  @override
  String get escrowFailed => 'Failed';

  @override
  String get liveBadge => 'LIVE';

  @override
  String dashboardGreeting(String name) {
    return 'Hi $name';
  }

  @override
  String get dashboardRefresh => 'Refresh';

  @override
  String get dashboardRating => 'Rating';

  @override
  String dashboardReviews(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count reviews',
      one: '1 review',
      zero: 'No reviews',
    );
    return '$_temp0';
  }

  @override
  String get dashboardCompleted => 'Completed';

  @override
  String dashboardToursUnit(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'tours',
      one: 'tour',
    );
    return '$_temp0';
  }

  @override
  String get dashboardUpcoming => 'Upcoming';

  @override
  String get dashboardBooked => 'booked';

  @override
  String get dashboardPaidOut => 'Paid out';

  @override
  String get dashboardInEscrow => 'In escrow';

  @override
  String get dashboardEscrowInfo =>
      'Escrow is released 7 days after a completed tour if there is no dispute.';

  @override
  String get dashboardAvailabilitySubtitle => 'Weekly hours and days off';

  @override
  String get dashboardUpcomingTours => 'Upcoming tours';

  @override
  String get dashboardNoUpcomingTours => 'No upcoming tours.';

  @override
  String dashboardGuests(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count guests',
      one: '1 guest',
    );
    return '$_temp0';
  }

  @override
  String dashboardPayout(String amount) {
    return '$amount payout';
  }

  @override
  String get dashboardVerifiedTitle => 'Licensed & verified';

  @override
  String get dashboardVerifiedBody =>
      'You appear in search and can receive bookings.';

  @override
  String get dashboardPendingTitle => 'Verification in progress';

  @override
  String get dashboardPendingBody =>
      'An admin is reviewing your license. This usually takes 1–2 business days.';

  @override
  String get dashboardRejectedTitle => 'Verification rejected';

  @override
  String get dashboardRejectedBody =>
      'Please review and resubmit your license.';

  @override
  String get dashboardSuspendedTitle => 'Account suspended';

  @override
  String get dashboardSuspendedBody => 'Contact support.';

  @override
  String get dashboardDraftTitle => 'Submit your license';

  @override
  String get dashboardDraftBody =>
      'Add your tourism license to get verified and start receiving bookings.';

  @override
  String get dashboardResubmitLicense => 'Resubmit license';

  @override
  String get dashboardSubmitLicense => 'Submit license';

  @override
  String get exploreTitle => 'Explore';

  @override
  String exploreGreeting(String name) {
    return 'Hi $name 👋';
  }

  @override
  String get exploreSearchHint => 'Search sites, guides, cities';

  @override
  String get exploreTabPlaces => 'Places';

  @override
  String get exploreTabGuides => 'Guides';

  @override
  String get exploreAnyCity => 'Any city';

  @override
  String get exploreCityFallback => 'City';

  @override
  String exploreCityWithCountry(String city, String country) {
    return '$city, $country';
  }

  @override
  String get exploreAnyLanguage => 'Any language';

  @override
  String get exploreLangEn => 'English';

  @override
  String get exploreLangAr => 'Arabic';

  @override
  String get exploreLangFr => 'French';

  @override
  String get exploreLangDe => 'German';

  @override
  String get exploreLangEs => 'Spanish';

  @override
  String get exploreLangIt => 'Italian';

  @override
  String get exploreLangUr => 'Urdu';

  @override
  String exploreMinRating(String rating) {
    return '$rating★+';
  }

  @override
  String get exploreSortTopRated => 'Top rated';

  @override
  String get exploreSortLowestPrice => 'Lowest price';

  @override
  String get exploreSortMostExperienced => 'Most experienced';

  @override
  String get exploreNoPlaces => 'No places match your filters.';

  @override
  String get exploreNoGuides => 'No licensed guides match your filters.';

  @override
  String get guideProfileTouristOnly =>
      'Switch to a tourist account to book tours.';

  @override
  String get guideProfileLicense => 'License';

  @override
  String get guideProfileLanguages => 'Languages';

  @override
  String get guideProfileExperience => 'Experience';

  @override
  String guideProfileYears(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count years',
      one: '1 year',
    );
    return '$_temp0';
  }

  @override
  String get guideProfileCities => 'Cities';

  @override
  String get guideProfileListSeparator => ', ';

  @override
  String get guideProfileTours => 'Tours';

  @override
  String get guideProfileNoTours => 'No tours available right now.';

  @override
  String get guideProfileReviews => 'Reviews';

  @override
  String get guideProfileNoReviews => 'No reviews yet.';

  @override
  String guideProfileUpTo(int count) {
    return 'Up to $count';
  }

  @override
  String guideProfileVisits(String sites) {
    return 'Visits: $sites';
  }

  @override
  String get guideProfilePerPerson => ' / person';

  @override
  String get guideProfilePerGroup => ' / group';

  @override
  String get guideProfileBook => 'Book';

  @override
  String get licenseTitle => 'Tourism license';

  @override
  String get licenseIntro =>
      'We verify every guide against the issuing authority before they can take bookings.';

  @override
  String get licenseCountryLabel => 'Issuing country';

  @override
  String get licenseCountryRequired => 'Select a country';

  @override
  String get licenseNumberLabel => 'License number';

  @override
  String get licenseNumberRequired => 'Enter your license number';

  @override
  String get licenseExpiryLabel => 'Expiry date';

  @override
  String get licenseExpiryRequired => 'Pick the expiry date';

  @override
  String get licenseSelect => 'Select';

  @override
  String get licensePhotoTitle => 'Photo of your license';

  @override
  String get licenseUploaded => 'Uploaded';

  @override
  String get licenseTakePhoto => 'Take photo';

  @override
  String get licenseChoosePhoto => 'Choose';

  @override
  String get licensePrivacyNote =>
      'Stored privately; only our verification team can see it.';

  @override
  String get licenseSubmitting => 'Submitting…';

  @override
  String get licenseSubmit => 'Submit for verification';

  @override
  String get licensePhotoRequired => 'Add a photo of your license first.';

  @override
  String get licenseSubmitted => 'Submitted for verification';

  @override
  String get liveTitleLive => 'Live tour';

  @override
  String get liveTitleDetails => 'Tour details';

  @override
  String get liveTourFallback => 'Tour';

  @override
  String liveTravellers(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count travellers',
      one: '1 traveller',
    );
    return '$_temp0';
  }

  @override
  String liveScheduleLine(String start, String end, String travellers) {
    return '$start – $end · $travellers';
  }

  @override
  String liveYourTraveller(String phone) {
    return 'Your traveller · $phone';
  }

  @override
  String liveYourGuide(String phone) {
    return 'Your licensed guide · $phone';
  }

  @override
  String get liveStops => 'Stops';

  @override
  String liveNotes(String notes) {
    return 'Notes: $notes';
  }

  @override
  String get liveStartTour => 'Start tour';

  @override
  String get liveTourStarted => 'Tour started';

  @override
  String get liveCompleteTour => 'Complete tour';

  @override
  String get liveTourCompleted => 'Tour completed — payout scheduled';

  @override
  String get liveSosHint =>
      'Press and hold for 1 second to alert our 24/7 safety team.';

  @override
  String livePaymentStatus(String status) {
    return 'Payment: $status';
  }

  @override
  String get liveSosButton => 'SOS';

  @override
  String get liveSosSemantics => 'SOS emergency alert. Press and hold.';

  @override
  String get liveSosDialogTitle => 'Send SOS alert?';

  @override
  String get liveSosDialogBody =>
      'We will share your booking and location with our safety team.';

  @override
  String get liveSosMessageLabel => 'What\'s happening? (optional)';

  @override
  String get liveSosSend => 'Send SOS';

  @override
  String get liveSosSentTitle => 'Help is on the way';

  @override
  String get liveSosSentBody =>
      'Our safety team has been alerted with your booking details and will contact you right away.\n\nIf you are in immediate danger, call local emergency services.';

  @override
  String get notifTitle => 'Notifications';

  @override
  String get notifOpen => 'Open';

  @override
  String get notifMarkAllRead => 'Mark all read';

  @override
  String get notifEmpty => 'No notifications yet.';

  @override
  String get notifAgoNow => 'now';

  @override
  String notifAgoMinutes(int count) {
    return '${count}m';
  }

  @override
  String notifAgoHours(int count) {
    return '${count}h';
  }

  @override
  String notifAgoDays(int count) {
    return '${count}d';
  }

  @override
  String paymentPayAmount(String amount) {
    return 'Pay $amount';
  }

  @override
  String get paymentEscrowNote =>
      'Held securely in escrow and released to your guide only after the tour.';

  @override
  String get paymentFailedTryAnother => 'Payment failed. Try another card.';

  @override
  String get paymentNotCompleted => 'Payment could not be completed.';

  @override
  String get paymentTestModeNote =>
      'Test mode — no real charge. Funds are held in escrow until your tour is completed.';

  @override
  String get paymentTestCardSucceeds => 'Test card — succeeds';

  @override
  String get paymentTestCardDeclined => 'Test card — declined';

  @override
  String get reviewRatingPoor => 'Poor';

  @override
  String get reviewRatingFair => 'Fair';

  @override
  String get reviewRatingGood => 'Good';

  @override
  String get reviewRatingGreat => 'Great';

  @override
  String get reviewRatingOutstanding => 'Outstanding';

  @override
  String get reviewThanks => 'Thanks for your review!';

  @override
  String get reviewTitle => 'Review your tour';

  @override
  String reviewPrompt(String tour, String guide) {
    return 'How was $tour with $guide?';
  }

  @override
  String get reviewYourTour => 'your tour';

  @override
  String get reviewYourGuide => 'your guide';

  @override
  String get reviewCommentLabel => 'Tell other travellers about it (optional)';

  @override
  String get reviewSubmitting => 'Submitting…';

  @override
  String get reviewSubmit => 'Submit review';

  @override
  String siteGuidesCityWithCountry(String city, String country) {
    return '$city, $country';
  }

  @override
  String get siteGuidesLicenseRequired => 'Licensed guide required';

  @override
  String get siteGuidesLicenseRequiredBody =>
      'Every guide below holds a verified tourism license.';

  @override
  String get siteGuidesHeading => 'Guides for this place';

  @override
  String get siteGuidesEmpty => 'No guides cover this place yet.';

  @override
  String get tripsTitle => 'My trips';

  @override
  String get tripsRefresh => 'Refresh';

  @override
  String get tripsSignInPrompt => 'Sign in to see your bookings.';

  @override
  String get tripsSignIn => 'Sign in';

  @override
  String get tripsEmpty => 'No trips yet. Find a licensed guide in Explore.';

  @override
  String get tripsSectionLive => 'Live now';

  @override
  String get tripsSectionUpcoming => 'Upcoming';

  @override
  String get tripsSectionPast => 'Past';

  @override
  String get tripsTourFallback => 'Tour';

  @override
  String tripsTravellers(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count travellers',
      one: '1 traveller',
    );
    return '$_temp0';
  }

  @override
  String tripsScheduleLine(String date, String travellers) {
    return '$date · $travellers';
  }

  @override
  String tripsGuideLine(String name, String amount) {
    return 'Guide: $name · $amount';
  }

  @override
  String get tripsOpenLiveTour => 'Open live tour';

  @override
  String get tripsDetailsSafety => 'Details & safety';

  @override
  String get tripsPaymentDescription => 'Tour booking';

  @override
  String get tripsPayNow => 'Pay now';

  @override
  String get tripsLeaveReview => 'Leave a review';

  @override
  String get tripsRefundNoPayment => 'No payment has been taken.';

  @override
  String get tripsRefundFull => 'You will get a full refund.';

  @override
  String get tripsRefundHalf => 'You will get a 50% refund.';

  @override
  String get tripsRefundNone => 'Cancelling within 24 hours is not refundable.';

  @override
  String get tripsCancelTitle => 'Cancel booking?';

  @override
  String get tripsKeep => 'Keep';

  @override
  String get tripsCancelConfirm => 'Cancel booking';

  @override
  String tripsCancelled(int percent) {
    return 'Booking cancelled. Refund: $percent%';
  }

  @override
  String get widgetLicensed => 'Licensed';

  @override
  String get widgetFromPrice => 'from';

  @override
  String widgetDistanceKm(String distance) {
    return '$distance km';
  }

  @override
  String get widgetLicensedGuideRequired => 'A licensed guide is required here';

  @override
  String get toursTitle => 'My tours';

  @override
  String get toursDashboardSubtitle => 'Create and edit the tours you offer';

  @override
  String get toursEmpty =>
      'You haven\'t created any tours yet. Travellers can book you once you publish a tour.';

  @override
  String get toursCreateFirst => 'Create your first tour';

  @override
  String get toursAdd => 'New tour';

  @override
  String get toursActive => 'Active';

  @override
  String get toursPaused => 'Paused';

  @override
  String get toursActiveToggle => 'Visible to travellers';

  @override
  String get toursNowActive => 'Tour is visible to travellers again.';

  @override
  String get toursNowPaused =>
      'Tour paused. Travellers can\'t book it until you turn it back on.';

  @override
  String toursPricePerPerson(String price) {
    return '$price per person';
  }

  @override
  String toursPricePerGroup(String price) {
    return '$price per group';
  }

  @override
  String toursUpTo(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'Up to $count people',
      one: 'Up to 1 person',
    );
    return '$_temp0';
  }

  @override
  String get toursNewTitle => 'New tour';

  @override
  String get toursEditTitle => 'Edit tour';

  @override
  String get toursSectionEnglish => 'English';

  @override
  String get toursSectionArabic => 'Arabic';

  @override
  String get toursArabicHint =>
      'Optional. Shown to travellers who use the app in Arabic.';

  @override
  String get toursTitleEnLabel => 'Tour title';

  @override
  String get toursDescriptionEnLabel => 'Description';

  @override
  String get toursTitleArLabel => 'Tour title in Arabic';

  @override
  String get toursDescriptionArLabel => 'Description in Arabic';

  @override
  String get toursDescriptionHint => 'What travellers will see and do';

  @override
  String get toursTitleRequired => 'Enter a title of at least 3 characters';

  @override
  String get toursTitleTooShort =>
      'Use at least 3 characters or leave it empty';

  @override
  String get toursSectionDetails => 'Tour details';

  @override
  String get toursCityLabel => 'City';

  @override
  String get toursCityRequired => 'Choose a city';

  @override
  String get toursNoCities =>
      'Add the cities you work in to your guide profile, then come back to create a tour there.';

  @override
  String get toursSitesLabel => 'Sites on this tour';

  @override
  String get toursSitesPickCity => 'Choose a city to see its sites.';

  @override
  String get toursSitesEmpty => 'No sites are listed for this city yet.';

  @override
  String get toursDurationLabel => 'Duration';

  @override
  String get toursDecrease => 'Decrease';

  @override
  String get toursIncrease => 'Increase';

  @override
  String get toursPricingLabel => 'Pricing';

  @override
  String get toursPricingPerGroup => 'Per group';

  @override
  String get toursPricingPerPerson => 'Per person';

  @override
  String get toursPriceLabel => 'Price';

  @override
  String get toursPriceHelperPerGroup => 'One price for the whole group';

  @override
  String get toursPriceHelperPerPerson => 'Charged for each traveller';

  @override
  String get toursPriceRequired => 'Enter a price';

  @override
  String toursPriceInvalid(int decimals) {
    String _temp0 = intl.Intl.pluralLogic(
      decimals,
      locale: localeName,
      other: 'Enter a price with at most $decimals decimal places',
      one: 'Enter a price with at most 1 decimal place',
      zero: 'Enter a whole number',
    );
    return '$_temp0';
  }

  @override
  String toursPriceTooHigh(String max) {
    return 'The price must be at most $max';
  }

  @override
  String get toursGroupSizeLabel => 'Maximum group size';

  @override
  String toursPeople(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count people',
      one: '1 person',
    );
    return '$_temp0';
  }

  @override
  String get toursLanguagesLabel => 'Languages you guide this tour in';

  @override
  String get toursLanguagesRequired => 'Choose at least one language';

  @override
  String get toursLangZh => 'Chinese';

  @override
  String get toursLangRu => 'Russian';

  @override
  String get toursLangHi => 'Hindi';

  @override
  String get toursLangTr => 'Turkish';

  @override
  String get toursPhotosLabel => 'Photos';

  @override
  String toursPhotosHint(int max) {
    String _temp0 = intl.Intl.pluralLogic(
      max,
      locale: localeName,
      other: 'Up to $max photos.',
      one: 'Up to 1 photo.',
    );
    return '$_temp0 The first photo is the cover.';
  }

  @override
  String get toursAddPhoto => 'Add photo';

  @override
  String get toursTakePhoto => 'Take a photo';

  @override
  String get toursChoosePhoto => 'Choose from gallery';

  @override
  String get toursCover => 'Cover';

  @override
  String get toursMakeCover => 'Make cover';

  @override
  String get toursRemovePhoto => 'Remove photo';

  @override
  String get toursPhotoTooLarge =>
      'This photo is larger than 5 MB. Choose a smaller one.';

  @override
  String get toursPhotoUploading => 'Uploading photo…';

  @override
  String get toursActiveHint => 'Turn off to pause new bookings for this tour.';

  @override
  String get toursCreate => 'Create tour';

  @override
  String get toursSave => 'Save changes';

  @override
  String get toursSaving => 'Saving…';

  @override
  String get toursCreated => 'Tour created.';

  @override
  String get toursSaved => 'Tour updated.';

  @override
  String get dashboardEarningsTile => 'Earnings & payouts';

  @override
  String get dashboardEarningsTileSubtitle =>
      'Balance, bank account and payout history';

  @override
  String get earningsTitle => 'Earnings & payouts';

  @override
  String get earningsOwedTitle => 'Waiting to be paid out';

  @override
  String get earningsOwedInfo =>
      'Money released after your tours is sent to your bank account in the next payout.';

  @override
  String get earningsOwedEmpty =>
      'Nothing is waiting to be paid out right now.';

  @override
  String earningsFromPayments(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: 'From $count tour payments',
      one: 'From 1 tour payment',
    );
    return '$_temp0';
  }

  @override
  String get earningsAccountTitle => 'Bank account for payouts';

  @override
  String get earningsAccountMissing =>
      'Add your bank account so we can send you your earnings.';

  @override
  String get earningsAccountAdd => 'Add bank account';

  @override
  String get earningsAccountChange => 'Change bank account';

  @override
  String get earningsAccountHolder => 'Account holder';

  @override
  String get earningsAccountIban => 'IBAN';

  @override
  String get earningsAccountBank => 'Bank';

  @override
  String get earningsHistoryTitle => 'Payout history';

  @override
  String get earningsHistoryEmpty => 'No payouts yet.';

  @override
  String earningsPaidOn(String date) {
    return 'Paid on $date';
  }

  @override
  String earningsCreatedOn(String date) {
    return 'Started on $date';
  }

  @override
  String earningsPayoutTo(String iban) {
    return 'To $iban';
  }

  @override
  String earningsReference(String reference) {
    return 'Reference: $reference';
  }

  @override
  String get payoutStatusPending => 'Processing';

  @override
  String get payoutStatusPaid => 'Paid';

  @override
  String get payoutStatusFailed => 'Failed';

  @override
  String get payoutAccountTitle => 'Bank account';

  @override
  String get payoutAccountIntro =>
      'We send your earnings by bank transfer to this account. It must be in your name.';

  @override
  String get payoutAccountSecurity =>
      'Your bank details are stored encrypted. After saving, only the last 4 digits of the IBAN are shown.';

  @override
  String payoutAccountCurrent(String iban) {
    return 'Current account: $iban. Enter the full IBAN again to change it.';
  }

  @override
  String get payoutHolderLabel => 'Account holder name';

  @override
  String get payoutHolderError =>
      'Enter the name on the account (at least 3 characters)';

  @override
  String get payoutIbanLabel => 'IBAN';

  @override
  String get payoutIbanRequired => 'Enter your IBAN';

  @override
  String get payoutIbanFormat =>
      'An IBAN starts with a two-letter country code and two digits, e.g. SA03';

  @override
  String payoutIbanLength(String country, int length) {
    return 'A $country IBAN has $length characters';
  }

  @override
  String get payoutIbanLengthGeneric =>
      'An IBAN has between 15 and 34 characters';

  @override
  String get payoutIbanChecksum =>
      'This IBAN isn\'t valid. Check it for typos.';

  @override
  String get payoutBankLabel => 'Bank name (optional)';

  @override
  String get payoutBankError => 'Enter between 2 and 80 characters';

  @override
  String get payoutSave => 'Save bank account';

  @override
  String get payoutSaving => 'Saving…';

  @override
  String get payoutSaved =>
      'Bank account saved. For your security, payouts to new bank details start after 24 hours.';

  @override
  String get identityTitle => 'Identity verification';

  @override
  String get identityExplain =>
      'Scan your ID document and take a selfie. It takes about 3 minutes and is required before your account can be approved.';

  @override
  String get identityStatusNotStarted => 'Not started';

  @override
  String get identityStatusPending => 'In review';

  @override
  String get identityStatusApproved => 'Verified';

  @override
  String get identityStatusRetry => 'Needs another try';

  @override
  String get identityStatusRejected => 'Rejected';

  @override
  String get identityPendingBody =>
      'We\'re checking your documents. This usually takes a few minutes.';

  @override
  String get identityApprovedBody => 'Your identity has been verified.';

  @override
  String get identityRetryBody =>
      'The check couldn\'t be completed. Please try again.';

  @override
  String get identityRejectedBody =>
      'We couldn\'t verify your identity. Please contact support.';

  @override
  String identityReviewerNote(String comment) {
    return 'Note: $comment';
  }

  @override
  String get identityStart => 'Verify my identity';

  @override
  String get identityTryAgain => 'Try again';

  @override
  String get identityStarting => 'Opening…';

  @override
  String get identityOpenFailed => 'Couldn\'t open the verification page.';

  @override
  String get identityReturnHint =>
      'Finish the steps in the browser, then come back here to see the result.';

  @override
  String get payoutAccountHoldNote =>
      'For your security, payouts to new bank details start after 24 hours, and we notify you by SMS whenever they change.';

  @override
  String earningsAccountHeld(String date) {
    return 'For your security, payouts to these details start after $date.';
  }
}
