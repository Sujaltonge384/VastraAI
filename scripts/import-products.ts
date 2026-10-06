import "dotenv/config";
import fs from "fs";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

const filePath = "data/vastra_products_ready.csv";

async function importProducts() {
  const products: any[] = [];

  console.log("Reading CSV...");

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        products.push(row);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Found ${products.length} products.`);

  let imported = 0;

  for (let i = 0; i < products.length; i += 500) {
    const batch = products.slice(i, i + 500);

    await prisma.product.createMany({
      data: batch.map((product) => ({
        name: product.name,
        brand: product.brand,
        description: product.description,
        price: Math.round(Number(product.price)),
        originalPrice: Math.round(Number(product.originalPrice)),
        image: product.image,
        category: product.category,
        color: product.color,
        sizes: String(product.sizes).split(","),
        colors: [product.colors],
        rating: Number(product.rating) || 0,
        reviews: Number(product.reviews) || 0,
        stock: Number(product.stock) || 50,
      })),
      skipDuplicates: true,
    });

    imported += batch.length;

    console.log(`Imported ${imported}/${products.length}`);
  }

  console.log("✅ Product import completed.");
}

importProducts()
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });