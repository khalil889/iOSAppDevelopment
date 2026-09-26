import { S3Client } from '@aws-sdk/client-s3';
import { fakeConfig } from '../test-helpers';
import { LocalStorageProvider } from './local-storage.provider';
import { S3StorageProvider } from './s3-storage.provider';

describe('LocalStorageProvider', () => {
  const storage = new LocalStorageProvider(
    fakeConfig({ storage: { uploadDir: '/tmp/tg-test-uploads' }, publicApiUrl: 'http://api.test', jwt: { secret: 's3cret' } }),
  );

  it('issues signed upload URLs that verify and carry the constraints', async () => {
    const up = await storage.createUpload({ key: 'licenses/g1/a.jpg', contentType: 'image/jpeg', sizeBytes: 1234 });
    expect(up.uploadUrl).toMatch(/^http:\/\/api\.test\/api\/uploads\/local\//);
    expect(up.headers).toEqual({ 'content-type': 'image/jpeg' });
    const grant = storage.verify(up.uploadUrl.split('/').pop()!);
    expect(grant).toMatchObject({ op: 'put', key: 'licenses/g1/a.jpg', contentType: 'image/jpeg', sizeBytes: 1234 });
  });

  it('rejects tampered, foreign and expired tokens', async () => {
    const token = (await storage.createDownloadUrl('licenses/g1/a.jpg')).split('/').pop()!;
    const [body, mac] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ op: 'get', key: 'licenses/g2/b.jpg', exp: 9_999_999_999 })).toString('base64url');
    expect(storage.verify(`${forged}.${mac}`)).toBeNull();
    expect(storage.verify(`${body}.x${mac.slice(1)}`)).toBeNull();
    expect(storage.verify('garbage')).toBeNull();

    const other = new LocalStorageProvider(fakeConfig({ storage: { uploadDir: '/tmp/x' }, publicApiUrl: 'http://a', jwt: { secret: 'other' } }));
    expect(other.verify(token)).toBeNull();

    const expired = storage.sign({ op: 'get', key: 'k', exp: Math.floor(Date.now() / 1000) - 1 });
    expect(storage.verify(expired)).toBeNull();
  });

  it('refuses keys that escape the upload directory', () => {
    expect(storage.pathFor('licenses/g1/a.jpg')).toBe('/tmp/tg-test-uploads/licenses/g1/a.jpg');
    expect(() => storage.pathFor('../etc/passwd')).toThrow('Invalid storage key');
    expect(() => storage.pathFor('licenses/../../etc/passwd')).toThrow('Invalid storage key');
  });
});

describe('S3StorageProvider', () => {
  const config = fakeConfig({
    s3: { bucket: 'tg-docs', region: 'auto', endpoint: 'https://acct.r2.test', accessKeyId: 'AKID', secretAccessKey: 'SECRET', forcePathStyle: true },
  });

  it('refuses to start without bucket and credentials', () => {
    expect(() => new S3StorageProvider(fakeConfig({ s3: { region: 'auto' } }))).toThrow(/S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY/);
  });

  it('presigns a PUT that pins content type and length', async () => {
    const up = await new S3StorageProvider(config).createUpload({ key: 'licenses/g1/a.pdf', contentType: 'application/pdf', sizeBytes: 2048 });
    const url = new URL(up.uploadUrl);
    expect(url.origin + url.pathname).toBe('https://acct.r2.test/tg-docs/licenses/g1/a.pdf');
    const signed = url.searchParams.get('X-Amz-SignedHeaders')!.split(';');
    expect(signed).toEqual(expect.arrayContaining(['content-length', 'content-type', 'host']));
    expect(url.searchParams.get('X-Amz-Expires')).toBe('600');
    expect(up.headers).toEqual({ 'content-type': 'application/pdf' });
  });

  it('presigns short-lived downloads', async () => {
    const url = new URL(await new S3StorageProvider(config).createDownloadUrl('licenses/g1/a.pdf'));
    expect(url.pathname).toBe('/tg-docs/licenses/g1/a.pdf');
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300');
  });

  it('stat returns null for missing objects', async () => {
    const client = { send: jest.fn(async () => { throw Object.assign(new Error('NotFound'), { $metadata: { httpStatusCode: 404 } }); }) };
    expect(await new S3StorageProvider(config, client as unknown as S3Client).stat('nope')).toBeNull();
  });
});
