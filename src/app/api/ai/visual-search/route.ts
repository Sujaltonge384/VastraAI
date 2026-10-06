import { NextResponse } from "next/server";
import { generateImageEmbedding } from "../../../../lib/clip";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: "Please upload an image.",
        },
        {
          status: 400,
        }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        {
          message: "Only image files are allowed.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          message: "Image must be smaller than 5 MB.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      `Visual search image: ${file.name} (${file.type})`
    );

    const embedding = await generateImageEmbedding(file);

    if (embedding.length !== 512) {
      throw new Error(
        `Invalid embedding dimension: ${embedding.length}`
      );
    }

    const vector = `[${embedding.join(",")}]`;

    const products = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        brand: string;
        price: number;
        originalPrice: number;
        image: string;
        category: string;
        color: string;
        rating: number;
        reviews: number;
        stock: number;
        similarity: number;
      }[]
    >`
      SELECT
        p.id,
        p.name,
        p.brand,
        p.price,
        p."originalPrice",
        p.image,
        p.category,
        p.color,
        p.rating,
        p.reviews,
        p.stock,
        1 - (e.embedding <=> ${vector}::vector) AS similarity
      FROM "ProductVisualEmbedding" e
      INNER JOIN "Product" p
        ON p.id = e."productId"
      ORDER BY e.embedding <=> ${vector}::vector
      LIMIT 20
    `;

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Visual search error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Visual search failed.",
      },
      {
        status: 500,
      }
    );
  }
}