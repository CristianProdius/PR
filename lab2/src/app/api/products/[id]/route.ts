import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const product = await db.product.findById(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: product,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();

    // Validate if product exists
    const existingProduct = await db.product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await db.product.update(id, body);
    return NextResponse.json({
      data: product,
      metadata: {
        timestamp: new Date().toISOString(),
        message: "Product updated successfully",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Validate if product exists
    const existingProduct = await db.product.findById(id);
    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.product.delete(id);
    return NextResponse.json(
      {
        metadata: {
          timestamp: new Date().toISOString(),
          message: "Product deleted successfully",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 400 }
    );
  }
}
