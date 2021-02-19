import { PrismaClient, User, UserImport, UserSettings } from '@prisma/client'

const prisma = new PrismaClient()


export { prisma, User, UserImport, UserSettings }