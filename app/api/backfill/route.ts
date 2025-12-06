import { NextResponse } from "next/server";
import {
  getAllProducts,
  getLatestPriceForProduct,
  backfillPriceHistory,
  getFreshSupabase,
} from "@/lib/db/supabase";

export const maxDuration = 120; // Allow up to 120 seconds for backfill
export const dynamic = "force-dynamic";

interface BackfillResponse {
  success: boolean;
  productsProcessed: number;
  totalCreated: number;
  errors?: string[];
  message: string;
}

// Helper to wait
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// POST /api/backfill - Generate historical data for all products
export async function POST(): Promise<NextResponse<BackfillResponse>> {
  try {
    console.log("[Backfill] Starting historical data generation...");

    // Reset Supabase client to get fresh connection
    getFreshSupabase();

    // Get all products first with retry logic
    let products;
    let retries = 3;

    while (retries > 0) {
      try {
        products = await getAllProducts();
        console.log(`[Backfill] Found ${products.length} products`);
        break;
      } catch (err) {
        retries--;
        console.error(
          `[Backfill] Failed to get products (${retries} retries left):`,
          err
        );
        if (retries === 0) {
          return NextResponse.json(
            {
              success: false,
              productsProcessed: 0,
              totalCreated: 0,
              errors: [
                `Failed to get products after retries: ${
                  (err as Error).message
                }`,
              ],
              message:
                "Failed to fetch products from database. Please check your Supabase connection.",
            },
            { status: 500 }
          );
        }
        // Wait before retrying
        await sleep(2000);
        getFreshSupabase();
      }
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        productsProcessed: 0,
        totalCreated: 0,
        message:
          "No products found in database. Please run a scrape first with saveToDb=true.",
      });
    }

    let totalCreated = 0;
    const allErrors: string[] = [];

    for (const product of products) {
      try {
        const latestPrice = await getLatestPriceForProduct(product.id);
        if (latestPrice) {
          console.log(
            `[Backfill] Processing ${product.name} with price ${latestPrice.price}`
          );
          const result = await backfillPriceHistory(
            product.id,
            latestPrice.price,
            7
          );
          totalCreated += result.created;
          if (result.errors.length > 0) {
            allErrors.push(
              `Product ${product.name}: ${result.errors.join(", ")}`
            );
          }
        } else {
          console.log(`[Backfill] Skipping ${product.name} - no price history`);
        }
      } catch (err) {
        allErrors.push(`Product ${product.name}: ${(err as Error).message}`);
      }

      // Small delay between products to avoid rate limiting
      await sleep(100);
    }

    console.log(
      `[Backfill] Completed: ${products.length} products processed, ${totalCreated} history entries created`
    );

    return NextResponse.json({
      success: true,
      productsProcessed: products.length,
      totalCreated,
      errors: allErrors.length > 0 ? allErrors : undefined,
      message: `Successfully generated ${totalCreated} historical entries for ${products.length} products`,
    });
  } catch (error) {
    console.error("[Backfill] Error:", error);
    return NextResponse.json(
      {
        success: false,
        productsProcessed: 0,
        totalCreated: 0,
        errors: [(error as Error).message],
        message: "Failed to backfill historical data",
      },
      { status: 500 }
    );
  }
}

// GET /api/backfill - Check backfill status
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ready",
    description:
      "POST to this endpoint to generate 7 days of historical price data for all products",
    note: "Historical prices will have +/- 5% random variation from current prices",
  });
}
