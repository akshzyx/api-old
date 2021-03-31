import { HttpException, Inject, Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import * as iap from 'in-app-purchase';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
const SpotifyWebApi = require('spotify-web-api-node');

@Injectable()
export class PlusService {
  constructor(private prisma: PrismaService, private authService: AuthService) {
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
    if (typeof receipt == 'string' && receipt[0] == '{') {
      receipt = JSON.parse(receipt);
    }

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

  async userStats(params) {
    const userid = params?.userid;
    const spotifyApi = await this.getApi(userid);

    const stats = (
      await spotifyApi.getMyRecentlyPlayedTracks({
        limit: 50,
      })
    ).body;

    return stats;
  }

  async getApi(userid) {
    let dbUser = await this.prisma.user.findUnique({
      where: { id: userid },
      include: { apiClient: true, settings: true },
    });

    if (!dbUser.settings.sharesStats) {
      throw new HttpException('user doesnt share stats', 400);
    }

    const user = await this.authService.getToken(dbUser);
    const spotifyApi = new SpotifyWebApi();
    spotifyApi.setAccessToken(user.settings.accessToken);

    return spotifyApi;
  }
}
