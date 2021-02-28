import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";

const lyricsRouter = Router();
const apiPrefix = process.env.API_PREFIX;
const jwtSecret = process.env.JWT_SECRET as string;

const delimiters = [
  '</div></div></div></div><div class="hwc"><div class="BNeawe tAd8D AP7Wnd"><div><div class="BNeawe tAd8D AP7Wnd">',
  '</div></div></div></div></div><div><span class="hwc"><div class="BNeawe uEec3 AP7Wnd">',
];

lyricsRouter.get(
  `${apiPrefix}/lyrics/delimiters`,
  async (req: Request, res: Response) => {
    const token = req.headers?.authorization;
    try {
      jwt.verify(token, jwtSecret);
    } catch (e) {
      return res
        .status(401)
        .json({ success: false, message: "invalid authorization" });
    }

    res.status(200).json({ success: true, data: delimiters });
  }
);

export default lyricsRouter;
