import { Router } from "express";
import health from "express-ping";

const statusRouter = Router();
const apiPrefix = process.env.API_PREFIX;

statusRouter.use(health.ping(`${apiPrefix}/ping`));

statusRouter.use("*", async (req, res) => {
  if (req.accepts("json"))
    return res.json({ error: "Not found", url: req.originalUrl });
  else return res.type("txt").send(`Not found (url: ${req.originalUrl})`);
});

export default statusRouter;
