import { Router } from "express";
import jwt from "jsonwebtoken";
import { verifyIAP } from "../misc/verifyIAP";
import { prisma } from "../core/Prisma";

const plusRouter = Router();
const apiPrefix = process.env.API_PREFIX;
const jwtSecret = process.env.JWT_SECRET as string;

plusRouter.post(`${apiPrefix}/plus`, async (req, res) => {
  try {
    const token: string = req.headers?.authorization as string;
    const decodedToken = jwt.verify(token, jwtSecret);
    // @ts-ignore
    let userId = decodedToken.userId;

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const validPurchase = await verifyIAP(req, user);
    if (!validPurchase) throw Error("invalid purchase");

    user = await prisma.user.update({
      where: { id: userId },
      data: { isPlus: true },
    });

    res.status(200).json({ success: true, data: user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

export default plusRouter;
