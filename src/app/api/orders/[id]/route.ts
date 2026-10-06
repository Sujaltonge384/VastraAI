import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

async function getUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user;
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    const order = await prisma.order.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(
      "Failed to fetch order:",
      error
    );

    return NextResponse.json(
      { message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}