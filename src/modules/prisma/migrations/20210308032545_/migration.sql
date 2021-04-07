-- CreateTable
CREATE TABLE "InAppPurchase" (
    "id" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "googleOrderId" TEXT,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InAppPurchase" ADD FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
