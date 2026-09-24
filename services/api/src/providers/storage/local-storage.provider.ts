import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, join, resolve, sep } from 'path';
import {
  DOWNLOAD_TTL_SECONDS,
  SignedUpload,
  StorageProvider,
  UPLOAD_TTL_SECONDS,
  UploadRequest,
} from './storage.interface';

export interface LocalGrant {
  op: 'put' | 'get';
  key: string;
  contentType?: string;
  sizeBytes?: number;
  exp: number;
}

/**
 * Development storage on the API's disk (UPLOAD_DIR), with HMAC-signed URLs
 * served by LocalUploadsController so the app uses the same upload flow as S3.
 * Not for production: files live on one machine and pass through the API.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = 'local';
  readonly root: string;
  private readonly baseUrl: string;
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.root = resolve(config.get<string>('storage.uploadDir') ?? 'uploads');
    this.baseUrl = `${config.get<string>('publicApiUrl')}/api/uploads/local`;
    this.secret = `${config.get<string>('jwt.secret')}:local-storage`;
  }

  async createUpload(req: UploadRequest): Promise<SignedUpload> {
    const exp = Math.floor(Date.now() / 1000) + UPLOAD_TTL_SECONDS;
    const token = this.sign({ op: 'put', key: req.key, contentType: req.contentType, sizeBytes: req.sizeBytes, exp });
    return {
      uploadUrl: `${this.baseUrl}/${token}`,
      method: 'PUT',
      headers: { 'content-type': req.contentType },
      key: req.key,
      expiresAt: new Date(exp * 1000),
    };
  }

  async createDownloadUrl(key: string, expiresInSeconds = DOWNLOAD_TTL_SECONDS): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `${this.baseUrl}/${this.sign({ op: 'get', key, exp })}`;
  }

  async stat(key: string) {
    try {
      const s = await fs.stat(this.pathFor(key));
      return s.isFile() ? { sizeBytes: s.size } : null;
    } catch {
      return null;
    }
  }

  /** Resolves a key inside the upload root, refusing path traversal. */
  pathFor(key: string): string {
    const p = resolve(join(this.root, key));
    if (!p.startsWith(this.root + sep)) throw new Error('Invalid storage key');
    return p;
  }

  async ensureDir(key: string) {
    await fs.mkdir(dirname(this.pathFor(key)), { recursive: true });
  }

  sign(grant: LocalGrant): string {
    const body = Buffer.from(JSON.stringify(grant)).toString('base64url');
    return `${body}.${this.mac(body)}`;
  }

  /** Returns the grant if the token is authentic and unexpired, else null. */
  verify(token: string): LocalGrant | null {
    const [body, mac] = token.split('.');
    if (!body || !mac) return null;
    const expected = Buffer.from(this.mac(body));
    const given = Buffer.from(mac);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    try {
      const grant = JSON.parse(Buffer.from(body, 'base64url').toString()) as LocalGrant;
      return grant.exp * 1000 > Date.now() ? grant : null;
    } catch {
      return null;
    }
  }

  private mac(body: string) {
    return createHmac('sha256', this.secret).update(body).digest('base64url');
  }
}
