import { prisma } from "../src/lib/prisma";
import { generateImageEmbedding } from "../src/lib/clip";

const BATCH_SIZE = 50;

async function main() {
  let totalSuccess = 0;
  let totalFailed = 0;
  let batchNumber = 0;

  console.log("🚀 Starting full catalog visual embedding generation");

  while (true) {
    batchNumber++;

    const products = await prisma.product.findMany({
      where: {
        image: {
          startsWith: "http",
        },
        visualEmbedding: null,
      },
      select: {
        id: true,
        name: true,
        image: true,
      },
      take: BATCH_SIZE,
    });

    if (products.length === 0) {
      console.log("\n✅ ALL AVAILABLE PRODUCTS PROCESSED");
      break;
    }

    console.log(
      `\n==============================\nBATCH ${batchNumber}\n==============================`
    );

    console.log(`📦 Products in batch: ${products.length}`);

    let batchSuccess = 0;
    let batchFailed = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      console.log(
        `[${i + 1}/${products.length}] ${product.name}`
      );

      try {
        const embedding = await generateImageEmbedding(
          product.image
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

        batchSuccess++;
        totalSuccess++;

        console.log("   ✅ Saved");
      } catch (error) {
        batchFailed++;
        totalFailed++;

        console.error(
          "   ❌ Failed:",
          error instanceof Error
            ? error.message
            : error
        );
      }
    }

    console.log("\nBatch summary:");
    console.log(`✅ Success: ${batchSuccess}`);
    console.log(`❌ Failed: ${batchFailed}`);

    console.log("\nOverall:");
    console.log(`✅ Success: ${totalSuccess}`);
    console.log(`❌ Failed: ${totalFailed}`);

    // Small pause between batches
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );
  }

  console.log("\n==============================");
  console.log("FINAL RESULT");
  console.log("==============================");
  console.log(`✅ Total successful: ${totalSuccess}`);
  console.log(`❌ Total failed: ${totalFailed}`);
}

main()
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });