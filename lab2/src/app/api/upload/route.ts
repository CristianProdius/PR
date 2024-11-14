import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Check if the file is JSON
    if (!(file instanceof File) || !file.type.includes("application/json")) {
      return NextResponse.json({ error: "File must be JSON" }, { status: 400 });
    }

    // Read the file content
    const text = await file.text();
    let products;

    try {
      products = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // Validate the JSON structure
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: "JSON must be an array of products" },
        { status: 400 }
      );
    }

    // Create products in database
    const createdProducts = await Promise.all(
      products.map(async (product) => {
        try {
          return await db.product.create({
            name: product.name,
            price: parseFloat(product.price),
            link: product.link,
            description: product.description,
            availability: product.availability,
            currency: product.currency || "GBP",
          });
        } catch (error) {
          console.error("Error creating product:", error);
          return null;
        }
      })
    );

    // Filter out failed creations
    const successfulProducts = createdProducts.filter((p) => p !== null);

    return NextResponse.json(
      {
        message: "File processed successfully",
        productsCreated: successfulProducts.length,
        products: successfulProducts,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Failed to process file upload" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Upload endpoint ready",
    acceptedTypes: ["application/json"],
    maxSize: "10MB",
  });
}
