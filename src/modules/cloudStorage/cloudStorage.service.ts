import { Bucket, Storage, UploadResponse } from '@google-cloud/storage';
import { User } from '@prisma/client';
import * as fs from 'fs';

export class CloudStorageService {
  private _importBucket: Bucket;

  constructor() {
    const storage = new Storage({
      keyFilename: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
      projectId: 'spotistats-a49da',
    });

    this._importBucket = storage.bucket('spotistats-a49da.appspot.com');
  }

  public async listFiles(user: User): Promise<Record<string, unknown>[]> {
    const files: Record<string, unknown>[] = (
      await this._importBucket.getFiles({
        prefix: `import/${user.id}`,
      })
    )[0].map((file) => file.metadata);

    return files;
  }

  public async uploadFile(
    user: User,
    fileName: string,
    filePath: string,
  ): Promise<UploadResponse> {
    const response: UploadResponse = await this._importBucket.upload(filePath, {
      gzip: true,
      destination: `import/${user.id}/${fileName}`,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    fs.unlinkSync(filePath);

    return response;
  }

  public async getDownloadURL(fileName: string) {
    const expiresAt: number = Date.now() + 15 * 60 * 1000;
    const [url] = await this._importBucket.file(fileName).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: expiresAt,
    });

    return { url, expiresAt };
  }
}
