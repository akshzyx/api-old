import express from "express";
import authRouter from "../routers/auth";
import importRouter from "../routers/import";

export default async (): Promise<void> => {
  const app = express();

  app.use(authRouter);

  app.use(importRouter);

  app.get("*", async (req, res) =>
    res.send("Spotistats API V1\nhttps://github.com/netlob/spotistats-api")
  );

  app.listen(process.env.API_PORT, () => console.info("Listening"));
};
