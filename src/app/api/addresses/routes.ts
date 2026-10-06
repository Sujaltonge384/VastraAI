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

// GET /api/addresses
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error(
      "Failed to fetch addresses:",
      error
    );

    return NextResponse.json(
      { message: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

// POST /api/addresses
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
      name,
      phone,
      address,
      city,
      state,
      pincode,
    } = body;

    if (
      !name ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return NextResponse.json(
        { message: "All address fields are required" },
        { status: 400 }
      );
    }

    const newAddress = await prisma.address.create({
      data: {
        userId: user.id,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
    });

    return NextResponse.json(
      newAddress,
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Failed to create address:",
      error
    );

    return NextResponse.json(
      { message: "Failed to save address" },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses?id=ADDRESS_ID
export async function DELETE(request: Request) {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } =
      new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Address ID is required" },
        { status: 400 }
      );
    }

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!address) {
      return NextResponse.json(
        { message: "Address not found" },
        { status: 404 }
      );
    }

    await prisma.address.delete({
      where: {
        id: address.id,
      },
    });

    return NextResponse.json({
      message: "Address deleted",
    });
  } catch (error) {
    console.error(
      "Failed to delete address:",
      error
    );

    return NextResponse.json(
      { message: "Failed to delete address" },
      { status: 500 }
    );
  }
}