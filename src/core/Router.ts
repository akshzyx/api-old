import express from "express";
import promMid from "express-prometheus-middleware";
import authRouter from "../routers/auth";
import chartsRouter from "../routers/charts";
import importRouter from "../routers/import";
import lyricsRouter from "../routers/lyrics";
import statusRouter from "../routers/status";

export default async (): Promise<void> => {
  const app = express();

  app.use(
    promMid({
      metricsPath: "/metrics",
      collectDefaultMetrics: true,
      requestDurationBuckets: [0.1, 0.5, 1, 1.5],
    })
  );

  app.use(authRouter);

  app.use(importRouter);

  app.use(chartsRouter);

  app.use(lyricsRouter);

  app.use(statusRouter);

  app.listen(process.env.API_PORT || 3000, () => console.info("Listening"));
};
