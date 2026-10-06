import fs from "fs";
import { prisma } from "../src/lib/prisma";

type EmbeddingData = {
  productId: string;
  productName: string;
  embedding: number[];
};

async function main() {
  const file = fs.readFileSync(
    "scripts/test_embedding.json",
    "utf-8"
  );

  const data: EmbeddingData = JSON.parse(file);

  if (!data.productId) {
    throw new Error("productId is missing.");
  }

  if (!Array.isArray(data.embedding)) {
    throw new Error("embedding is invalid.");
  }

  if (data.embedding.length !== 512) {
    throw new Error(
      `Expected 512 dimensions, got ${data.embedding.length}`
    );
  }

  const vector = `[${data.embedding.join(",")}]`;

  console.log(
    `Saving embedding for: ${data.productName}`
  );

  await prisma.$executeRaw`
    INSERT INTO "ProductVisualEmbedding"
      ("id", "productId", "embedding", "createdAt", "updatedAt")
    VALUES
      (
        ${crypto.randomUUID()},
        ${data.productId},
        ${vector}::vector,
        NOW(),
        NOW()
      )
    ON CONFLICT ("productId")
    DO UPDATE SET
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = NOW()
  `;

  console.log("✅ Embedding stored in PostgreSQL.");

  const result = await prisma.$queryRaw<
    { dimensions: number }[]
  >`
    SELECT vector_dims("embedding") AS dimensions
    FROM "ProductVisualEmbedding"
    WHERE "productId" = ${data.productId}
  `;

  console.log(
    `✅ Database vector dimensions: ${result[0]?.dimensions}`
  );
}

main()
  .catch((error) => {
    console.error("❌ Failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });