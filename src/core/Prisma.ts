import { PrismaClient, User, UserSettings } from "@prisma/client";

const prisma = new PrismaClient();

export { prisma, User, UserSettings };
