import { Guide } from './guide.entity';

/** Shows only the first 3 and last 2 characters of a license number. */
export function maskLicense(n: string | null): string | null {
  if (!n) return null;
  if (n.length <= 5) return '*'.repeat(n.length);
  return `${n.slice(0, 3)}${'*'.repeat(n.length - 5)}${n.slice(-2)}`;
}

/** Public-safe view of a guide (no contact details, documents or KYC data). */
export function presentGuide(g: Guide, extra: { fromPriceMinor?: number | null; currency?: string | null } = {}) {
  return {
    id: g.id,
    name: g.user?.fullName,
    avatarUrl: g.user?.avatarUrl ?? null,
    bio: g.bio,
    languages: g.languages,
    yearsOfExperience: g.yearsOfExperience,
    verified: g.verificationStatus === 'APPROVED',
    license: {
      number: maskLicense(g.licenseNumber),
      country: g.licenseCountry?.name ?? null,
      expiresAt: g.licenseExpiresAt,
    },
    ratingAvg: g.ratingAvg,
    ratingCount: g.ratingCount,
    cities: (g.cities ?? []).map((c) => ({ id: c.id, name: c.name, country: c.country?.name })),
    fromPriceMinor: extra.fromPriceMinor ?? null,
    currency: extra.currency ?? null,
  };
}

export type PublicGuide = ReturnType<typeof presentGuide>;
