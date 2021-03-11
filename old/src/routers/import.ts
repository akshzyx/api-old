import express, { Router } from "express";
import fileUpload, { UploadedFile } from "express-fileupload";
import fs from "fs";
import jwt from "jsonwebtoken";
import { prisma } from "../core/Prisma";
import CloudStorageService from "../services/cloudStorage";
import ImportCodeService from "../services/importCode";
import windows1252 from "windows-1252";

const importRouter = Router();
const jwtSecret = process.env.JWT_SECRET as string;
const apiPrefix = process.env.API_PREFIX;
const cloudStorage = new CloudStorageService();
const importCode = new ImportCodeService();

importRouter.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
    tempFileDir: "/tmp/",
    abortOnLimit: true,
  })
);

importRouter.use(express.urlencoded({ extended: true }));

importRouter.use(`${apiPrefix}/import`, express.static("static"));

importRouter.get(`${apiPrefix}/import/code`, async (req, res) => {
  try {
    const auth = req.headers?.authorization;

    const decodedToken = jwt.verify(auth, jwtSecret);
    // @ts-ignore
    const userId = decodedToken.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "no user found" });
    }

    const code = await importCode.set(user);

    res.json({ success: true, data: code });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

importRouter.post(`${apiPrefix}/import/code`, async (req, res) => {
  try {
    const code = req.body?.code;
    if (!code) {
      return res.status(400).json({ success: false, message: "no code given" });
    }

    const user = await importCode.get(code);

    if (!user) {
      return res.status(404).json({ success: false, message: "no user found" });
    }

    res.json({ success: true, data: user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

importRouter.get(`${apiPrefix}/import/list`, async (req, res) => {
  try {
    const token = req.headers?.authorization;

    const decodedToken = jwt.verify(token, jwtSecret);
    // @ts-ignore
    const userId = decodedToken.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "no user found" });
    }

    const files = await cloudStorage.listFiles(user);

    res.json({ success: true, data: { ...user, imports: files } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

importRouter.get(`${apiPrefix}/import/download`, async (req, res) => {
  try {
    const token = req.headers?.authorization;
    const fileName = req.query?.fileName;

    const decodedToken = jwt.verify(token, jwtSecret);
    // @ts-ignore
    const userId = decodedToken.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "no user found" });
    }

    const url = await cloudStorage.getDownloadURL(
      `import/${userId}/${fileName}`
    );

    res.json({ success: true, data: url });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

importRouter.post(`${apiPrefix}/import/upload`, async (req, res) => {
  const filePaths = [];
  try {
    if (req.files === null || !("files" in req.files)) {
      throw Error("missing file(s)");
    }

    const code = req.body?.code;
    if (code == undefined) {
      throw Error("missing code");
    }

    let files = Object.keys(req.files).map<UploadedFile>(
      (file) => req.files[file] as UploadedFile
    );

    // @ts-ignore
    if (Array.isArray(files[0])) files = files[0];

    let totalStreams = 0;

    const totalContent: string[][] = [];

    files.forEach((file): void => {
      const validName = /StreamingHistory[0-9][0-9]?.json/g.test(file.name);
      if (!validName) {
        throw Error(`invalid file: ${file.name}`);
      }

      let content = fs.readFileSync(file.tempFilePath, { encoding: "utf8" });
      filePaths.push(file.tempFilePath);

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
            e["endTime"] = Date.parse(e["endTime"].replace(" ", "T")) / 10000;
            totalContent.push(Object.values(e));
          } else throw Error(`invalid item (${file.name})`);
        });
      } else
        throw Error(`invalid file length: ${content.length} (${file.name})`);
    });

    // TODO: filter dupes from totalContent

    let user = await importCode.get(code);
    if (!user) throw Error("invalid code");

    const fileName = `import-${user.id}-${new Date()
      .toJSON()
      .slice(0, 10)}.json`;
    const tempFilePath = `/tmp/${fileName}`;
    fs.writeFileSync(tempFilePath, JSON.stringify(totalContent));
    filePaths.push(tempFilePath);
    await cloudStorage.uploadFile(user, fileName, tempFilePath);

    const importedFiles = await cloudStorage.listFiles(user);

    importCode.remove(code);

    res.json({
      success: true,
      message: `Succesfully imported ${totalStreams} streams!`,
      user: { ...user, imports: importedFiles },
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  } finally {
    filePaths.forEach((path) => {
      try {
        fs.unlinkSync(path);
      } catch (e) {}
    });
  }
});

export default importRouter;
