import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(({ headers }) =>
      headers()
    ),
  });

  return session?.user;
}

// GET /api/cart
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(cart ?? { items: [] });
  } catch (error) {
    console.error("Failed to fetch cart:", error);

    return NextResponse.json(
      { message: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart
export async function POST(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      productId,
      quantity = 1,
      size,
      color,
    } = body;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

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

    if (product.stock < quantity) {
      return NextResponse.json(
        { message: "Not enough stock available" },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.upsert({
      where: {
        userId: user.id,
      },
      update: {},
      create: {
        userId: user.id,
      },
    });

    // Find ONLY the exact same product variant.
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        size: size ?? null,
        color: color ?? null,
      },
    });

    let cartItem;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return NextResponse.json(
          { message: "Quantity exceeds available stock" },
          { status: 400 }
        );
      }

      cartItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: newQuantity,
        },
        include: {
          product: true,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          size: size ?? null,
          color: color ?? null,
        },
        include: {
          product: true,
        },
      });
    }

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error("Failed to add to cart:", error);

    return NextResponse.json(
      { message: "Failed to add product to cart" },
      { status: 500 }
    );
  }
}