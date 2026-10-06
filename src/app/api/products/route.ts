import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category =
      searchParams.get("category")?.toLowerCase() || "";

    const search =
      searchParams.get("search")?.trim() || "";

    const page = Math.max(
      Number(searchParams.get("page")) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number(searchParams.get("limit")) || 24,
        1
      ),
      48
    );

    const maxPriceParam = searchParams.get("maxPrice");
    const maxPrice = maxPriceParam
      ? Number(maxPriceParam)
      : null;

    const size = searchParams.get("size") || "";
    const sort = searchParams.get("sort") || "featured";

    const conditions: any[] = [];

    // =========================================
    // SEARCH
    // =========================================

    if (search) {
      conditions.push({
        OR: [
          {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            brand: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            color: {
              contains: search,
              mode: "insensitive",
            },
          },
        ],
      });
    }

    // =========================================
    // ONLY 5 MAIN CATEGORIES
    // =========================================

    if (category === "men") {
      conditions.push({
        name: {
          startsWith: "Men ",
          mode: "insensitive",
        },
      });
    }

    if (category === "women") {
      conditions.push({
        name: {
          startsWith: "Women ",
          mode: "insensitive",
        },
      });
    }

    if (category === "kids") {
      conditions.push({
        OR: [
          {
            name: {
              startsWith: "Kids ",
              mode: "insensitive",
            },
          },
          {
            name: {
              startsWith: "Boys ",
              mode: "insensitive",
            },
          },
          {
            name: {
              startsWith: "Girls ",
              mode: "insensitive",
            },
          },
        ],
      });
    }

    if (category === "footwear") {
      conditions.push({
        OR: [
          {
            name: {
              contains: "shoe",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "sandal",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "sneaker",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "slipper",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "loafer",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "boot",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "heel",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "jutti",
              mode: "insensitive",
            },
          },
        ],
      });
    }

    if (category === "accessories") {
      conditions.push({
        OR: [
          {
            name: {
              contains: "watch",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "wallet",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "belt",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "bag",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "sunglass",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "scarf",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "cap",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "hat",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "jewellery",
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: "jewelry",
              mode: "insensitive",
            },
          },
        ],
      });
    }

    // =========================================
    // PRICE
    // =========================================

    if (
      maxPrice !== null &&
      !Number.isNaN(maxPrice)
    ) {
      conditions.push({
        price: {
          lte: maxPrice,
        },
      });
    }

    // =========================================
    // SIZE
    // =========================================

    if (size && size !== "all") {
      conditions.push({
        sizes: {
          has: size,
        },
      });
    }

    // =========================================
    // WHERE
    // =========================================

    const where =
      conditions.length > 0
        ? { AND: conditions }
        : {};

    // =========================================
    // SORT
    // =========================================

    let orderBy: any = {
      createdAt: "desc",
    };

    if (sort === "price-low") {
      orderBy = {
        price: "asc",
      };
    }

    if (sort === "price-high") {
      orderBy = {
        price: "desc",
      };
    }

    if (sort === "rating") {
      orderBy = {
        rating: "desc",
      };
    }

    // =========================================
    // DATABASE
    // =========================================

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),

      prisma.product.count({
        where,
      }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "Failed to fetch products:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to fetch products",
      },
      {
        status: 500,
      }
    );
  }
}