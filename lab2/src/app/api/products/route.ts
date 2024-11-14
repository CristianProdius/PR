import { db } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await db.product.create(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Filter parameters
    const name = searchParams.get("name");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const currency = searchParams.get("currency");
    const availability = searchParams.get("availability");

    // Handle different types of queries with pagination
    if (name) {
      const result = await db.product.findByNamePaginated(name, page, pageSize);
      return NextResponse.json(result);
    }

    if (minPrice || maxPrice || currency || availability) {
      const filter = {
        ...(minPrice && { minPrice: parseFloat(minPrice) }),
        ...(maxPrice && { maxPrice: parseFloat(maxPrice) }),
        ...(currency && { currency }),
        ...(availability && { availability }),
      };
      const result = await db.product.findFilteredPaginated(
        filter,
        page,
        pageSize
      );
      return NextResponse.json(result);
    }

    // Default paginated response
    const result = await db.product.findWithPagination(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
