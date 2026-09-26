import { Controller, Get, HttpCode, Inject, Param, Put, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import { Public } from '../../common/decorators/public.decorator';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER, StorageProvider } from './storage.interface';

/** Serves the signed URLs issued by LocalStorageProvider (development only). */
@ApiExcludeController()
@Public()
@Controller('uploads/local')
export class LocalUploadsController {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider) {}

  private local(res: Response): LocalStorageProvider | null {
    if (this.storage instanceof LocalStorageProvider) return this.storage;
    res.status(404).json({ statusCode: 404, message: 'Local storage is disabled' });
    return null;
  }

  @Put(':token')
  @HttpCode(200)
  async upload(@Param('token') token: string, @Req() req: Request, @Res() res: Response) {
    const storage = this.local(res);
    if (!storage) return;
    const grant = storage.verify(token);
    if (!grant || grant.op !== 'put') return res.status(403).json({ statusCode: 403, message: 'Invalid or expired upload URL' });
    if ((req.headers['content-type'] ?? '').split(';')[0] !== grant.contentType) {
      return res.status(400).json({ statusCode: 400, message: `Content-Type must be ${grant.contentType}` });
    }

    const declared = Number(req.headers['content-length']);
    if (Number.isFinite(declared) && declared !== grant.sizeBytes) {
      return res.status(400).json({ statusCode: 400, message: `Upload must be exactly ${grant.sizeBytes} bytes` });
    }

    const path = storage.pathFor(grant.key);
    await storage.ensureDir(grant.key);
    let received = 0;
    const tmp = `${path}.part`;
    try {
      req.on('data', (chunk: Buffer) => {
        received += chunk.length;
        if (received > (grant.sizeBytes ?? 0)) req.destroy(new Error('too large'));
      });
      await pipeline(req, createWriteStream(tmp));
      if (received !== grant.sizeBytes) throw new Error('size mismatch');
      await fs.rename(tmp, path);
      return res.json({ key: grant.key, sizeBytes: received });
    } catch {
      await fs.rm(tmp, { force: true });
      return res.status(400).json({ statusCode: 400, message: `Upload must be exactly ${grant.sizeBytes} bytes` });
    }
  }

  @Get(':token')
  async download(@Param('token') token: string, @Res() res: Response) {
    const storage = this.local(res);
    if (!storage) return;
    const grant = storage.verify(token);
    if (!grant || grant.op !== 'get') return res.status(403).json({ statusCode: 403, message: 'Invalid or expired link' });
    const stat = await storage.stat(grant.key);
    if (!stat) return res.status(404).json({ statusCode: 404, message: 'File not found' });
    const ext = grant.key.split('.').pop();
    const types: Record<string, string> = { pdf: 'application/pdf', png: 'image/png', webp: 'image/webp' };
    res.type(types[ext ?? ''] ?? 'image/jpeg');
    res.setHeader('cache-control', 'private, no-store');
    createReadStream(storage.pathFor(grant.key)).pipe(res);
  }
}
