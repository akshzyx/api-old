import express, { Router } from "express";
import health from "express-ping";
import redis from "../core/Redis";

const statusRouter = Router();
const apiPrefix = process.env.API_PREFIX;
const statusToken = process.env.STATUS_TOKEN;

statusRouter.use(health.ping(`${apiPrefix}/health`));
statusRouter.use(express.json());

statusRouter.all(`${apiPrefix}/ping`, (req, res) =>
  res.json({ success: true })
);

statusRouter.get(`${apiPrefix}/status`, async (req, res) => {
  try {
    const data = JSON.parse(await redis.get("status"));
    if (data?.enabled != true) throw Error();
    return res.json({ success: true, data: data });
  } catch (e) {
    return res.json({ success: true, data: null });
  }
});

statusRouter.post(`${apiPrefix}/status`, async (req, res) => {
  const token = req.headers?.authorization;
  const data = req.body as object;

  if (token != statusToken) {
    return res.status(401).json({ success: false, message: "nice try" });
  }

  await redis.set("status", JSON.stringify(data), -1);

  res.json({ success: true, message: data });
});

statusRouter.all("*", async (req, res) => {
  if (req.accepts("json"))
    return res.status(404).json({ error: "Not found", url: req.originalUrl });
  else
    return res
      .status(404)
      .type("txt")
      .send(`Not found (url: ${req.originalUrl})`);
});

export default statusRouter;
