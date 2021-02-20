import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import router from "./core/Router";
import { prisma } from "./core/Prisma";

async function bootstrap(): Promise<void> {
  await router();
  await prisma.$connect();
}

bootstrap().finally(() => prisma.$disconnect());
