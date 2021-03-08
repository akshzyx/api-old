import iap from "in-app-purchase";
import path from "path";
import fs from "fs";
import { prisma } from "../core/Prisma";

class InAppPurchaseService {
  static _iap;

  constructor() {
    const serviceAccount = JSON.parse(
      fs
        .readFileSync(
          path.join(__dirname, process.env.GOOGLE_SERVICE_ACCOUNT_PATH)
        )
        .toString()
    );
    iap.config({
      appleExcludeOldTransactions: false,
      applePassword: process.env.APPLE_SHARED_SECRET,
      googleServiceAccount: {
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      },
    });
  }

  async setup() {
    await iap.setup();
  }

  async validate(receipt, user): Promise<boolean> {
    const validatedData = await iap.validate(receipt);
    const purchaseData = await iap.getPurchaseData(validatedData);

    const data: iap.PurchasedItem = purchaseData[0];

    const date = new Date(
      // @ts-ignore
      data.orderId ? data.purchaseTimeMillis : data.purchaseDateMs
    );
    try {
      await prisma.inAppPurchase.create({
        data: {
          id: data.transactionId,
          purchaseDate: date,
          googleOrderId: data?.orderId,
          productId: data.productId,
          userId: user.id,
        },
      });
    } catch (e) {
      return false;
    }
    return true;
  }
}

export default new InAppPurchaseService();
