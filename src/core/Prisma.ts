import { PrismaClient, User, UserSettings, ApiClient } from "@prisma/client";

const prisma = new PrismaClient();

export { prisma, User, UserSettings, ApiClient };
