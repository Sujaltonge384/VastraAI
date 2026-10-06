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

// GET /api/orders
// Fetch all orders for the logged-in user
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: user.id,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);

    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders
// Create an order from the user's database cart
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

    const paymentMethod =
      body.paymentMethod === "ONLINE"
        ? "ONLINE"
        : "COD";

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

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { message: "Your cart is empty" },
        { status: 400 }
      );
    }

    for (const item of cart.items) {
      if (item.quantity > item.product.stock) {
        return NextResponse.json(
          {
            message: `${item.product.name} does not have enough stock`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate everything from the database.
    // Never trust prices/totals sent by the frontend.
    const subtotal = cart.items.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    );

    const deliveryFee =
      subtotal >= 1999 ? 0 : 99;

    const total = subtotal + deliveryFee;

    const order = await prisma.$transaction(
      async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId: user.id,
            subtotal,
            deliveryFee,
            total,
            paymentMethod,
            paymentStatus: "PENDING",
            status: "PLACED",

            items: {
              create: cart.items.map((item) => ({
                productId: item.productId,
                name: item.product.name,
                brand: item.product.brand,
                price: item.product.price,
                image: item.product.image,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
              })),
            },
          },

          include: {
            items: true,
          },
        });

        // Reduce product stock
        for (const item of cart.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Empty the user's cart
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
          },
        });

        return newOrder;
      }
    );

    return NextResponse.json(
      order,
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create order:", error);

    return NextResponse.json(
      { message: "Failed to create order" },
      { status: 500 }
    );
  }
}