import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // 1. AI PARSES THE USER'S REQUEST
    // -----------------------------------------

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",

      contents: `
You are VastraAI's fashion search parser.

Convert the user's natural-language shopping request
into structured JSON filters.

User request:
"${query}"

Return ONLY valid JSON in exactly this format:

{
  "category": "men" | "women" | "kids" | "footwear" | "accessories" | null,
  "productType": string | null,
  "color": string | null,
  "maxPrice": number | null,
  "size": string | null,
  "sort": "featured" | "price-low" | "price-high" | "rating"
}

Rules:

1. CATEGORY
- men's / men → "men"
- women's / women → "women"
- kids / children / boys / girls → "kids"
- shoes / sneakers / footwear / sandals / boots → "footwear"
- bags / watches / wallets / belts / accessories → "accessories"

2. PRODUCT TYPE
Extract the actual product type.

Examples:
"black shirt" → "shirt"
"blue jeans" → "jeans"
"white dress" → "dress"
"red t-shirt" → "t-shirt"
"running shoes" → "running shoes"

3. COLOR
Extract colors such as:
black, white, blue, red, green, yellow,
pink, brown, grey, purple, orange, beige, etc.

4. PRICE
"under ₹1500" → 1500
"below 2000" → 2000
"less than ₹3000" → 3000

5. SIZE
Extract:
XS, S, M, L, XL, XXL

6. SORT
"cheapest" → "price-low"
"lowest price" → "price-low"
"most expensive" → "price-high"
"highest price" → "price-high"
"best rated" → "rating"

If sorting isn't requested:
"featured"

Do not invent information.
Use null when a value is not present.
`,

      config: {
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");

    // -----------------------------------------
    // 2. BUILD DATABASE FILTERS
    // -----------------------------------------

    const where: any = {};

    // Category
    if (parsed.category) {
      where.category = {
        equals: parsed.category,
        mode: "insensitive",
      };
    }

    // Color
    if (parsed.color) {
      where.color = {
        contains: parsed.color,
        mode: "insensitive",
      };
    }

    // Product type
    if (parsed.productType) {
      where.OR = [
        {
          name: {
            contains: parsed.productType,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: parsed.productType,
            mode: "insensitive",
          },
        },
      ];
    }

    // Maximum price
    if (parsed.maxPrice) {
      where.price = {
        lte: Number(parsed.maxPrice),
      };
    }

    // Size
    if (parsed.size) {
      where.sizes = {
        has: parsed.size,
      };
    }

    // -----------------------------------------
    // 3. SORTING
    // -----------------------------------------

    let orderBy: any = {
      createdAt: "desc",
    };

    if (parsed.sort === "price-low") {
      orderBy = {
        price: "asc",
      };
    }

    if (parsed.sort === "price-high") {
      orderBy = {
        price: "desc",
      };
    }

    if (parsed.sort === "rating") {
      orderBy = {
        rating: "desc",
      };
    }

    // -----------------------------------------
    // 4. SEARCH DATABASE
    // -----------------------------------------

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: 20,
    });

    // -----------------------------------------
    // 5. RETURN RESULTS
    // -----------------------------------------

    return NextResponse.json({
      query,
      filters: parsed,
      products,
    });
  } catch (error) {
    console.error("AI search error:", error);

    return NextResponse.json(
      {
        message: "AI search failed",
      },
      {
        status: 500,
      }
    );
  }
}