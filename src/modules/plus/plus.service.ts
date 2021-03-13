import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as iap from 'in-app-purchase';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlusService {
  constructor(private prisma: PrismaService) {
    const serviceAccount = JSON.parse(
      readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_PATH).toString(),
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

  async postReceipt(user, body) {
    const receipt = body?.receipt;

    const inAppPurchase = await this.validate(user, receipt);
    if (inAppPurchase || (user.inAppPurchase?.length > 0 && !user.isPlus)) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { isPlus: true },
        include: { inAppPurchase: true },
      });
    }

    return user;
  }

  async validate(user, receipt): Promise<boolean> {
    const validatedData = await iap.validate(receipt);
    const purchaseData = await iap.getPurchaseData(validatedData);

    const data: iap.PurchasedItem = purchaseData[0];

    let date = Date.now();
    // @ts-ignore
    if (typeof data?.purchaseTimeMillis == 'number')
      // @ts-ignore
      date = data.purchaseTimeMillis;
    // @ts-ignore
    if (typeof data?.purchaseDateMs == 'number') date = data.purchaseDateMs;

    try {
      await this.prisma.inAppPurchase.create({
        data: {
          id: data.transactionId,
          purchaseDate: new Date(date),
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
