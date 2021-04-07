-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL,
    "importCode" TEXT NOT NULL,
    "userSettingsId" INTEGER NOT NULL,

    PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" SERIAL NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "accessTokenExpiration" TIMESTAMP(3) NOT NULL,
    "sharesStats" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD FOREIGN KEY ("userSettingsId") REFERENCES "UserSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
