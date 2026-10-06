import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user;
}

// GET /api/wishlist
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(
      wishlist ?? {
        id: null,
        userId: user.id,
        items: [],
      }
    );
  } catch (error) {
    console.error(
      "Failed to fetch wishlist:",
      error
    );

    return NextResponse.json(
      { message: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST /api/wishlist
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please sign in first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const productId = body?.productId;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Make sure product exists
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Get or create wishlist for THIS USER
    const wishlist = await prisma.wishlist.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
      },
    });

    // Check whether this product is already saved
    const existingItem =
      await prisma.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },
        include: {
          product: true,
        },
      });

    if (existingItem) {
      return NextResponse.json(
        {
          message: "Product already in wishlist",
          item: existingItem,
        },
        { status: 200 }
      );
    }

    const wishlistItem =
      await prisma.wishlistItem.create({
        data: {
          wishlistId: wishlist.id,
          productId,
        },
        include: {
          product: true,
        },
      });

    return NextResponse.json(
      wishlistItem,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to add wishlist item:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to add wishlist item",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist
export async function DELETE(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please sign in first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const productId = body?.productId;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    const wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId: user.id,
        },
      });

    if (!wishlist) {
      return NextResponse.json(
        { message: "Wishlist is empty" },
        { status: 404 }
      );
    }

    const item =
      await prisma.wishlistItem.findUnique({
        where: {
          wishlistId_productId: {
            wishlistId: wishlist.id,
            productId,
          },
        },
      });

    if (!item) {
      return NextResponse.json(
        { message: "Product not found in wishlist" },
        { status: 404 }
      );
    }

    await prisma.wishlistItem.delete({
      where: {
        id: item.id,
      },
    });

    return NextResponse.json({
      message: "Product removed from wishlist",
    });
  } catch (error) {
    console.error(
      "Failed to remove wishlist item:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to remove wishlist item",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/wishlist
// Clear entire wishlist
export async function PATCH() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Please sign in first" },
        { status: 401 }
      );
    }

    const wishlist =
      await prisma.wishlist.findUnique({
        where: {
          userId: user.id,
        },
      });

    if (!wishlist) {
      return NextResponse.json({
        message: "Wishlist already empty",
      });
    }

    await prisma.wishlistItem.deleteMany({
      where: {
        wishlistId: wishlist.id,
      },
    });

    return NextResponse.json({
      message: "Wishlist cleared",
    });
  } catch (error) {
    console.error(
      "Failed to clear wishlist:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to clear wishlist",
      },
      { status: 500 }
    );
  }
}