import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { readFileSync } from 'fs';
import iap from 'in-app-purchase';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlusService {
  static _iap;

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

  async validate(receipt, user): Promise<boolean> {
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

  async postReceipt(user: User) {
    return user;
  }
}
