import express from "express";
import RateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import authRouter from "../routers/auth";
import chartsRouter from "../routers/charts";
import importRouter from "../routers/import";
import lyricsRouter from "../routers/lyrics";
import plusRouter from "../routers/plus";
import redirectRouter from "../routers/redirect";
import statusRouter from "../routers/status";
import Redis from "./Redis";

export default async (): Promise<void> => {
  const app = express();

  app.use(
    RateLimit({
      store: new RedisStore({
        client: Redis.client,
      }),
      max: 50,
      windowMs: 5 * 60 * 1000,
      // @ts-ignore
      message: {
        success: false,
        message: "too many requests",
      },
    })
  );

  app.use(authRouter);

  app.use(plusRouter);

  app.use(importRouter);

  app.use(chartsRouter);

  app.use(lyricsRouter);

  app.use(redirectRouter);

  app.use(statusRouter);

  app.listen(process.env.API_PORT || 3000, () => console.info("Listening"));
};
