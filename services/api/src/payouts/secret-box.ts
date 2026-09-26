import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const VERSION = 'v1';
const B64_KEY = /^[A-Za-z0-9+/]{43}=$/;
const HEX_KEY = /^[0-9a-f]{64}$/i;

/**
 * AES-256-GCM for small secrets at rest (bank account numbers).
 * Output: "v1:<iv b64>:<tag b64>:<ciphertext b64>".
 */
export class SecretBox {
  private readonly key: Buffer;

  /**
   * `key` is 32 bytes as standard base64 (44 chars) or hex (64 chars). Anything
   * else is hashed to 32 bytes — development only; production refuses to start.
   */
  constructor(key: string) {
    if (HEX_KEY.test(key)) this.key = Buffer.from(key, 'hex');
    else if (B64_KEY.test(key)) this.key = Buffer.from(key, 'base64');
    else this.key = createHash('sha256').update(key).digest();
  }

  static isStrongKey(key: string | undefined): boolean {
    return !!key && (HEX_KEY.test(key) || B64_KEY.test(key));
  }

  /** `context` (e.g. the guide id) is authenticated, so a value can't be moved to another row. */
  seal(plain: string, context: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv, { authTagLength: 16 });
    cipher.setAAD(Buffer.from(context, 'utf8'));
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [VERSION, iv.toString('base64'), cipher.getAuthTag().toString('base64'), ct.toString('base64')].join(':');
  }

  open(sealed: string, context: string): string {
    const [version, ivB64, tagB64, ct] = sealed.split(':');
    if (version !== VERSION || !ivB64 || !tagB64 || !ct) throw new Error('Unrecognised sealed value');
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    if (iv.length !== 12 || tag.length !== 16) throw new Error('Malformed sealed value');
    const decipher = createDecipheriv('aes-256-gcm', this.key, iv, { authTagLength: 16 });
    decipher.setAAD(Buffer.from(context, 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(Buffer.from(ct, 'base64')), decipher.final()]).toString('utf8');
  }
}
