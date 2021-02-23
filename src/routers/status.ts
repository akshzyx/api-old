import { Router } from "express";
import health from "express-ping";

const statusRouter = Router();

statusRouter.use(health.ping());

statusRouter.use("*", async (req, res) => {
  if (req.accepts("json")) return res.json({ error: "Not found" });
  else return res.type("txt").send("Not found");
});

export default statusRouter;
