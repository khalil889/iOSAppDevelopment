export enum UserRole {
  TOURIST = 'TOURIST',
  GUIDE = 'GUIDE',
  ADMIN = 'ADMIN',
}

export enum GuideVerificationStatus {
  /** Guide account created but no license submitted yet. */
  DRAFT = 'DRAFT',
  /** License submitted, waiting in the admin verification queue. */
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum KycStatus {
  NOT_STARTED = 'NOT_STARTED',
  CLEAR = 'CLEAR',
  CONSIDER = 'CONSIDER',
  FAILED = 'FAILED',
}

export enum PricingType {
  PER_PERSON = 'PER_PERSON',
  PER_GROUP = 'PER_GROUP',
}

export enum BookingStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EscrowStatus {
  /** Payment intent created, funds not yet secured. */
  PENDING = 'PENDING',
  /** Funds captured from the tourist and held by the platform. */
  HELD = 'HELD',
  /** Funds paid out to the guide (minus platform fee). */
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  /** Frozen while a dispute is open. */
  DISPUTED = 'DISPUTED',
  FAILED = 'FAILED',
  /** Claimed by one settlement while the gateway is called (prevents double refunds). */
  SETTLING = 'SETTLING',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

export enum DisputeResolution {
  REFUND_TOURIST = 'REFUND_TOURIST',
  RELEASE_TO_GUIDE = 'RELEASE_TO_GUIDE',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
}

export enum SiteCategory {
  HERITAGE = 'HERITAGE',
  MUSEUM = 'MUSEUM',
  NATURE = 'NATURE',
  RELIGIOUS = 'RELIGIOUS',
  CITY = 'CITY',
  ADVENTURE = 'ADVENTURE',
  FOOD = 'FOOD',
}

export enum OtpPurpose {
  LOGIN = 'LOGIN',
  VERIFY_PHONE = 'VERIFY_PHONE',
}
