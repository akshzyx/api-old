import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import router from "./core/Router";
import iap from "./services/inAppPurchase";
import { prisma } from "./core/Prisma";

async function bootstrap(): Promise<void> {
  await router();
  await iap.setup();
  await prisma.$connect();
}

bootstrap().finally(() => prisma.$disconnect());
