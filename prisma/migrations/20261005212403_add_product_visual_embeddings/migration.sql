-- CreateTable
CREATE TABLE "ProductVisualEmbedding" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "embedding" vector NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVisualEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVisualEmbedding_productId_key" ON "ProductVisualEmbedding"("productId");

-- AddForeignKey
ALTER TABLE "ProductVisualEmbedding" ADD CONSTRAINT "ProductVisualEmbedding_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
