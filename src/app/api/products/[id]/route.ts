import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: {
        id,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          message: "Product not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error(
      "Failed to fetch product:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to fetch product",
      },
      {
        status: 500,
      }
    );
  }
}