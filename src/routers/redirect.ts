import { Router } from "express";

const redirectRouter = Router();
const apiPrefix = process.env.API_PREFIX;

redirectRouter.get(`${apiPrefix}/redirect/discord`, (req, res) =>
  res.redirect("https://discord.gg/aV9EtB3", 301)
);

redirectRouter.get(`${apiPrefix}/redirect/instagram`, (req, res) =>
  res.redirect("https://instagram.com/spotistats", 301)
);

redirectRouter.get(`${apiPrefix}/redirect/twitter`, (req, res) =>
  res.redirect("https://twitter.com/spotistats", 301)
);

export default redirectRouter;
