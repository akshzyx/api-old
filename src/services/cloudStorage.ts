import { Bucket, Storage, UploadResponse } from "@google-cloud/storage";
import path from "path";
import { prisma, User } from "../core/Prisma";

class CloudStorageService {
  private _importBucket: Bucket;

  constructor() {
    const storage = new Storage({
      keyFilename: path.join(
        __dirname,
        "../../spotistats-a49da-a4f206dcbf07.json"
      ),
      projectId: "spotistats-a49da",
    });

    this._importBucket = storage.bucket("spotistats-a49da.appspot.com");
  }

  public async uploadFile(
    user: User,
    fileName: string,
    filePath: string
  ): Promise<UploadResponse> {
    const response: UploadResponse = await this._importBucket.upload(filePath, {
      gzip: true,
      destination: `import/${user.id}/${fileName}`,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    const {
      id,
      selfLink,
      mediaLink,
      name,
      bucket,
      generation,
      size,
      md5Hash,
      timeCreated,
      updated,
    } = response[1];

    await prisma.user.update({
      where: { id: user.id },
      data: {
        imports: {
          create: {
            id,
            selfLink,
            mediaLink,
            name,
            bucket,
            generation,
            size,
            md5Hash,
            timeCreated,
            updated,
          },
        },
      },
    });

    return response;
  }
}

export default CloudStorageService;
