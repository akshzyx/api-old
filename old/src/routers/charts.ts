import * as CSV from "csv-string";
import { Request, Response, Router } from "express";
import redis from "../core/Redis";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

const chartsRouter = Router();
const apiPrefix = process.env.API_PREFIX;
const jwtSecret = process.env.JWT_SECRET as string;

const getCharts = async (type, country, date) => {
  const lastIndex = type == "regional" ? 4 : 3;
  const csvData = await fetch(
    `https://spotifycharts.com/${type}/${country}/${date}/latest/download`
  ).then((res) => res.text());

  return CSV.parse(csvData.trim())
    .splice(lastIndex - 2)
    .map((track) => {
      return {
        position: parseInt(track[0]),
        track: track[1],
        artist: track[2],
        streams: lastIndex == 4 ? parseInt(track[3]) : null,
        id: /track\/(?<id>[0-9a-zA-Z]+)$/.exec(track[lastIndex])?.groups?.id,
      };
    })
    .filter((t) => typeof t.id == "string" && t?.id?.length > 5);
};

const saveCharts = async () => {
  redis.set(
    "charts.regional.global.daily",
    JSON.stringify(await getCharts("regional", "global", "daily"))
  );
  redis.set(
    "charts.regional.global.weekly",
    JSON.stringify(await getCharts("regional", "global", "weekly"))
  );
  redis.set(
    "charts.viral.global.daily",
    JSON.stringify(await getCharts("viral", "global", "daily"))
  );
  redis.set(
    "charts.viral.global.weekly",
    JSON.stringify(await getCharts("viral", "global", "weekly"))
  );
  redis.set("charts.snapshot", new Date().toISOString());
};

setInterval(saveCharts, 5 * 60 * 1000); // every 5 minutes
saveCharts();

chartsRouter.get(
  `${apiPrefix}/charts/:type/:country/:date`,
  async (req: Request, res: Response) => {
    try {
      const token = req.headers?.authorization;
      jwt.verify(token, jwtSecret);

      const type: string = req.params.type;
      const country: string = req.params.country;
      const date: string = req.params.date;

      if (type === null || country === null || date === null) {
        throw Error("no type, country or date provided");
      }

      const data = {
        snapshot: await redis.get("charts.snapshot"),
        data: JSON.parse(await redis.get(`charts.${type}.${country}.${date}`)), // TODO: is this safe?
      };

      return res.json({
        success: true,
        data: data,
      });
    } catch (e) {
      return res.status(500).json({ success: false, message: e.message });
    }
  }
);

export default chartsRouter;
