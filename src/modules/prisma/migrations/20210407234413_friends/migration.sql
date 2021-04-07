/*
  Warnings:

  - You are about to drop the column `sharesStats` on the `UserSettings` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SharingSettings" AS ENUM ('NONE', 'FRIENDS', 'ALL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "product" TEXT,
ADD COLUMN     "shareSettings" "SharingSettings" NOT NULL DEFAULT E'FRIENDS';

-- AlterTable
ALTER TABLE "UserSettings" DROP COLUMN "sharesStats";

-- CreateTable
CREATE TABLE "_Friends" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_Friends_AB_unique" ON "_Friends"("A", "B");

-- CreateIndex
CREATE INDEX "_Friends_B_index" ON "_Friends"("B");

-- AddForeignKey
ALTER TABLE "_Friends" ADD FOREIGN KEY ("A") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Friends" ADD FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
