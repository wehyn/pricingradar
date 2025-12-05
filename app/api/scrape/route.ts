import { NextRequest, NextResponse } from "next/server";
import { MarketplaceType, ScrapedProduct } from "@/lib/scrapers/types";
import { ED_CATEGORY_URLS } from "@/lib/scrapers/marketplaces";
import { scrapeMedsGo } from "@/lib/scrapers/medsgo-scraper";
import { scrapeWatsons } from "@/lib/scrapers/watsons-scraper";
import { saveScrapedProducts } from "@/lib/db/supabase";

export const maxDuration = 120; // Allow up to 120 seconds for scraping
export const dynamic = "force-dynamic";

interface ScrapeRequest {
  marketplace: MarketplaceType | "all";
  saveToDb?: boolean;
  includeProducts?: boolean; // Whether to return full product data
}

interface ScrapeResponse {
  success: boolean;
  results: Array<{
    marketplace: MarketplaceType;
    productsScraped: number;
    savedToDb: number;
    errors?: string[];
    duration: number;
    products?: ScrapedProduct[]; // Include products if requested
  }>;
  totalProducts: number;
  totalDuration: number;
  allProducts?: ScrapedProduct[]; // All products combined
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ScrapeResponse>> {
  const startTime = Date.now();

  try {
    const body: ScrapeRequest = await request.json();
    const {
      marketplace = "all",
      saveToDb = true,
      includeProducts = true,
    } = body;

    const results: ScrapeResponse["results"] = [];
    const allProducts: ScrapedProduct[] = [];
    let totalProducts = 0;

    // Determine which marketplaces to scrape
    const marketplacesToScrape: MarketplaceType[] =
      marketplace === "all" ? ["medsgo", "watsons"] : [marketplace];

    // Scrape each marketplace
    for (const mp of marketplacesToScrape) {
      const mpStartTime = Date.now();
      let productsScraped = 0;
      let savedToDbCount = 0;
      const errors: string[] = [];
      let products: ScrapedProduct[] = [];

      try {
        const url = ED_CATEGORY_URLS[mp as keyof typeof ED_CATEGORY_URLS];

        if (!url) {
          errors.push(`No category URL configured for ${mp}`);
          continue;
        }

        // Run the appropriate scraper
        if (mp === "medsgo") {
          products = await scrapeMedsGo(url);
        } else if (mp === "watsons") {
          products = await scrapeWatsons(url);
        } else {
          errors.push(`Unknown marketplace: ${mp}`);
          continue;
        }

        productsScraped = products.length;
        totalProducts += productsScraped;

        // Add to all products
        if (includeProducts) {
          allProducts.push(...products);
        }

        // Save to database if requested
        if (saveToDb && products.length > 0) {
          try {
            const saveResult = await saveScrapedProducts(products, mp);
            savedToDbCount = saveResult.saved;
            if (saveResult.errors.length > 0) {
              errors.push(...saveResult.errors);
            }
          } catch (dbError) {
            errors.push(`Database error: ${(dbError as Error).message}`);
          }
        }
      } catch (error) {
        errors.push(`Scraping error: ${(error as Error).message}`);
      }

      results.push({
        marketplace: mp,
        productsScraped,
        savedToDb: savedToDbCount,
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - mpStartTime,
        products: includeProducts ? products : undefined,
      });
    }

    const totalDuration = Date.now() - startTime;
    const success = results.some((r) => r.productsScraped > 0);

    return NextResponse.json({
      success,
      results,
      totalProducts,
      totalDuration,
      allProducts: includeProducts ? allProducts : undefined,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        results: [],
        totalProducts: 0,
        totalDuration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check scraper status
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: "ready",
    supportedMarketplaces: ["medsgo", "watsons"],
    categoryUrls: ED_CATEGORY_URLS,
  });
}
