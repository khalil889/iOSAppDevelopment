import { StorageProvider } from '../providers/storage/storage.interface';
import type { TourPackage } from './tour-package.entity';

export const PACKAGE_PHOTO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
export const PACKAGE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PACKAGE_MAX_PHOTOS = 6;
/** Photo links live longer than document links so lists can cache images. */
const PHOTO_URL_TTL_SECONDS = 6 * 3600;

export const packagePhotoPrefix = (guideId: string) => `packages/${guideId}/`;

/** Adds short-lived `photoUrls` (same order as `photoKeys`) to packages for display. */
export async function withPhotoUrls<T extends Pick<TourPackage, 'photoKeys'>>(
  storage: StorageProvider,
  pkgs: T[],
): Promise<Array<T & { photoUrls: string[] }>> {
  return Promise.all(
    pkgs.map(async (p) => ({
      ...p,
      photoUrls: await Promise.all((p.photoKeys ?? []).map((k) => storage.createDownloadUrl(k, PHOTO_URL_TTL_SECONDS))),
    })),
  );
}
