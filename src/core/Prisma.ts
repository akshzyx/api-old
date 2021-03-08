import {
  PrismaClient,
  User,
  UserSettings,
  ApiClient,
  InAppPurchase,
} from "@prisma/client";

const prisma = new PrismaClient();

export { prisma, User, UserSettings, ApiClient, InAppPurchase };
