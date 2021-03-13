import { Router } from "express";

const redirectRouter = Router();
const apiPrefix = process.env.API_PREFIX;

redirectRouter.get(`${apiPrefix}/redirect/discord`, (req, res) =>
  res.redirect(301, "https://discord.gg/aV9EtB3")
);

redirectRouter.get(`${apiPrefix}/redirect/instagram`, (req, res) =>
  res.redirect(301, "https://instagram.com/spotistats")
);

redirectRouter.get(`${apiPrefix}/redirect/twitter`, (req, res) =>
  res.redirect(301, "https://twitter.com/spotistats")
);

export default redirectRouter;
