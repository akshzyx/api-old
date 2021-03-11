import express, { Router } from "express";
import jwt from "jsonwebtoken";
import iap from "../services/inAppPurchase";
import { prisma } from "../core/Prisma";

const plusRouter = Router();
const apiPrefix = process.env.API_PREFIX;
const jwtSecret = process.env.JWT_SECRET as string;

plusRouter.use(express.json());

plusRouter.post(`${apiPrefix}/plus`, async (req, res) => {
  try {
    const token: string = req.headers?.authorization as string;
    let receipt = req.body?.receipt;

    if (!receipt) throw Error("receipt required");
    receipt = receipt[0] == "{" ? JSON.parse(receipt) : receipt;

    const decodedToken = jwt.verify(token, jwtSecret);
    // @ts-ignore
    let userId = decodedToken.userId;

    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { inAppPurchase: true },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const inAppPurchase = await iap.validate(receipt, user);
    if (inAppPurchase) {
      user = await prisma.user.update({
        where: { id: userId },
        data: { isPlus: true },
        include: { inAppPurchase: true },
      });
    }

    res.status(200).json({ success: true, data: user });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

export default plusRouter;
