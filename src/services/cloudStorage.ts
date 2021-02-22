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

  public async listFiles(user: User): Promise<object[]> {
    const files: object[] = (
      await this._importBucket.getFiles({
        prefix: `import/${user.id}`,
      })
    )[0].map((file) => file.metadata);

    // if (save) {
    //   for (let file in files) {
    //     // @ts-ignore
    //     file = files[file];
    //     const {
    //       // @ts-ignore
    //       id,
    //       // @ts-ignore
    //       selfLink,
    //       // @ts-ignore
    //       mediaLink,
    //       // @ts-ignore
    //       name,
    //       // @ts-ignore
    //       bucket,
    //       // @ts-ignore
    //       generation,
    //       // @ts-ignore
    //       size,
    //       // @ts-ignore
    //       md5Hash,
    //       // @ts-ignore
    //       timeCreated,
    //       // @ts-ignore
    //       updated,
    //     } = file;

    //     await prisma.user.update({
    //       where: { id: user.id },
    //       data: {
    //         imports: {
    //           create: {
    //             id,
    //             selfLink,
    //             mediaLink,
    //             name,
    //             bucket,
    //             generation,
    //             size,
    //             md5Hash,
    //             timeCreated,
    //             updated,
    //           },
    //         },
    //       },
    //     });
    //   }
    // }

    return files;
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

    return response;
  }
}

export default CloudStorageService;
