/*
  Warnings:

  - You are about to drop the column `importCode` on the `User` table. All the data in the column will be lost.
  - Added the required column `apiClientId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "importCode",
ADD COLUMN     "apiClientId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ApiClient" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("apiClientId") REFERENCES "ApiClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
