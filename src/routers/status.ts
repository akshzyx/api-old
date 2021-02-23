import { Router } from "express";
import health from "express-ping";

const statusRouter = Router();

statusRouter.use(health.ping());

statusRouter.use("*", async (req, res) => {
  if (req.accepts("json"))
    return res.json({ error: "Not found", url: req.url });
  else return res.type("txt").send(`Not found (url: ${req.url})`);
});

export default statusRouter;
