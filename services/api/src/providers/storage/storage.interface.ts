/**
 * Private object storage for uploaded documents (guide license scans).
 * Uploads and downloads use short-lived signed URLs so file bytes never pass
 * through the API process in production.
 */
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface UploadRequest {
  key: string;
  contentType: string;
  sizeBytes: number;
}

export interface SignedUpload {
  uploadUrl: string;
  method: 'PUT';
  /** Headers the client must send with the upload, exactly as given. */
  headers: Record<string, string>;
  key: string;
  expiresAt: Date;
}

export interface StorageProvider {
  readonly name: string;
  createUpload(req: UploadRequest): Promise<SignedUpload>;
  createDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  /** Size in bytes if the object exists, otherwise null. */
  stat(key: string): Promise<{ sizeBytes: number; contentType?: string } | null>;
}

export const UPLOAD_TTL_SECONDS = 600;
export const DOWNLOAD_TTL_SECONDS = 300;
