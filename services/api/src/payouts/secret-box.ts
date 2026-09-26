import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const VERSION = 'v1';

/**
 * AES-256-GCM for small secrets at rest (bank account numbers).
 * Output: "v1:<iv b64>:<tag b64>:<ciphertext b64>".
 */
export class SecretBox {
  private readonly key: Buffer;

  /** `key` is 32 bytes as base64 (or hex); anything else is hashed to 32 bytes (dev only). */
  constructor(key: string) {
    const b64 = Buffer.from(key, 'base64');
    const hex = /^[0-9a-f]{64}$/i.test(key) ? Buffer.from(key, 'hex') : null;
    this.key = hex ?? (b64.length === 32 ? b64 : createHash('sha256').update(key).digest());
  }

  static isStrongKey(key: string | undefined): boolean {
    if (!key) return false;
    return /^[0-9a-f]{64}$/i.test(key) || Buffer.from(key, 'base64').length === 32;
  }

  seal(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
  }

  open(sealed: string): string {
    const [version, iv, tag, ct] = sealed.split(':');
    if (version !== VERSION || !iv || !tag || !ct) throw new Error('Unrecognised sealed value');
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(ct, 'base64')), decipher.final()]).toString('utf8');
  }
}
