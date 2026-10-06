import { prisma } from "./prisma";

export type ProductSearchInput = {
  search?: string;
  category?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  size?: string;
  limit?: number;
};

export async function searchProducts(
  input: ProductSearchInput
) {
  const {
    search,
    category,
    color,
    maxPrice,
    minPrice,
    size,
    limit = 20,
  } = input;

  return prisma.product.findMany({
    where: {
      ...(search
        ? {
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
                description: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                category: {
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
          }
        : {}),

      ...(category
        ? {
            category: {
              equals: category,
              mode: "insensitive",
            },
          }
        : {}),

      ...(color
        ? {
            color: {
              equals: color,
              mode: "insensitive",
            },
          }
        : {}),

      ...(size
        ? {
            sizes: {
              has: size,
            },
          }
        : {}),

      ...(minPrice !== undefined
        ? {
            price: {
              gte: minPrice,
              ...(maxPrice !== undefined
                ? { lte: maxPrice }
                : {}),
            },
          }
        : maxPrice !== undefined
          ? {
              price: {
                lte: maxPrice,
              },
            }
          : {}),
    },

    orderBy: {
      rating: "desc",
    },

    take: Math.min(limit, 50),
  });
}