import { HeadObjectCommand, GetObjectCommand, NotFound, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import {
  DOWNLOAD_TTL_SECONDS,
  SignedUpload,
  StorageProvider,
  UPLOAD_TTL_SECONDS,
  UploadRequest,
} from './storage.interface';

/**
 * Any S3-compatible store: AWS S3, Cloudflare R2 (S3_ENDPOINT=https://<acct>.r2.cloudflarestorage.com,
 * S3_REGION=auto), MinIO (S3_FORCE_PATH_STYLE=true). The bucket must be private.
 */
export class S3StorageProvider implements StorageProvider {
  readonly name = 's3';
  private readonly bucket: string;

  constructor(
    config: ConfigService,
    private readonly client?: S3Client,
  ) {
    const s3 = config.get<{
      bucket: string;
      region: string;
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle: boolean;
    }>('s3')!;
    const missing = [
      ['S3_BUCKET', s3.bucket],
      ['S3_ACCESS_KEY_ID', s3.accessKeyId],
      ['S3_SECRET_ACCESS_KEY', s3.secretAccessKey],
    ].filter(([, v]) => !v);
    if (missing.length) throw new Error(`STORAGE_PROVIDER=s3 requires ${missing.map(([k]) => k).join(', ')}`);
    this.bucket = s3.bucket;
    this.client ??= new S3Client({
      region: s3.region || 'auto',
      endpoint: s3.endpoint || undefined,
      forcePathStyle: s3.forcePathStyle,
      credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey },
    });
  }

  async createUpload(req: UploadRequest): Promise<SignedUpload> {
    // Content-Type and Content-Length are part of the signature, so the client
    // can't upload a different type or a bigger file with this URL.
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: req.key,
      ContentType: req.contentType,
      ContentLength: req.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(this.client!, command, {
      expiresIn: UPLOAD_TTL_SECONDS,
      signableHeaders: new Set(['content-type', 'content-length']),
    });
    return {
      uploadUrl,
      method: 'PUT',
      headers: { 'content-type': req.contentType },
      key: req.key,
      expiresAt: new Date(Date.now() + UPLOAD_TTL_SECONDS * 1000),
    };
  }

  createDownloadUrl(key: string, expiresInSeconds = DOWNLOAD_TTL_SECONDS): Promise<string> {
    return getSignedUrl(this.client!, new GetObjectCommand({ Bucket: this.bucket, Key: key }), { expiresIn: expiresInSeconds });
  }

  async stat(key: string) {
    try {
      const head = await this.client!.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { sizeBytes: head.ContentLength ?? 0, contentType: head.ContentType };
    } catch (e) {
      if (e instanceof NotFound || (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return null;
      throw e;
    }
  }
}
