import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await import("next/headers").then(({ headers }) =>
      headers()
    ),
  });

  return session?.user;
}

// UPDATE QUANTITY
export async function PATCH(request: Request) {
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
      size = null,
      color = null,
      quantity,
    } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        {
          message:
            "Product ID and quantity are required",
        },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found" },
        { status: 404 }
      );
    }

    const cartItem =
      await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          size,
          color,
        },
        include: {
          product: true,
        },
      });

    if (!cartItem) {
      return NextResponse.json(
        { message: "Cart item not found" },
        { status: 404 }
      );
    }

    // Quantity 0 means remove the item
    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: {
          id: cartItem.id,
        },
      });

      return NextResponse.json({
        message: "Item removed",
      });
    }

    if (quantity > cartItem.product.stock) {
      return NextResponse.json(
        {
          message:
            "Requested quantity exceeds available stock",
        },
        { status: 400 }
      );
    }

    const updatedItem =
      await prisma.cartItem.update({
        where: {
          id: cartItem.id,
        },
        data: {
          quantity,
        },
        include: {
          product: true,
        },
      });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(
      "Failed to update cart item:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to update cart item",
      },
      { status: 500 }
    );
  }
}

// DELETE ITEM
export async function DELETE(request: Request) {
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
      size = null,
      color = null,
    } = body;

    const cart = await prisma.cart.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      return NextResponse.json(
        { message: "Cart not found" },
        { status: 404 }
      );
    }

    const cartItem =
      await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId,
          size,
          color,
        },
      });

    if (!cartItem) {
      return NextResponse.json(
        { message: "Cart item not found" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    return NextResponse.json({
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error(
      "Failed to remove cart item:",
      error
    );

    return NextResponse.json(
      {
        message: "Failed to remove cart item",
      },
      { status: 500 }
    );
  }
}