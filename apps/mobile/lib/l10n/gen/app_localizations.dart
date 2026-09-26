import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'gen/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en')
  ];

  /// No description provided for @accountSignedOutMessage.
  ///
  /// In en, this message translates to:
  /// **'Sign in to book licensed guides, or create a guide account to offer tours.'**
  String get accountSignedOutMessage;

  /// No description provided for @accountSignInOrRegister.
  ///
  /// In en, this message translates to:
  /// **'Sign in or register'**
  String get accountSignInOrRegister;

  /// No description provided for @accountGuideMode.
  ///
  /// In en, this message translates to:
  /// **'Guide mode'**
  String get accountGuideMode;

  /// No description provided for @accountTouristMode.
  ///
  /// In en, this message translates to:
  /// **'Tourist mode'**
  String get accountTouristMode;

  /// No description provided for @accountNoPhone.
  ///
  /// In en, this message translates to:
  /// **'No phone'**
  String get accountNoPhone;

  /// No description provided for @accountPhoneVerified.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get accountPhoneVerified;

  /// No description provided for @accountPhoneNotVerified.
  ///
  /// In en, this message translates to:
  /// **'Not verified — required to book'**
  String get accountPhoneNotVerified;

  /// No description provided for @accountVerify.
  ///
  /// In en, this message translates to:
  /// **'Verify'**
  String get accountVerify;

  /// No description provided for @accountPhoneVerifiedToast.
  ///
  /// In en, this message translates to:
  /// **'Phone verified'**
  String get accountPhoneVerifiedToast;

  /// No description provided for @accountSignOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get accountSignOut;

  /// No description provided for @accountSignOutAll.
  ///
  /// In en, this message translates to:
  /// **'Sign out of all devices'**
  String get accountSignOutAll;

  /// No description provided for @accountSignOutAllHint.
  ///
  /// In en, this message translates to:
  /// **'Use this if you lost a phone'**
  String get accountSignOutAllHint;

  /// No description provided for @accountSignOutAllTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign out everywhere?'**
  String get accountSignOutAllTitle;

  /// No description provided for @accountSignOutAllBody.
  ///
  /// In en, this message translates to:
  /// **'You will need to sign in again on every device.'**
  String get accountSignOutAllBody;

  /// No description provided for @accountApiUrl.
  ///
  /// In en, this message translates to:
  /// **'API: {url}'**
  String accountApiUrl(String url);

  /// No description provided for @assistantTitle.
  ///
  /// In en, this message translates to:
  /// **'Travel assistant'**
  String get assistantTitle;

  /// No description provided for @assistantNewChat.
  ///
  /// In en, this message translates to:
  /// **'New chat'**
  String get assistantNewChat;

  /// No description provided for @assistantIntro.
  ///
  /// In en, this message translates to:
  /// **'Ask me about places to visit, itineraries or finding a licensed guide.'**
  String get assistantIntro;

  /// No description provided for @assistantStarter1.
  ///
  /// In en, this message translates to:
  /// **'Plan 2 days in AlUla'**
  String get assistantStarter1;

  /// No description provided for @assistantStarter2.
  ///
  /// In en, this message translates to:
  /// **'Find me a guide in Cairo'**
  String get assistantStarter2;

  /// No description provided for @assistantStarter3.
  ///
  /// In en, this message translates to:
  /// **'What should I see in Riyadh?'**
  String get assistantStarter3;

  /// No description provided for @assistantStarter4.
  ///
  /// In en, this message translates to:
  /// **'Is it safe to hike in Petra?'**
  String get assistantStarter4;

  /// No description provided for @assistantInputHint.
  ///
  /// In en, this message translates to:
  /// **'Ask anything…'**
  String get assistantInputHint;

  /// No description provided for @assistantSend.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get assistantSend;

  /// No description provided for @assistantThinking.
  ///
  /// In en, this message translates to:
  /// **'Assistant is typing'**
  String get assistantThinking;

  /// No description provided for @authSignInTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get authSignInTitle;

  /// No description provided for @authTabEmail.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get authTabEmail;

  /// No description provided for @authTabPhone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get authTabPhone;

  /// No description provided for @authEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get authEmailLabel;

  /// No description provided for @authPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get authPasswordLabel;

  /// No description provided for @authSigningIn.
  ///
  /// In en, this message translates to:
  /// **'Signing in…'**
  String get authSigningIn;

  /// No description provided for @authSignInButton.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get authSignInButton;

  /// No description provided for @authDemoHint.
  ///
  /// In en, this message translates to:
  /// **'Demo: {touristEmail} (tourist) or {guideEmail} (guide), password {password}'**
  String authDemoHint(String touristEmail, String guideEmail, String password);

  /// No description provided for @authPhoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get authPhoneLabel;

  /// No description provided for @authSendCode.
  ///
  /// In en, this message translates to:
  /// **'Send code'**
  String get authSendCode;

  /// No description provided for @authCreateAccountPrompt.
  ///
  /// In en, this message translates to:
  /// **'New here? Create an account'**
  String get authCreateAccountPrompt;

  /// No description provided for @authCreateAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get authCreateAccount;

  /// No description provided for @authRoleTourist.
  ///
  /// In en, this message translates to:
  /// **'I\'m travelling'**
  String get authRoleTourist;

  /// No description provided for @authRoleGuide.
  ///
  /// In en, this message translates to:
  /// **'I\'m a guide'**
  String get authRoleGuide;

  /// No description provided for @authGuideLicenseNote.
  ///
  /// In en, this message translates to:
  /// **'After sign-up, submit your tourism license from the dashboard. You can receive bookings once an admin verifies it.'**
  String get authGuideLicenseNote;

  /// No description provided for @authFullNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get authFullNameLabel;

  /// No description provided for @authNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your name'**
  String get authNameRequired;

  /// No description provided for @authEmailInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get authEmailInvalid;

  /// No description provided for @authMobileLabel.
  ///
  /// In en, this message translates to:
  /// **'Mobile number'**
  String get authMobileLabel;

  /// No description provided for @authPhoneFormatError.
  ///
  /// In en, this message translates to:
  /// **'Use international format, e.g. {example}'**
  String authPhoneFormatError(String example);

  /// No description provided for @authPasswordMinLabel.
  ///
  /// In en, this message translates to:
  /// **'Password (min 8 characters)'**
  String get authPasswordMinLabel;

  /// No description provided for @authPasswordTooShort.
  ///
  /// In en, this message translates to:
  /// **'At least 8 characters'**
  String get authPasswordTooShort;

  /// No description provided for @authCreating.
  ///
  /// In en, this message translates to:
  /// **'Creating…'**
  String get authCreating;

  /// No description provided for @authVerifyLater.
  ///
  /// In en, this message translates to:
  /// **'You can verify your phone later from Account.'**
  String get authVerifyLater;

  /// No description provided for @authVerifyPhoneTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify your phone'**
  String get authVerifyPhoneTitle;

  /// No description provided for @authVerifyPhoneBody.
  ///
  /// In en, this message translates to:
  /// **'Enter the code sent to {phone}. A verified phone is required to book.'**
  String authVerifyPhoneBody(String phone);

  /// No description provided for @authVerify.
  ///
  /// In en, this message translates to:
  /// **'Verify'**
  String get authVerify;

  /// No description provided for @authResendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get authResendCode;

  /// No description provided for @authLater.
  ///
  /// In en, this message translates to:
  /// **'Later'**
  String get authLater;

  /// No description provided for @authEnterCodeTitle.
  ///
  /// In en, this message translates to:
  /// **'Enter the code'**
  String get authEnterCodeTitle;

  /// No description provided for @authCodeSentTo.
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit code to {phone}.'**
  String authCodeSentTo(String phone);

  /// No description provided for @authDevCodePrefilled.
  ///
  /// In en, this message translates to:
  /// **'Dev mode: code pre-filled'**
  String get authDevCodePrefilled;

  /// No description provided for @authVerifying.
  ///
  /// In en, this message translates to:
  /// **'Verifying…'**
  String get authVerifying;

  /// No description provided for @availabilityTitle.
  ///
  /// In en, this message translates to:
  /// **'Availability'**
  String get availabilityTitle;

  /// No description provided for @availabilitySaved.
  ///
  /// In en, this message translates to:
  /// **'Availability saved. Existing bookings are unchanged.'**
  String get availabilitySaved;

  /// No description provided for @availabilityStart.
  ///
  /// In en, this message translates to:
  /// **'Start'**
  String get availabilityStart;

  /// No description provided for @availabilityEnd.
  ///
  /// In en, this message translates to:
  /// **'End'**
  String get availabilityEnd;

  /// No description provided for @availabilityEndBeforeStart.
  ///
  /// In en, this message translates to:
  /// **'End time must be after the start time.'**
  String get availabilityEndBeforeStart;

  /// No description provided for @availabilityDiscardTitle.
  ///
  /// In en, this message translates to:
  /// **'Discard changes?'**
  String get availabilityDiscardTitle;

  /// No description provided for @availabilityKeepEditing.
  ///
  /// In en, this message translates to:
  /// **'Keep editing'**
  String get availabilityKeepEditing;

  /// No description provided for @availabilityDiscard.
  ///
  /// In en, this message translates to:
  /// **'Discard'**
  String get availabilityDiscard;

  /// No description provided for @availabilityWeeklyHours.
  ///
  /// In en, this message translates to:
  /// **'Weekly hours'**
  String get availabilityWeeklyHours;

  /// No description provided for @availabilityNoHours.
  ///
  /// In en, this message translates to:
  /// **'No hours set — tourists can book you any day between {start} and {end}.'**
  String availabilityNoHours(String start, String end);

  /// No description provided for @availabilityHoursHint.
  ///
  /// In en, this message translates to:
  /// **'Local time of each tour\'s city. Tourists only see start times that fit.'**
  String get availabilityHoursHint;

  /// No description provided for @availabilityTimeOff.
  ///
  /// In en, this message translates to:
  /// **'Time off'**
  String get availabilityTimeOff;

  /// No description provided for @availabilityAdd.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get availabilityAdd;

  /// No description provided for @availabilityNoTimeOff.
  ///
  /// In en, this message translates to:
  /// **'No days off planned.'**
  String get availabilityNoTimeOff;

  /// No description provided for @availabilityDateRange.
  ///
  /// In en, this message translates to:
  /// **'{start} – {end}'**
  String availabilityDateRange(String start, String end);

  /// No description provided for @availabilityRemove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get availabilityRemove;

  /// No description provided for @availabilitySaving.
  ///
  /// In en, this message translates to:
  /// **'Saving…'**
  String get availabilitySaving;

  /// No description provided for @availabilitySaveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get availabilitySaveChanges;

  /// No description provided for @availabilitySavedState.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get availabilitySavedState;

  /// No description provided for @availabilityDayOff.
  ///
  /// In en, this message translates to:
  /// **'Off'**
  String get availabilityDayOff;

  /// No description provided for @availabilityAddHours.
  ///
  /// In en, this message translates to:
  /// **'Add hours'**
  String get availabilityAddHours;

  /// No description provided for @availabilityCopyToWorkweek.
  ///
  /// In en, this message translates to:
  /// **'Copy to Sun–Thu'**
  String get availabilityCopyToWorkweek;

  /// No description provided for @bookingCouldNotLoadTimes.
  ///
  /// In en, this message translates to:
  /// **'Could not load times'**
  String get bookingCouldNotLoadTimes;

  /// No description provided for @bookingCouldNotGetPrice.
  ///
  /// In en, this message translates to:
  /// **'Could not get a price'**
  String get bookingCouldNotGetPrice;

  /// No description provided for @bookingPaymentDescription.
  ///
  /// In en, this message translates to:
  /// **'{tour} with {guide}'**
  String bookingPaymentDescription(String tour, String guide);

  /// No description provided for @bookingHeldMessage.
  ///
  /// In en, this message translates to:
  /// **'Booking held for 15 minutes — pay from Trips to confirm.'**
  String get bookingHeldMessage;

  /// No description provided for @bookingVerifyingPayment.
  ///
  /// In en, this message translates to:
  /// **'We\'re still verifying your payment — check Trips in a moment.'**
  String get bookingVerifyingPayment;

  /// No description provided for @bookingSuccessTitle.
  ///
  /// In en, this message translates to:
  /// **'You\'re booked!'**
  String get bookingSuccessTitle;

  /// No description provided for @bookingSuccessBody.
  ///
  /// In en, this message translates to:
  /// **'{tour} with {guide}\n{dateTime}\n\nYour payment is held securely in escrow and released to the guide only after the tour.'**
  String bookingSuccessBody(String tour, String guide, String dateTime);

  /// No description provided for @bookingDone.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get bookingDone;

  /// No description provided for @bookingTitle.
  ///
  /// In en, this message translates to:
  /// **'Book tour'**
  String get bookingTitle;

  /// No description provided for @bookingWithGuide.
  ///
  /// In en, this message translates to:
  /// **'with {guide} · {duration}'**
  String bookingWithGuide(String guide, String duration);

  /// No description provided for @bookingDate.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get bookingDate;

  /// No description provided for @bookingStartTime.
  ///
  /// In en, this message translates to:
  /// **'Start time'**
  String get bookingStartTime;

  /// No description provided for @bookingLocalTimeZone.
  ///
  /// In en, this message translates to:
  /// **'local time · {timeZone}'**
  String bookingLocalTimeZone(String timeZone);

  /// No description provided for @bookingNoSlots.
  ///
  /// In en, this message translates to:
  /// **'No free times on this day. Try another date.'**
  String get bookingNoSlots;

  /// No description provided for @bookingTravellers.
  ///
  /// In en, this message translates to:
  /// **'Travellers'**
  String get bookingTravellers;

  /// No description provided for @bookingMaxGroup.
  ///
  /// In en, this message translates to:
  /// **'Max {count}'**
  String bookingMaxGroup(int count);

  /// No description provided for @bookingNotesLabel.
  ///
  /// In en, this message translates to:
  /// **'Notes for your guide (optional)'**
  String get bookingNotesLabel;

  /// No description provided for @bookingPickTimeForPrice.
  ///
  /// In en, this message translates to:
  /// **'Pick a start time to see the price.'**
  String get bookingPickTimeForPrice;

  /// No description provided for @bookingGettingPrice.
  ///
  /// In en, this message translates to:
  /// **'Getting price…'**
  String get bookingGettingPrice;

  /// No description provided for @bookingPrivateGroup.
  ///
  /// In en, this message translates to:
  /// **'Private group tour'**
  String get bookingPrivateGroup;

  /// No description provided for @bookingTimeLabel.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get bookingTimeLabel;

  /// No description provided for @bookingLocalFallback.
  ///
  /// In en, this message translates to:
  /// **'local'**
  String get bookingLocalFallback;

  /// No description provided for @bookingTotal.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get bookingTotal;

  /// No description provided for @bookingPolicy.
  ///
  /// In en, this message translates to:
  /// **'Free cancellation up to 48 hours before. 50% refund between 24 and 48 hours. Your payment is held in escrow until the tour is completed.'**
  String get bookingPolicy;

  /// No description provided for @bookingProcessing.
  ///
  /// In en, this message translates to:
  /// **'Processing…'**
  String get bookingProcessing;

  /// No description provided for @bookingConfirmPay.
  ///
  /// In en, this message translates to:
  /// **'Confirm & pay'**
  String get bookingConfirmPay;

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'TourGuide'**
  String get appTitle;

  /// No description provided for @tabExplore.
  ///
  /// In en, this message translates to:
  /// **'Explore'**
  String get tabExplore;

  /// No description provided for @tabTrips.
  ///
  /// In en, this message translates to:
  /// **'Trips'**
  String get tabTrips;

  /// No description provided for @tabAssistant.
  ///
  /// In en, this message translates to:
  /// **'Assistant'**
  String get tabAssistant;

  /// No description provided for @tabAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get tabAccount;

  /// No description provided for @tabDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get tabDashboard;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @close.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get close;

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @somethingWentWrong.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get somethingWentWrong;

  /// No description provided for @errorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Cannot reach the server. Check your connection.'**
  String get errorNetwork;

  /// No description provided for @errorUploadFailed.
  ///
  /// In en, this message translates to:
  /// **'Upload failed. Check your connection and try again.'**
  String get errorUploadFailed;

  /// No description provided for @errorUploadRejected.
  ///
  /// In en, this message translates to:
  /// **'Upload was rejected ({status}). Please try again.'**
  String errorUploadRejected(int status);

  /// No description provided for @errorRequestFailed.
  ///
  /// In en, this message translates to:
  /// **'Request failed ({status})'**
  String errorRequestFailed(int status);

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @languageSystem.
  ///
  /// In en, this message translates to:
  /// **'Device language'**
  String get languageSystem;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageArabic.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get languageArabic;

  /// No description provided for @ratingNew.
  ///
  /// In en, this message translates to:
  /// **'New'**
  String get ratingNew;

  /// No description provided for @bookingStatusPendingPayment.
  ///
  /// In en, this message translates to:
  /// **'Awaiting payment'**
  String get bookingStatusPendingPayment;

  /// No description provided for @bookingStatusConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Confirmed'**
  String get bookingStatusConfirmed;

  /// No description provided for @bookingStatusInProgress.
  ///
  /// In en, this message translates to:
  /// **'Live now'**
  String get bookingStatusInProgress;

  /// No description provided for @bookingStatusCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get bookingStatusCompleted;

  /// No description provided for @bookingStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get bookingStatusCancelled;

  /// No description provided for @categoryHeritage.
  ///
  /// In en, this message translates to:
  /// **'Heritage'**
  String get categoryHeritage;

  /// No description provided for @categoryMuseum.
  ///
  /// In en, this message translates to:
  /// **'Museum'**
  String get categoryMuseum;

  /// No description provided for @categoryNature.
  ///
  /// In en, this message translates to:
  /// **'Nature'**
  String get categoryNature;

  /// No description provided for @categoryReligious.
  ///
  /// In en, this message translates to:
  /// **'Religious'**
  String get categoryReligious;

  /// No description provided for @categoryCity.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get categoryCity;

  /// No description provided for @categoryAdventure.
  ///
  /// In en, this message translates to:
  /// **'Adventure'**
  String get categoryAdventure;

  /// No description provided for @categoryFood.
  ///
  /// In en, this message translates to:
  /// **'Food'**
  String get categoryFood;

  /// No description provided for @escrowPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get escrowPending;

  /// No description provided for @escrowHeld.
  ///
  /// In en, this message translates to:
  /// **'Held in escrow'**
  String get escrowHeld;

  /// No description provided for @escrowSettling.
  ///
  /// In en, this message translates to:
  /// **'Settling'**
  String get escrowSettling;

  /// No description provided for @escrowReleased.
  ///
  /// In en, this message translates to:
  /// **'Released to guide'**
  String get escrowReleased;

  /// No description provided for @escrowRefunded.
  ///
  /// In en, this message translates to:
  /// **'Refunded'**
  String get escrowRefunded;

  /// No description provided for @escrowPartiallyRefunded.
  ///
  /// In en, this message translates to:
  /// **'Partially refunded'**
  String get escrowPartiallyRefunded;

  /// No description provided for @escrowDisputed.
  ///
  /// In en, this message translates to:
  /// **'Disputed'**
  String get escrowDisputed;

  /// No description provided for @escrowFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get escrowFailed;

  /// No description provided for @liveBadge.
  ///
  /// In en, this message translates to:
  /// **'LIVE'**
  String get liveBadge;

  /// No description provided for @dashboardGreeting.
  ///
  /// In en, this message translates to:
  /// **'Hi {name}'**
  String dashboardGreeting(String name);

  /// No description provided for @dashboardRefresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get dashboardRefresh;

  /// No description provided for @dashboardRating.
  ///
  /// In en, this message translates to:
  /// **'Rating'**
  String get dashboardRating;

  /// No description provided for @dashboardReviews.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0{No reviews} =1{1 review} other{{count} reviews}}'**
  String dashboardReviews(int count);

  /// No description provided for @dashboardCompleted.
  ///
  /// In en, this message translates to:
  /// **'Completed'**
  String get dashboardCompleted;

  /// No description provided for @dashboardToursUnit.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{tour} other{tours}}'**
  String dashboardToursUnit(int count);

  /// No description provided for @dashboardUpcoming.
  ///
  /// In en, this message translates to:
  /// **'Upcoming'**
  String get dashboardUpcoming;

  /// No description provided for @dashboardBooked.
  ///
  /// In en, this message translates to:
  /// **'booked'**
  String get dashboardBooked;

  /// No description provided for @dashboardPaidOut.
  ///
  /// In en, this message translates to:
  /// **'Paid out'**
  String get dashboardPaidOut;

  /// No description provided for @dashboardInEscrow.
  ///
  /// In en, this message translates to:
  /// **'In escrow'**
  String get dashboardInEscrow;

  /// No description provided for @dashboardEscrowInfo.
  ///
  /// In en, this message translates to:
  /// **'Escrow is released 7 days after a completed tour if there is no dispute.'**
  String get dashboardEscrowInfo;

  /// No description provided for @dashboardAvailabilitySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Weekly hours and days off'**
  String get dashboardAvailabilitySubtitle;

  /// No description provided for @dashboardUpcomingTours.
  ///
  /// In en, this message translates to:
  /// **'Upcoming tours'**
  String get dashboardUpcomingTours;

  /// No description provided for @dashboardNoUpcomingTours.
  ///
  /// In en, this message translates to:
  /// **'No upcoming tours.'**
  String get dashboardNoUpcomingTours;

  /// No description provided for @dashboardGuests.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 guest} other{{count} guests}}'**
  String dashboardGuests(int count);

  /// No description provided for @dashboardPayout.
  ///
  /// In en, this message translates to:
  /// **'{amount} payout'**
  String dashboardPayout(String amount);

  /// No description provided for @dashboardVerifiedTitle.
  ///
  /// In en, this message translates to:
  /// **'Licensed & verified'**
  String get dashboardVerifiedTitle;

  /// No description provided for @dashboardVerifiedBody.
  ///
  /// In en, this message translates to:
  /// **'You appear in search and can receive bookings.'**
  String get dashboardVerifiedBody;

  /// No description provided for @dashboardPendingTitle.
  ///
  /// In en, this message translates to:
  /// **'Verification in progress'**
  String get dashboardPendingTitle;

  /// No description provided for @dashboardPendingBody.
  ///
  /// In en, this message translates to:
  /// **'An admin is reviewing your license. This usually takes 1–2 business days.'**
  String get dashboardPendingBody;

  /// No description provided for @dashboardRejectedTitle.
  ///
  /// In en, this message translates to:
  /// **'Verification rejected'**
  String get dashboardRejectedTitle;

  /// No description provided for @dashboardRejectedBody.
  ///
  /// In en, this message translates to:
  /// **'Please review and resubmit your license.'**
  String get dashboardRejectedBody;

  /// No description provided for @dashboardSuspendedTitle.
  ///
  /// In en, this message translates to:
  /// **'Account suspended'**
  String get dashboardSuspendedTitle;

  /// No description provided for @dashboardSuspendedBody.
  ///
  /// In en, this message translates to:
  /// **'Contact support.'**
  String get dashboardSuspendedBody;

  /// No description provided for @dashboardDraftTitle.
  ///
  /// In en, this message translates to:
  /// **'Submit your license'**
  String get dashboardDraftTitle;

  /// No description provided for @dashboardDraftBody.
  ///
  /// In en, this message translates to:
  /// **'Add your tourism license to get verified and start receiving bookings.'**
  String get dashboardDraftBody;

  /// No description provided for @dashboardResubmitLicense.
  ///
  /// In en, this message translates to:
  /// **'Resubmit license'**
  String get dashboardResubmitLicense;

  /// No description provided for @dashboardSubmitLicense.
  ///
  /// In en, this message translates to:
  /// **'Submit license'**
  String get dashboardSubmitLicense;

  /// No description provided for @exploreTitle.
  ///
  /// In en, this message translates to:
  /// **'Explore'**
  String get exploreTitle;

  /// No description provided for @exploreGreeting.
  ///
  /// In en, this message translates to:
  /// **'Hi {name} 👋'**
  String exploreGreeting(String name);

  /// No description provided for @exploreSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search sites, guides, cities'**
  String get exploreSearchHint;

  /// No description provided for @exploreTabPlaces.
  ///
  /// In en, this message translates to:
  /// **'Places'**
  String get exploreTabPlaces;

  /// No description provided for @exploreTabGuides.
  ///
  /// In en, this message translates to:
  /// **'Guides'**
  String get exploreTabGuides;

  /// No description provided for @exploreAnyCity.
  ///
  /// In en, this message translates to:
  /// **'Any city'**
  String get exploreAnyCity;

  /// No description provided for @exploreCityFallback.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get exploreCityFallback;

  /// No description provided for @exploreCityWithCountry.
  ///
  /// In en, this message translates to:
  /// **'{city}, {country}'**
  String exploreCityWithCountry(String city, String country);

  /// No description provided for @exploreAnyLanguage.
  ///
  /// In en, this message translates to:
  /// **'Any language'**
  String get exploreAnyLanguage;

  /// No description provided for @exploreLangEn.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get exploreLangEn;

  /// No description provided for @exploreLangAr.
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get exploreLangAr;

  /// No description provided for @exploreLangFr.
  ///
  /// In en, this message translates to:
  /// **'French'**
  String get exploreLangFr;

  /// No description provided for @exploreLangDe.
  ///
  /// In en, this message translates to:
  /// **'German'**
  String get exploreLangDe;

  /// No description provided for @exploreLangEs.
  ///
  /// In en, this message translates to:
  /// **'Spanish'**
  String get exploreLangEs;

  /// No description provided for @exploreLangIt.
  ///
  /// In en, this message translates to:
  /// **'Italian'**
  String get exploreLangIt;

  /// No description provided for @exploreLangUr.
  ///
  /// In en, this message translates to:
  /// **'Urdu'**
  String get exploreLangUr;

  /// No description provided for @exploreMinRating.
  ///
  /// In en, this message translates to:
  /// **'{rating}★+'**
  String exploreMinRating(String rating);

  /// No description provided for @exploreSortTopRated.
  ///
  /// In en, this message translates to:
  /// **'Top rated'**
  String get exploreSortTopRated;

  /// No description provided for @exploreSortLowestPrice.
  ///
  /// In en, this message translates to:
  /// **'Lowest price'**
  String get exploreSortLowestPrice;

  /// No description provided for @exploreSortMostExperienced.
  ///
  /// In en, this message translates to:
  /// **'Most experienced'**
  String get exploreSortMostExperienced;

  /// No description provided for @exploreNoPlaces.
  ///
  /// In en, this message translates to:
  /// **'No places match your filters.'**
  String get exploreNoPlaces;

  /// No description provided for @exploreNoGuides.
  ///
  /// In en, this message translates to:
  /// **'No licensed guides match your filters.'**
  String get exploreNoGuides;

  /// No description provided for @guideProfileTouristOnly.
  ///
  /// In en, this message translates to:
  /// **'Switch to a tourist account to book tours.'**
  String get guideProfileTouristOnly;

  /// No description provided for @guideProfileLicense.
  ///
  /// In en, this message translates to:
  /// **'License'**
  String get guideProfileLicense;

  /// No description provided for @guideProfileLanguages.
  ///
  /// In en, this message translates to:
  /// **'Languages'**
  String get guideProfileLanguages;

  /// No description provided for @guideProfileExperience.
  ///
  /// In en, this message translates to:
  /// **'Experience'**
  String get guideProfileExperience;

  /// No description provided for @guideProfileYears.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 year} other{{count} years}}'**
  String guideProfileYears(int count);

  /// No description provided for @guideProfileCities.
  ///
  /// In en, this message translates to:
  /// **'Cities'**
  String get guideProfileCities;

  /// No description provided for @guideProfileListSeparator.
  ///
  /// In en, this message translates to:
  /// **', '**
  String get guideProfileListSeparator;

  /// No description provided for @guideProfileTours.
  ///
  /// In en, this message translates to:
  /// **'Tours'**
  String get guideProfileTours;

  /// No description provided for @guideProfileNoTours.
  ///
  /// In en, this message translates to:
  /// **'No tours available right now.'**
  String get guideProfileNoTours;

  /// No description provided for @guideProfileReviews.
  ///
  /// In en, this message translates to:
  /// **'Reviews'**
  String get guideProfileReviews;

  /// No description provided for @guideProfileNoReviews.
  ///
  /// In en, this message translates to:
  /// **'No reviews yet.'**
  String get guideProfileNoReviews;

  /// No description provided for @guideProfileUpTo.
  ///
  /// In en, this message translates to:
  /// **'Up to {count}'**
  String guideProfileUpTo(int count);

  /// No description provided for @guideProfileVisits.
  ///
  /// In en, this message translates to:
  /// **'Visits: {sites}'**
  String guideProfileVisits(String sites);

  /// No description provided for @guideProfilePerPerson.
  ///
  /// In en, this message translates to:
  /// **' / person'**
  String get guideProfilePerPerson;

  /// No description provided for @guideProfilePerGroup.
  ///
  /// In en, this message translates to:
  /// **' / group'**
  String get guideProfilePerGroup;

  /// No description provided for @guideProfileBook.
  ///
  /// In en, this message translates to:
  /// **'Book'**
  String get guideProfileBook;

  /// No description provided for @licenseTitle.
  ///
  /// In en, this message translates to:
  /// **'Tourism license'**
  String get licenseTitle;

  /// No description provided for @licenseIntro.
  ///
  /// In en, this message translates to:
  /// **'We verify every guide against the issuing authority before they can take bookings.'**
  String get licenseIntro;

  /// No description provided for @licenseCountryLabel.
  ///
  /// In en, this message translates to:
  /// **'Issuing country'**
  String get licenseCountryLabel;

  /// No description provided for @licenseCountryRequired.
  ///
  /// In en, this message translates to:
  /// **'Select a country'**
  String get licenseCountryRequired;

  /// No description provided for @licenseNumberLabel.
  ///
  /// In en, this message translates to:
  /// **'License number'**
  String get licenseNumberLabel;

  /// No description provided for @licenseNumberRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your license number'**
  String get licenseNumberRequired;

  /// No description provided for @licenseExpiryLabel.
  ///
  /// In en, this message translates to:
  /// **'Expiry date'**
  String get licenseExpiryLabel;

  /// No description provided for @licenseExpiryRequired.
  ///
  /// In en, this message translates to:
  /// **'Pick the expiry date'**
  String get licenseExpiryRequired;

  /// No description provided for @licenseSelect.
  ///
  /// In en, this message translates to:
  /// **'Select'**
  String get licenseSelect;

  /// No description provided for @licensePhotoTitle.
  ///
  /// In en, this message translates to:
  /// **'Photo of your license'**
  String get licensePhotoTitle;

  /// No description provided for @licenseUploaded.
  ///
  /// In en, this message translates to:
  /// **'Uploaded'**
  String get licenseUploaded;

  /// No description provided for @licenseTakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take photo'**
  String get licenseTakePhoto;

  /// No description provided for @licenseChoosePhoto.
  ///
  /// In en, this message translates to:
  /// **'Choose'**
  String get licenseChoosePhoto;

  /// No description provided for @licensePrivacyNote.
  ///
  /// In en, this message translates to:
  /// **'Stored privately; only our verification team can see it.'**
  String get licensePrivacyNote;

  /// No description provided for @licenseSubmitting.
  ///
  /// In en, this message translates to:
  /// **'Submitting…'**
  String get licenseSubmitting;

  /// No description provided for @licenseSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit for verification'**
  String get licenseSubmit;

  /// No description provided for @licensePhotoRequired.
  ///
  /// In en, this message translates to:
  /// **'Add a photo of your license first.'**
  String get licensePhotoRequired;

  /// No description provided for @licenseSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Submitted for verification'**
  String get licenseSubmitted;

  /// No description provided for @liveTitleLive.
  ///
  /// In en, this message translates to:
  /// **'Live tour'**
  String get liveTitleLive;

  /// No description provided for @liveTitleDetails.
  ///
  /// In en, this message translates to:
  /// **'Tour details'**
  String get liveTitleDetails;

  /// No description provided for @liveTourFallback.
  ///
  /// In en, this message translates to:
  /// **'Tour'**
  String get liveTourFallback;

  /// No description provided for @liveTravellers.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 traveller} other{{count} travellers}}'**
  String liveTravellers(int count);

  /// No description provided for @liveScheduleLine.
  ///
  /// In en, this message translates to:
  /// **'{start} – {end} · {travellers}'**
  String liveScheduleLine(String start, String end, String travellers);

  /// No description provided for @liveYourTraveller.
  ///
  /// In en, this message translates to:
  /// **'Your traveller · {phone}'**
  String liveYourTraveller(String phone);

  /// No description provided for @liveYourGuide.
  ///
  /// In en, this message translates to:
  /// **'Your licensed guide · {phone}'**
  String liveYourGuide(String phone);

  /// No description provided for @liveStops.
  ///
  /// In en, this message translates to:
  /// **'Stops'**
  String get liveStops;

  /// No description provided for @liveNotes.
  ///
  /// In en, this message translates to:
  /// **'Notes: {notes}'**
  String liveNotes(String notes);

  /// No description provided for @liveStartTour.
  ///
  /// In en, this message translates to:
  /// **'Start tour'**
  String get liveStartTour;

  /// No description provided for @liveTourStarted.
  ///
  /// In en, this message translates to:
  /// **'Tour started'**
  String get liveTourStarted;

  /// No description provided for @liveCompleteTour.
  ///
  /// In en, this message translates to:
  /// **'Complete tour'**
  String get liveCompleteTour;

  /// No description provided for @liveTourCompleted.
  ///
  /// In en, this message translates to:
  /// **'Tour completed — payout scheduled'**
  String get liveTourCompleted;

  /// No description provided for @liveSosHint.
  ///
  /// In en, this message translates to:
  /// **'Press and hold for 1 second to alert our 24/7 safety team.'**
  String get liveSosHint;

  /// No description provided for @livePaymentStatus.
  ///
  /// In en, this message translates to:
  /// **'Payment: {status}'**
  String livePaymentStatus(String status);

  /// No description provided for @liveSosButton.
  ///
  /// In en, this message translates to:
  /// **'SOS'**
  String get liveSosButton;

  /// No description provided for @liveSosSemantics.
  ///
  /// In en, this message translates to:
  /// **'SOS emergency alert. Press and hold.'**
  String get liveSosSemantics;

  /// No description provided for @liveSosDialogTitle.
  ///
  /// In en, this message translates to:
  /// **'Send SOS alert?'**
  String get liveSosDialogTitle;

  /// No description provided for @liveSosDialogBody.
  ///
  /// In en, this message translates to:
  /// **'We will share your booking and location with our safety team.'**
  String get liveSosDialogBody;

  /// No description provided for @liveSosMessageLabel.
  ///
  /// In en, this message translates to:
  /// **'What\'s happening? (optional)'**
  String get liveSosMessageLabel;

  /// No description provided for @liveSosSend.
  ///
  /// In en, this message translates to:
  /// **'Send SOS'**
  String get liveSosSend;

  /// No description provided for @liveSosSentTitle.
  ///
  /// In en, this message translates to:
  /// **'Help is on the way'**
  String get liveSosSentTitle;

  /// No description provided for @liveSosSentBody.
  ///
  /// In en, this message translates to:
  /// **'Our safety team has been alerted with your booking details and will contact you right away.\n\nIf you are in immediate danger, call local emergency services.'**
  String get liveSosSentBody;

  /// No description provided for @notifTitle.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifTitle;

  /// No description provided for @notifOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get notifOpen;

  /// No description provided for @notifMarkAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all read'**
  String get notifMarkAllRead;

  /// No description provided for @notifEmpty.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet.'**
  String get notifEmpty;

  /// No description provided for @notifAgoNow.
  ///
  /// In en, this message translates to:
  /// **'now'**
  String get notifAgoNow;

  /// No description provided for @notifAgoMinutes.
  ///
  /// In en, this message translates to:
  /// **'{count}m'**
  String notifAgoMinutes(int count);

  /// No description provided for @notifAgoHours.
  ///
  /// In en, this message translates to:
  /// **'{count}h'**
  String notifAgoHours(int count);

  /// No description provided for @notifAgoDays.
  ///
  /// In en, this message translates to:
  /// **'{count}d'**
  String notifAgoDays(int count);

  /// No description provided for @paymentPayAmount.
  ///
  /// In en, this message translates to:
  /// **'Pay {amount}'**
  String paymentPayAmount(String amount);

  /// No description provided for @paymentEscrowNote.
  ///
  /// In en, this message translates to:
  /// **'Held securely in escrow and released to your guide only after the tour.'**
  String get paymentEscrowNote;

  /// No description provided for @paymentFailedTryAnother.
  ///
  /// In en, this message translates to:
  /// **'Payment failed. Try another card.'**
  String get paymentFailedTryAnother;

  /// No description provided for @paymentNotCompleted.
  ///
  /// In en, this message translates to:
  /// **'Payment could not be completed.'**
  String get paymentNotCompleted;

  /// No description provided for @paymentTestModeNote.
  ///
  /// In en, this message translates to:
  /// **'Test mode — no real charge. Funds are held in escrow until your tour is completed.'**
  String get paymentTestModeNote;

  /// No description provided for @paymentTestCardSucceeds.
  ///
  /// In en, this message translates to:
  /// **'Test card — succeeds'**
  String get paymentTestCardSucceeds;

  /// No description provided for @paymentTestCardDeclined.
  ///
  /// In en, this message translates to:
  /// **'Test card — declined'**
  String get paymentTestCardDeclined;

  /// No description provided for @reviewRatingPoor.
  ///
  /// In en, this message translates to:
  /// **'Poor'**
  String get reviewRatingPoor;

  /// No description provided for @reviewRatingFair.
  ///
  /// In en, this message translates to:
  /// **'Fair'**
  String get reviewRatingFair;

  /// No description provided for @reviewRatingGood.
  ///
  /// In en, this message translates to:
  /// **'Good'**
  String get reviewRatingGood;

  /// No description provided for @reviewRatingGreat.
  ///
  /// In en, this message translates to:
  /// **'Great'**
  String get reviewRatingGreat;

  /// No description provided for @reviewRatingOutstanding.
  ///
  /// In en, this message translates to:
  /// **'Outstanding'**
  String get reviewRatingOutstanding;

  /// No description provided for @reviewThanks.
  ///
  /// In en, this message translates to:
  /// **'Thanks for your review!'**
  String get reviewThanks;

  /// No description provided for @reviewTitle.
  ///
  /// In en, this message translates to:
  /// **'Review your tour'**
  String get reviewTitle;

  /// No description provided for @reviewPrompt.
  ///
  /// In en, this message translates to:
  /// **'How was {tour} with {guide}?'**
  String reviewPrompt(String tour, String guide);

  /// No description provided for @reviewYourTour.
  ///
  /// In en, this message translates to:
  /// **'your tour'**
  String get reviewYourTour;

  /// No description provided for @reviewYourGuide.
  ///
  /// In en, this message translates to:
  /// **'your guide'**
  String get reviewYourGuide;

  /// No description provided for @reviewCommentLabel.
  ///
  /// In en, this message translates to:
  /// **'Tell other travellers about it (optional)'**
  String get reviewCommentLabel;

  /// No description provided for @reviewSubmitting.
  ///
  /// In en, this message translates to:
  /// **'Submitting…'**
  String get reviewSubmitting;

  /// No description provided for @reviewSubmit.
  ///
  /// In en, this message translates to:
  /// **'Submit review'**
  String get reviewSubmit;

  /// No description provided for @siteGuidesCityWithCountry.
  ///
  /// In en, this message translates to:
  /// **'{city}, {country}'**
  String siteGuidesCityWithCountry(String city, String country);

  /// No description provided for @siteGuidesLicenseRequired.
  ///
  /// In en, this message translates to:
  /// **'Licensed guide required'**
  String get siteGuidesLicenseRequired;

  /// No description provided for @siteGuidesLicenseRequiredBody.
  ///
  /// In en, this message translates to:
  /// **'Every guide below holds a verified tourism license.'**
  String get siteGuidesLicenseRequiredBody;

  /// No description provided for @siteGuidesHeading.
  ///
  /// In en, this message translates to:
  /// **'Guides for this place'**
  String get siteGuidesHeading;

  /// No description provided for @siteGuidesEmpty.
  ///
  /// In en, this message translates to:
  /// **'No guides cover this place yet.'**
  String get siteGuidesEmpty;

  /// No description provided for @tripsTitle.
  ///
  /// In en, this message translates to:
  /// **'My trips'**
  String get tripsTitle;

  /// No description provided for @tripsRefresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get tripsRefresh;

  /// No description provided for @tripsSignInPrompt.
  ///
  /// In en, this message translates to:
  /// **'Sign in to see your bookings.'**
  String get tripsSignInPrompt;

  /// No description provided for @tripsSignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get tripsSignIn;

  /// No description provided for @tripsEmpty.
  ///
  /// In en, this message translates to:
  /// **'No trips yet. Find a licensed guide in Explore.'**
  String get tripsEmpty;

  /// No description provided for @tripsSectionLive.
  ///
  /// In en, this message translates to:
  /// **'Live now'**
  String get tripsSectionLive;

  /// No description provided for @tripsSectionUpcoming.
  ///
  /// In en, this message translates to:
  /// **'Upcoming'**
  String get tripsSectionUpcoming;

  /// No description provided for @tripsSectionPast.
  ///
  /// In en, this message translates to:
  /// **'Past'**
  String get tripsSectionPast;

  /// No description provided for @tripsTourFallback.
  ///
  /// In en, this message translates to:
  /// **'Tour'**
  String get tripsTourFallback;

  /// No description provided for @tripsTravellers.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 traveller} other{{count} travellers}}'**
  String tripsTravellers(int count);

  /// No description provided for @tripsScheduleLine.
  ///
  /// In en, this message translates to:
  /// **'{date} · {travellers}'**
  String tripsScheduleLine(String date, String travellers);

  /// No description provided for @tripsGuideLine.
  ///
  /// In en, this message translates to:
  /// **'Guide: {name} · {amount}'**
  String tripsGuideLine(String name, String amount);

  /// No description provided for @tripsOpenLiveTour.
  ///
  /// In en, this message translates to:
  /// **'Open live tour'**
  String get tripsOpenLiveTour;

  /// No description provided for @tripsDetailsSafety.
  ///
  /// In en, this message translates to:
  /// **'Details & safety'**
  String get tripsDetailsSafety;

  /// No description provided for @tripsPaymentDescription.
  ///
  /// In en, this message translates to:
  /// **'Tour booking'**
  String get tripsPaymentDescription;

  /// No description provided for @tripsPayNow.
  ///
  /// In en, this message translates to:
  /// **'Pay now'**
  String get tripsPayNow;

  /// No description provided for @tripsLeaveReview.
  ///
  /// In en, this message translates to:
  /// **'Leave a review'**
  String get tripsLeaveReview;

  /// No description provided for @tripsRefundNoPayment.
  ///
  /// In en, this message translates to:
  /// **'No payment has been taken.'**
  String get tripsRefundNoPayment;

  /// No description provided for @tripsRefundFull.
  ///
  /// In en, this message translates to:
  /// **'You will get a full refund.'**
  String get tripsRefundFull;

  /// No description provided for @tripsRefundHalf.
  ///
  /// In en, this message translates to:
  /// **'You will get a 50% refund.'**
  String get tripsRefundHalf;

  /// No description provided for @tripsRefundNone.
  ///
  /// In en, this message translates to:
  /// **'Cancelling within 24 hours is not refundable.'**
  String get tripsRefundNone;

  /// No description provided for @tripsCancelTitle.
  ///
  /// In en, this message translates to:
  /// **'Cancel booking?'**
  String get tripsCancelTitle;

  /// No description provided for @tripsKeep.
  ///
  /// In en, this message translates to:
  /// **'Keep'**
  String get tripsKeep;

  /// No description provided for @tripsCancelConfirm.
  ///
  /// In en, this message translates to:
  /// **'Cancel booking'**
  String get tripsCancelConfirm;

  /// No description provided for @tripsCancelled.
  ///
  /// In en, this message translates to:
  /// **'Booking cancelled. Refund: {percent}%'**
  String tripsCancelled(int percent);

  /// No description provided for @widgetLicensed.
  ///
  /// In en, this message translates to:
  /// **'Licensed'**
  String get widgetLicensed;

  /// No description provided for @widgetFromPrice.
  ///
  /// In en, this message translates to:
  /// **'from'**
  String get widgetFromPrice;

  /// No description provided for @widgetDistanceKm.
  ///
  /// In en, this message translates to:
  /// **'{distance} km'**
  String widgetDistanceKm(String distance);

  /// No description provided for @widgetLicensedGuideRequired.
  ///
  /// In en, this message translates to:
  /// **'A licensed guide is required here'**
  String get widgetLicensedGuideRequired;

  /// No description provided for @toursTitle.
  ///
  /// In en, this message translates to:
  /// **'My tours'**
  String get toursTitle;

  /// No description provided for @toursDashboardSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Create and edit the tours you offer'**
  String get toursDashboardSubtitle;

  /// No description provided for @toursEmpty.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t created any tours yet. Travellers can book you once you publish a tour.'**
  String get toursEmpty;

  /// No description provided for @toursCreateFirst.
  ///
  /// In en, this message translates to:
  /// **'Create your first tour'**
  String get toursCreateFirst;

  /// No description provided for @toursAdd.
  ///
  /// In en, this message translates to:
  /// **'New tour'**
  String get toursAdd;

  /// No description provided for @toursActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get toursActive;

  /// No description provided for @toursPaused.
  ///
  /// In en, this message translates to:
  /// **'Paused'**
  String get toursPaused;

  /// No description provided for @toursActiveToggle.
  ///
  /// In en, this message translates to:
  /// **'Visible to travellers'**
  String get toursActiveToggle;

  /// No description provided for @toursNowActive.
  ///
  /// In en, this message translates to:
  /// **'Tour is visible to travellers again.'**
  String get toursNowActive;

  /// No description provided for @toursNowPaused.
  ///
  /// In en, this message translates to:
  /// **'Tour paused. Travellers can\'t book it until you turn it back on.'**
  String get toursNowPaused;

  /// No description provided for @toursPricePerPerson.
  ///
  /// In en, this message translates to:
  /// **'{price} per person'**
  String toursPricePerPerson(String price);

  /// No description provided for @toursPricePerGroup.
  ///
  /// In en, this message translates to:
  /// **'{price} per group'**
  String toursPricePerGroup(String price);

  /// No description provided for @toursUpTo.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{Up to 1 person} other{Up to {count} people}}'**
  String toursUpTo(int count);

  /// No description provided for @toursNewTitle.
  ///
  /// In en, this message translates to:
  /// **'New tour'**
  String get toursNewTitle;

  /// No description provided for @toursEditTitle.
  ///
  /// In en, this message translates to:
  /// **'Edit tour'**
  String get toursEditTitle;

  /// No description provided for @toursSectionEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get toursSectionEnglish;

  /// No description provided for @toursSectionArabic.
  ///
  /// In en, this message translates to:
  /// **'Arabic'**
  String get toursSectionArabic;

  /// No description provided for @toursArabicHint.
  ///
  /// In en, this message translates to:
  /// **'Optional. Shown to travellers who use the app in Arabic.'**
  String get toursArabicHint;

  /// No description provided for @toursTitleEnLabel.
  ///
  /// In en, this message translates to:
  /// **'Tour title'**
  String get toursTitleEnLabel;

  /// No description provided for @toursDescriptionEnLabel.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get toursDescriptionEnLabel;

  /// No description provided for @toursTitleArLabel.
  ///
  /// In en, this message translates to:
  /// **'Tour title in Arabic'**
  String get toursTitleArLabel;

  /// No description provided for @toursDescriptionArLabel.
  ///
  /// In en, this message translates to:
  /// **'Description in Arabic'**
  String get toursDescriptionArLabel;

  /// No description provided for @toursDescriptionHint.
  ///
  /// In en, this message translates to:
  /// **'What travellers will see and do'**
  String get toursDescriptionHint;

  /// No description provided for @toursTitleRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter a title of at least 3 characters'**
  String get toursTitleRequired;

  /// No description provided for @toursTitleTooShort.
  ///
  /// In en, this message translates to:
  /// **'Use at least 3 characters or leave it empty'**
  String get toursTitleTooShort;

  /// No description provided for @toursSectionDetails.
  ///
  /// In en, this message translates to:
  /// **'Tour details'**
  String get toursSectionDetails;

  /// No description provided for @toursCityLabel.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get toursCityLabel;

  /// No description provided for @toursCityRequired.
  ///
  /// In en, this message translates to:
  /// **'Choose a city'**
  String get toursCityRequired;

  /// No description provided for @toursNoCities.
  ///
  /// In en, this message translates to:
  /// **'Add the cities you work in to your guide profile, then come back to create a tour there.'**
  String get toursNoCities;

  /// No description provided for @toursSitesLabel.
  ///
  /// In en, this message translates to:
  /// **'Sites on this tour'**
  String get toursSitesLabel;

  /// No description provided for @toursSitesPickCity.
  ///
  /// In en, this message translates to:
  /// **'Choose a city to see its sites.'**
  String get toursSitesPickCity;

  /// No description provided for @toursSitesEmpty.
  ///
  /// In en, this message translates to:
  /// **'No sites are listed for this city yet.'**
  String get toursSitesEmpty;

  /// No description provided for @toursDurationLabel.
  ///
  /// In en, this message translates to:
  /// **'Duration'**
  String get toursDurationLabel;

  /// No description provided for @toursDecrease.
  ///
  /// In en, this message translates to:
  /// **'Decrease'**
  String get toursDecrease;

  /// No description provided for @toursIncrease.
  ///
  /// In en, this message translates to:
  /// **'Increase'**
  String get toursIncrease;

  /// No description provided for @toursPricingLabel.
  ///
  /// In en, this message translates to:
  /// **'Pricing'**
  String get toursPricingLabel;

  /// No description provided for @toursPricingPerGroup.
  ///
  /// In en, this message translates to:
  /// **'Per group'**
  String get toursPricingPerGroup;

  /// No description provided for @toursPricingPerPerson.
  ///
  /// In en, this message translates to:
  /// **'Per person'**
  String get toursPricingPerPerson;

  /// No description provided for @toursPriceLabel.
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get toursPriceLabel;

  /// No description provided for @toursPriceHelperPerGroup.
  ///
  /// In en, this message translates to:
  /// **'One price for the whole group'**
  String get toursPriceHelperPerGroup;

  /// No description provided for @toursPriceHelperPerPerson.
  ///
  /// In en, this message translates to:
  /// **'Charged for each traveller'**
  String get toursPriceHelperPerPerson;

  /// No description provided for @toursPriceRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter a price'**
  String get toursPriceRequired;

  /// No description provided for @toursPriceInvalid.
  ///
  /// In en, this message translates to:
  /// **'{decimals, plural, =0{Enter a whole number} =1{Enter a price with at most 1 decimal place} other{Enter a price with at most {decimals} decimal places}}'**
  String toursPriceInvalid(int decimals);

  /// No description provided for @toursPriceTooHigh.
  ///
  /// In en, this message translates to:
  /// **'The price must be at most {max}'**
  String toursPriceTooHigh(String max);

  /// No description provided for @toursGroupSizeLabel.
  ///
  /// In en, this message translates to:
  /// **'Maximum group size'**
  String get toursGroupSizeLabel;

  /// No description provided for @toursPeople.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 person} other{{count} people}}'**
  String toursPeople(int count);

  /// No description provided for @toursLanguagesLabel.
  ///
  /// In en, this message translates to:
  /// **'Languages you guide this tour in'**
  String get toursLanguagesLabel;

  /// No description provided for @toursLanguagesRequired.
  ///
  /// In en, this message translates to:
  /// **'Choose at least one language'**
  String get toursLanguagesRequired;

  /// No description provided for @toursLangZh.
  ///
  /// In en, this message translates to:
  /// **'Chinese'**
  String get toursLangZh;

  /// No description provided for @toursLangRu.
  ///
  /// In en, this message translates to:
  /// **'Russian'**
  String get toursLangRu;

  /// No description provided for @toursLangHi.
  ///
  /// In en, this message translates to:
  /// **'Hindi'**
  String get toursLangHi;

  /// No description provided for @toursLangTr.
  ///
  /// In en, this message translates to:
  /// **'Turkish'**
  String get toursLangTr;

  /// No description provided for @toursPhotosLabel.
  ///
  /// In en, this message translates to:
  /// **'Photos'**
  String get toursPhotosLabel;

  /// No description provided for @toursPhotosHint.
  ///
  /// In en, this message translates to:
  /// **'{max, plural, =1{Up to 1 photo.} other{Up to {max} photos.}} The first photo is the cover.'**
  String toursPhotosHint(int max);

  /// No description provided for @toursAddPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add photo'**
  String get toursAddPhoto;

  /// No description provided for @toursTakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take a photo'**
  String get toursTakePhoto;

  /// No description provided for @toursChoosePhoto.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get toursChoosePhoto;

  /// No description provided for @toursCover.
  ///
  /// In en, this message translates to:
  /// **'Cover'**
  String get toursCover;

  /// No description provided for @toursMakeCover.
  ///
  /// In en, this message translates to:
  /// **'Make cover'**
  String get toursMakeCover;

  /// No description provided for @toursRemovePhoto.
  ///
  /// In en, this message translates to:
  /// **'Remove photo'**
  String get toursRemovePhoto;

  /// No description provided for @toursPhotoTooLarge.
  ///
  /// In en, this message translates to:
  /// **'This photo is larger than 5 MB. Choose a smaller one.'**
  String get toursPhotoTooLarge;

  /// No description provided for @toursPhotoUploading.
  ///
  /// In en, this message translates to:
  /// **'Uploading photo…'**
  String get toursPhotoUploading;

  /// No description provided for @toursActiveHint.
  ///
  /// In en, this message translates to:
  /// **'Turn off to pause new bookings for this tour.'**
  String get toursActiveHint;

  /// No description provided for @toursCreate.
  ///
  /// In en, this message translates to:
  /// **'Create tour'**
  String get toursCreate;

  /// No description provided for @toursSave.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get toursSave;

  /// No description provided for @toursSaving.
  ///
  /// In en, this message translates to:
  /// **'Saving…'**
  String get toursSaving;

  /// No description provided for @toursCreated.
  ///
  /// In en, this message translates to:
  /// **'Tour created.'**
  String get toursCreated;

  /// No description provided for @toursSaved.
  ///
  /// In en, this message translates to:
  /// **'Tour updated.'**
  String get toursSaved;

  /// No description provided for @dashboardEarningsTile.
  ///
  /// In en, this message translates to:
  /// **'Earnings & payouts'**
  String get dashboardEarningsTile;

  /// No description provided for @dashboardEarningsTileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Balance, bank account and payout history'**
  String get dashboardEarningsTileSubtitle;

  /// No description provided for @earningsTitle.
  ///
  /// In en, this message translates to:
  /// **'Earnings & payouts'**
  String get earningsTitle;

  /// No description provided for @earningsOwedTitle.
  ///
  /// In en, this message translates to:
  /// **'Waiting to be paid out'**
  String get earningsOwedTitle;

  /// No description provided for @earningsOwedInfo.
  ///
  /// In en, this message translates to:
  /// **'Money released after your tours is sent to your bank account in the next payout.'**
  String get earningsOwedInfo;

  /// No description provided for @earningsOwedEmpty.
  ///
  /// In en, this message translates to:
  /// **'Nothing is waiting to be paid out right now.'**
  String get earningsOwedEmpty;

  /// No description provided for @earningsFromPayments.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{From 1 tour payment} other{From {count} tour payments}}'**
  String earningsFromPayments(int count);

  /// No description provided for @earningsAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Bank account for payouts'**
  String get earningsAccountTitle;

  /// No description provided for @earningsAccountMissing.
  ///
  /// In en, this message translates to:
  /// **'Add your bank account so we can send you your earnings.'**
  String get earningsAccountMissing;

  /// No description provided for @earningsAccountAdd.
  ///
  /// In en, this message translates to:
  /// **'Add bank account'**
  String get earningsAccountAdd;

  /// No description provided for @earningsAccountChange.
  ///
  /// In en, this message translates to:
  /// **'Change bank account'**
  String get earningsAccountChange;

  /// No description provided for @earningsAccountHolder.
  ///
  /// In en, this message translates to:
  /// **'Account holder'**
  String get earningsAccountHolder;

  /// No description provided for @earningsAccountIban.
  ///
  /// In en, this message translates to:
  /// **'IBAN'**
  String get earningsAccountIban;

  /// No description provided for @earningsAccountBank.
  ///
  /// In en, this message translates to:
  /// **'Bank'**
  String get earningsAccountBank;

  /// No description provided for @earningsHistoryTitle.
  ///
  /// In en, this message translates to:
  /// **'Payout history'**
  String get earningsHistoryTitle;

  /// No description provided for @earningsHistoryEmpty.
  ///
  /// In en, this message translates to:
  /// **'No payouts yet.'**
  String get earningsHistoryEmpty;

  /// No description provided for @earningsPaidOn.
  ///
  /// In en, this message translates to:
  /// **'Paid on {date}'**
  String earningsPaidOn(String date);

  /// No description provided for @earningsCreatedOn.
  ///
  /// In en, this message translates to:
  /// **'Started on {date}'**
  String earningsCreatedOn(String date);

  /// No description provided for @earningsPayoutTo.
  ///
  /// In en, this message translates to:
  /// **'To {iban}'**
  String earningsPayoutTo(String iban);

  /// No description provided for @earningsReference.
  ///
  /// In en, this message translates to:
  /// **'Reference: {reference}'**
  String earningsReference(String reference);

  /// No description provided for @payoutStatusPending.
  ///
  /// In en, this message translates to:
  /// **'Processing'**
  String get payoutStatusPending;

  /// No description provided for @payoutStatusPaid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get payoutStatusPaid;

  /// No description provided for @payoutStatusFailed.
  ///
  /// In en, this message translates to:
  /// **'Failed'**
  String get payoutStatusFailed;

  /// No description provided for @payoutAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Bank account'**
  String get payoutAccountTitle;

  /// No description provided for @payoutAccountIntro.
  ///
  /// In en, this message translates to:
  /// **'We send your earnings by bank transfer to this account. It must be in your name.'**
  String get payoutAccountIntro;

  /// No description provided for @payoutAccountSecurity.
  ///
  /// In en, this message translates to:
  /// **'Your bank details are stored encrypted. After saving, only the last 4 digits of the IBAN are shown.'**
  String get payoutAccountSecurity;

  /// No description provided for @payoutAccountCurrent.
  ///
  /// In en, this message translates to:
  /// **'Current account: {iban}. Enter the full IBAN again to change it.'**
  String payoutAccountCurrent(String iban);

  /// No description provided for @payoutHolderLabel.
  ///
  /// In en, this message translates to:
  /// **'Account holder name'**
  String get payoutHolderLabel;

  /// No description provided for @payoutHolderError.
  ///
  /// In en, this message translates to:
  /// **'Enter the name on the account (at least 3 characters)'**
  String get payoutHolderError;

  /// No description provided for @payoutIbanLabel.
  ///
  /// In en, this message translates to:
  /// **'IBAN'**
  String get payoutIbanLabel;

  /// No description provided for @payoutIbanRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your IBAN'**
  String get payoutIbanRequired;

  /// No description provided for @payoutIbanFormat.
  ///
  /// In en, this message translates to:
  /// **'An IBAN starts with a two-letter country code and two digits, e.g. SA03'**
  String get payoutIbanFormat;

  /// No description provided for @payoutIbanLength.
  ///
  /// In en, this message translates to:
  /// **'A {country} IBAN has {length} characters'**
  String payoutIbanLength(String country, int length);

  /// No description provided for @payoutIbanLengthGeneric.
  ///
  /// In en, this message translates to:
  /// **'An IBAN has between 15 and 34 characters'**
  String get payoutIbanLengthGeneric;

  /// No description provided for @payoutIbanChecksum.
  ///
  /// In en, this message translates to:
  /// **'This IBAN isn\'t valid. Check it for typos.'**
  String get payoutIbanChecksum;

  /// No description provided for @payoutBankLabel.
  ///
  /// In en, this message translates to:
  /// **'Bank name (optional)'**
  String get payoutBankLabel;

  /// No description provided for @payoutBankError.
  ///
  /// In en, this message translates to:
  /// **'Enter between 2 and 80 characters'**
  String get payoutBankError;

  /// No description provided for @payoutSave.
  ///
  /// In en, this message translates to:
  /// **'Save bank account'**
  String get payoutSave;

  /// No description provided for @payoutSaving.
  ///
  /// In en, this message translates to:
  /// **'Saving…'**
  String get payoutSaving;

  /// No description provided for @payoutSaved.
  ///
  /// In en, this message translates to:
  /// **'Bank account saved. For your security, payouts to new bank details start after 24 hours.'**
  String get payoutSaved;

  /// No description provided for @identityTitle.
  ///
  /// In en, this message translates to:
  /// **'Identity verification'**
  String get identityTitle;

  /// No description provided for @identityExplain.
  ///
  /// In en, this message translates to:
  /// **'Scan your ID document and take a selfie. It takes about 3 minutes and is required before your account can be approved.'**
  String get identityExplain;

  /// No description provided for @identityStatusNotStarted.
  ///
  /// In en, this message translates to:
  /// **'Not started'**
  String get identityStatusNotStarted;

  /// No description provided for @identityStatusPending.
  ///
  /// In en, this message translates to:
  /// **'In review'**
  String get identityStatusPending;

  /// No description provided for @identityStatusApproved.
  ///
  /// In en, this message translates to:
  /// **'Verified'**
  String get identityStatusApproved;

  /// No description provided for @identityStatusRetry.
  ///
  /// In en, this message translates to:
  /// **'Needs another try'**
  String get identityStatusRetry;

  /// No description provided for @identityStatusRejected.
  ///
  /// In en, this message translates to:
  /// **'Rejected'**
  String get identityStatusRejected;

  /// No description provided for @identityPendingBody.
  ///
  /// In en, this message translates to:
  /// **'We\'re checking your documents. This usually takes a few minutes.'**
  String get identityPendingBody;

  /// No description provided for @identityApprovedBody.
  ///
  /// In en, this message translates to:
  /// **'Your identity has been verified.'**
  String get identityApprovedBody;

  /// No description provided for @identityRetryBody.
  ///
  /// In en, this message translates to:
  /// **'The check couldn\'t be completed. Please try again.'**
  String get identityRetryBody;

  /// No description provided for @identityRejectedBody.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t verify your identity. Please contact support.'**
  String get identityRejectedBody;

  /// No description provided for @identityReviewerNote.
  ///
  /// In en, this message translates to:
  /// **'Note: {comment}'**
  String identityReviewerNote(String comment);

  /// No description provided for @identityStart.
  ///
  /// In en, this message translates to:
  /// **'Verify my identity'**
  String get identityStart;

  /// No description provided for @identityTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get identityTryAgain;

  /// No description provided for @identityStarting.
  ///
  /// In en, this message translates to:
  /// **'Opening…'**
  String get identityStarting;

  /// No description provided for @identityOpenFailed.
  ///
  /// In en, this message translates to:
  /// **'Couldn\'t open the verification page.'**
  String get identityOpenFailed;

  /// No description provided for @identityReturnHint.
  ///
  /// In en, this message translates to:
  /// **'Finish the steps in the browser, then come back here to see the result.'**
  String get identityReturnHint;

  /// No description provided for @payoutAccountHoldNote.
  ///
  /// In en, this message translates to:
  /// **'For your security, payouts to new bank details start after 24 hours, and we notify you by SMS whenever they change.'**
  String get payoutAccountHoldNote;

  /// No description provided for @earningsAccountHeld.
  ///
  /// In en, this message translates to:
  /// **'For your security, payouts to these details start after {date}.'**
  String earningsAccountHeld(String date);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
