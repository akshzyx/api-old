import express from "express";
import authRouter from "../routers/auth";
import chartsRouter from "../routers/charts";
import importRouter from "../routers/import";
import statusRouter from "../routers/status";

export default async (): Promise<void> => {
  const app = express();

  app.use(authRouter);

  app.use(importRouter);

  app.use(chartsRouter);

  app.use(statusRouter);

  app.listen(process.env.API_PORT || 3000, () => console.info("Listening"));
};
