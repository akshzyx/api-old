import * as CSV from "csv-string";
import { Request, Response, Router } from "express";
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
  charts.regional.global.daily = await getCharts("regional", "global", "daily");
  charts.regional.global.weekly = await getCharts(
    "regional",
    "global",
    "weekly"
  );
  charts.viral.global.daily = await getCharts("viral", "global", "daily");
  charts.viral.global.weekly = await getCharts("viral", "global", "weekly");
  charts.snapshot = new Date().toISOString();
};

let charts = {
  snapshot: "",
  viral: {
    global: {
      daily: {},
      weekly: {},
    },
  },
  regional: {
    global: {
      daily: {},
      weekly: {},
    },
  },
};

setInterval(saveCharts, 5 * 60 * 1000); // every 5 minutes
saveCharts();

chartsRouter.get(
  `${apiPrefix}/charts/:type/:country/:date`,
  async (req: Request, res: Response) => {
    const token = req.headers?.authorization;
    try {
      jwt.verify(token, jwtSecret);
    } catch (e) {
      return res
        .status(401)
        .json({ success: false, message: "invalid authorization" });
    }

    const type: string = req.params.type;
    const country: string = req.params.country;
    const date: string = req.params.date;

    const data = {};
    let statusCode = 200;

    if (country === null || date === null) {
      statusCode = 400;
      data["error"] = "no locale and date provided";
    }

    try {
      data["snapshot"] = charts.snapshot;
      data["length"] = charts[type][country][date].length;
      data["data"] = charts[type][country][date];
    } catch (e) {
      statusCode = 500;
      data["error"] = e.toString();
    }

    return res.status(statusCode).json(data).end();
  }
);

export default chartsRouter;
