import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

const BASE_URL = "http://books.toscrape.com/";

async function validatePrice(price: string): Promise<number | null> {
  const priceValue = price.replace(/[£,]/g, "");
  return parseFloat(priceValue) || null;
}

async function validateName(name: string): Promise<boolean> {
  return typeof name === "string" && name.trim().length > 3;
}

async function scrapeProductData(productLink: string) {
  try {
    const response = await axios.get(BASE_URL + productLink);
    const $ = cheerio.load(response.data);

    return {
      description: $('meta[name="description"]').attr("content"),
      availability: $(".instock.availability").text().trim(),
    };
  } catch (error) {
    console.error(`Error scraping product data: ${error}`);
    return { description: null, availability: null };
  }
}

async function main() {
  try {
    await prisma.product.deleteMany();

    const response = await axios.get(BASE_URL);
    const $ = cheerio.load(response.data);

    const productElements = $("article.product_pod").toArray();
    for (const element of productElements) {
      const productElement = $(element);
      const name = productElement.find("h3 a").attr("title");
      const priceText = productElement.find("p.price_color").text();
      const link = productElement.find("h3 a").attr("href");

      if (!name || !priceText || !link) continue;

      const price = await validatePrice(priceText);
      const isValidName = await validateName(name);

      if (isValidName && price) {
        const { description, availability } = await scrapeProductData(link);

        await prisma.product.create({
          data: {
            name,
            price,
            link,
            description: description || undefined,
            availability: availability || undefined,
            currency: "GBP",
          },
        });
      }
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
