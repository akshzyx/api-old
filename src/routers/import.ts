import jwt from "jsonwebtoken";
import express, { Router } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import CloudStorageService from "../services/cloudStorage";
import { prisma } from "../core/Prisma";

const importRouter = Router();
const jwtSecret = process.env.JWT_SECRET as string;
const apiPrefix = process.env.API_PREFIX;
const cloudStorage = new CloudStorageService();

importRouter.use(
  fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: "/tmp/",
    abortOnLimit: true,
  })
);

importRouter.use(express.urlencoded({ extended: true }));

importRouter.use(`${apiPrefix}/import`, express.static("static"));

importRouter.use(`${apiPrefix}/import/:userid/list`, async (req, res) => {
  const importCode = req.headers?.authorization;
  const userId = req.params?.userid;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      imports: true,
    },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "no user found" });
  }

  if (user.importCode != importCode) {
    return res
      .status(401)
      .json({ success: false, message: "invalid authorization" });
  }

  res.json({ success: true, data: user });
});

importRouter.use(`${apiPrefix}/import/userinfo`, async (req, res) => {
  const token = req.headers?.authorization;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "invalid authorization" });
  }
  let userId;
  try {
    const decodedToken = jwt.verify(token, jwtSecret);
    // @ts-ignore
    userId = decodedToken.userId;
  } catch (e) {
    return res.status(404).json({ success: false, message: e.message });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({ success: false, message: "no user found" });
  }

  res.json({ success: true, data: user });
});

importRouter.post(`${apiPrefix}/import/upload`, async (req, res) => {
  try {
    if (req.files === null || !("files" in req.files)) {
      throw Error("missing file(s)");
    }

    const token = req.body.token;
    if (token == undefined) {
      throw Error("missing token");
    }

    let files = Object.keys(req.files).map<UploadedFile>(
      (file) => req.files[file] as UploadedFile
    );

    // @ts-ignore
    if (Array.isArray(files[0])) files = files[0];

    let totalStreams = 0;

    files.forEach((file): void => {
      const validName = /StreamingHistory[0-9][0-9]?.json/g.test(file.name);
      if (!validName) {
        throw Error(`invalid file: ${file.name}`);
      }

      let content = fs.readFileSync(file.tempFilePath, { encoding: "utf8" });

      content = JSON.parse(content);
      if (content.length > 0 && content.length < 10001) {
        totalStreams += content.length;
        ((content as unknown) as object[]).forEach((e) => {
          if (
            Object.keys(e).length == 4 &&
            "endTime" in e &&
            "artistName" in e &&
            "trackName" in e &&
            "msPlayed" in e
          ) {
          } else throw Error(`invalid item (${file.name})`);
        });
      } else
        throw Error(`invalid file length: ${content.length} (${file.name})`);
    });

    let userId;
    try {
      const decodedToken = jwt.verify(token, jwtSecret);
      // @ts-ignore
      userId = decodedToken.userId;
    } catch (e) {
      throw Error("invalid auth");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        imports: true,
      },
    });

    if (user === null) throw Error("user not found");

    // const uploads = [];
    // for (let i in files) {
    //   const file = files[i];
    //   uploads.push(
    //     await cloudStorage.uploadFile(user, file.name, file.tempFilePath)
    //   );
    // }

    res.json({
      success: true,
      message: `Succesfully imported ${totalStreams} streams!`,
      importCode: user.importCode,
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

export default importRouter;
