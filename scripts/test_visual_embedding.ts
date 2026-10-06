import { prisma } from "../src/lib/prisma";
import { generateImageEmbedding } from "../src/lib/clip";

async function main() {
  const product = await prisma.product.findFirst({
    where: {
      image: {
        startsWith: "http",
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
    },
  });

  if (!product) {
    throw new Error("No product with a remote image URL was found.");
  }

  console.log("Product:", product.name);
  console.log("Image:", product.image);

  console.log("Generating CLIP embedding...");

  const embedding = await generateImageEmbedding(product.image);

  console.log(
    "Embedding dimensions:",
    embedding.length
  );

  if (embedding.length !== 512) {
    throw new Error(
      `Expected 512 dimensions, got ${embedding.length}`
    );
  }

  const vector = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    INSERT INTO "ProductVisualEmbedding"
      ("id", "productId", "embedding", "createdAt", "updatedAt")
    VALUES
      (
        ${crypto.randomUUID()},
        ${product.id},
        ${vector}::vector,
        NOW(),
        NOW()
      )
    ON CONFLICT ("productId")
    DO UPDATE SET
      "embedding" = EXCLUDED."embedding",
      "updatedAt" = NOW()
  `;

  console.log("✅ Embedding saved to PostgreSQL.");

  const result = await prisma.$queryRaw<
    { dimensions: number }[]
  >`
    SELECT vector_dims("embedding") AS dimensions
    FROM "ProductVisualEmbedding"
    WHERE "productId" = ${product.id}
  `;

  console.log(
    "Database dimensions:",
    result[0]?.dimensions
  );
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });