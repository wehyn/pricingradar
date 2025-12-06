import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ScrapedProduct, MarketplaceType } from "../scrapers/types";

// Database types matching the Supabase schema
export interface DbCompetitor {
  id: string;
  name: string;
  marketplace: MarketplaceType;
  base_url: string;
  category_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProduct {
  id: string;
  competitor_id: string;
  name: string;
  brand: string | null;
  dosage: string | null;
  url: string;
  external_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPriceHistory {
  id: string;
  product_id: string;
  price: number;
  original_price: number | null;
  discount_percent: number | null;
  currency: string;
  in_stock: boolean;
  scraped_at: string;
  scraped_date?: string; // YYYY-MM-DD format for day-based deduplication
}

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "[Supabase] Missing env vars - URL:",
      !!supabaseUrl,
      "KEY:",
      !!supabaseKey
    );
    throw new Error("Missing Supabase environment variables");
  }

  console.log("[Supabase] Client initialized with URL:", supabaseUrl);
  return createClient(supabaseUrl, supabaseKey);
}

// Lazy-initialized client
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = getSupabaseClient();
  }
  return supabaseInstance;
}

// Get a fresh Supabase client (useful when schema cache is stale)
export function getFreshSupabase(): SupabaseClient {
  supabaseInstance = null;
  return getSupabaseClient();
}

// Competitor operations
export async function getCompetitors(): Promise<DbCompetitor[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function getCompetitorByMarketplace(
  marketplace: MarketplaceType
): Promise<DbCompetitor | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("competitors")
    .select("*")
    .eq("marketplace", marketplace)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
  return data;
}

export async function upsertCompetitor(
  competitor: Omit<DbCompetitor, "id" | "created_at" | "updated_at">
): Promise<DbCompetitor> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("competitors")
    .upsert(
      {
        ...competitor,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "marketplace",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Product operations
export async function getProductsByCompetitor(
  competitorId: string
): Promise<DbProduct[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("competitor_id", competitorId)
    .order("name");

  if (error) throw error;
  return data || [];
}

export async function upsertProduct(
  product: Omit<DbProduct, "id" | "created_at" | "updated_at">
): Promise<DbProduct> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .upsert(
      {
        ...product,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "url",
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function findProductByUrl(url: string): Promise<DbProduct | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("url", url)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Price history operations
export async function addPriceHistory(
  entry: Omit<DbPriceHistory, "id">
): Promise<DbPriceHistory> {
  const supabase = getSupabase();

  // Extract date from scraped_at for day-based deduplication
  const scrapedDate = new Date(entry.scraped_at).toISOString().split("T")[0];

  // First, try to check if there's already an entry for today
  const { data: existing } = await supabase
    .from("price_history")
    .select("id")
    .eq("product_id", entry.product_id)
    .gte("scraped_at", `${scrapedDate}T00:00:00.000Z`)
    .lt("scraped_at", `${scrapedDate}T23:59:59.999Z`)
    .limit(1)
    .single();

  if (existing) {
    // Update existing entry for today
    const { data, error } = await supabase
      .from("price_history")
      .update({
        price: entry.price,
        original_price: entry.original_price,
        discount_percent: entry.discount_percent,
        currency: entry.currency,
        in_stock: entry.in_stock,
        scraped_at: entry.scraped_at,
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new entry
    const { data, error } = await supabase
      .from("price_history")
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getPriceHistory(
  productId: string,
  limit: number = 30
): Promise<DbPriceHistory[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("price_history")
    .select("*")
    .eq("product_id", productId)
    .order("scraped_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getLatestPrices(
  competitorId: string
): Promise<Array<DbProduct & { latest_price: DbPriceHistory | null }>> {
  const supabase = getSupabase();

  // Get all products for the competitor
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("competitor_id", competitorId);

  if (productsError) throw productsError;
  if (!products) return [];

  // Get latest price for each product
  const result = await Promise.all(
    products.map(async (product) => {
      const { data: priceHistory } = await supabase
        .from("price_history")
        .select("*")
        .eq("product_id", product.id)
        .order("scraped_at", { ascending: false })
        .limit(1)
        .single();

      return {
        ...product,
        latest_price: priceHistory || null,
      };
    })
  );

  return result;
}

// Save scraped products to database
export async function saveScrapedProducts(
  products: ScrapedProduct[],
  marketplace: MarketplaceType
): Promise<{ saved: number; errors: string[] }> {
  console.log(
    `[Supabase] saveScrapedProducts called for ${marketplace} with ${products.length} products`
  );
  const errors: string[] = [];
  let saved = 0;

  // Ensure competitor exists
  console.log(
    `[Supabase] Looking up competitor for marketplace: ${marketplace}`
  );
  let competitor = await getCompetitorByMarketplace(marketplace);
  console.log(
    `[Supabase] Competitor found:`,
    competitor ? competitor.id : "null"
  );

  if (!competitor) {
    // Create default competitor entry
    const marketplaceNames: Record<MarketplaceType, string> = {
      medsgo: "MedsGo Pharmacy",
      watsons: "Watsons Philippines",
      custom: "Custom Competitor",
    };

    const categoryUrls: Record<MarketplaceType, string> = {
      medsgo: "https://medsgo.ph/prescription-medicines/erectile-dysfunction/",
      watsons:
        "https://www.watsons.com.ph/health-and-rx/erectile-dysfunction-ed-/c/060410",
      custom: "",
    };

    competitor = await upsertCompetitor({
      name: marketplaceNames[marketplace],
      marketplace,
      base_url:
        marketplace === "medsgo"
          ? "https://medsgo.ph"
          : marketplace === "watsons"
          ? "https://www.watsons.com.ph"
          : "",
      category_url: categoryUrls[marketplace],
      enabled: true,
    });
  }

  for (const product of products) {
    try {
      console.log(`[Supabase] Upserting product: ${product.name}`);
      // Upsert product
      const dbProduct = await upsertProduct({
        competitor_id: competitor.id,
        name: product.name,
        brand: product.brand || null,
        dosage: product.dosage || null,
        url: product.url,
        external_id: product.id,
        image_url: product.imageUrl || null,
      });
      console.log(`[Supabase] Product upserted with id: ${dbProduct.id}`);

      // Add price history entry
      await addPriceHistory({
        product_id: dbProduct.id,
        price: product.price,
        original_price: product.originalPrice || null,
        discount_percent: product.discountPercent || null,
        currency: product.currency,
        in_stock: product.inStock,
        scraped_at: product.scrapedAt.toISOString(),
      });
      console.log(
        `[Supabase] Price history added for product: ${dbProduct.id}`
      );

      saved++;
    } catch (error) {
      console.error(`[Supabase] Error saving product ${product.name}:`, error);
      errors.push(
        `Failed to save ${product.name}: ${(error as Error).message}`
      );
    }
  }

  return { saved, errors };
}

// Get all products with their latest prices for dashboard
export async function getAllProductsWithPrices(): Promise<
  Array<{
    product: DbProduct;
    competitor: DbCompetitor;
    latestPrice: DbPriceHistory | null;
    priceHistory: DbPriceHistory[];
  }>
> {
  const supabase = getSupabase();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      *,
      competitors (*),
      price_history (*)
    `
    )
    .order("name");

  if (error) throw error;
  if (!products) return [];

  return products.map(
    (p: { price_history: DbPriceHistory[]; competitors: DbCompetitor }) => {
      const sortedHistory = [...(p.price_history || [])].sort(
        (a, b) =>
          new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
      );

      return {
        product: p as unknown as DbProduct,
        competitor: p.competitors,
        latestPrice: sortedHistory[0] || null,
        priceHistory: sortedHistory.slice(0, 30),
      };
    }
  );
}

// Get all products
export async function getAllProducts(): Promise<DbProduct[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
}

// Get latest price for a product
export async function getLatestPriceForProduct(
  productId: string
): Promise<DbPriceHistory | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("price_history")
    .select("*")
    .eq("product_id", productId)
    .order("scraped_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

// Backfill price history with random variations for demo/historical data
export async function backfillPriceHistory(
  productId: string,
  currentPrice: number,
  days: number = 7
): Promise<{ created: number; errors: string[] }> {
  const supabase = getSupabase();
  const today = new Date();
  let created = 0;
  const errors: string[] = [];

  // First, check if there's already history for this product to avoid duplicates
  const { data: existingHistory } = await supabase
    .from("price_history")
    .select("scraped_at")
    .eq("product_id", productId)
    .order("scraped_at", { ascending: false });

  // Get dates that already have data
  const existingDates = new Set(
    (existingHistory || []).map(
      (h) => new Date(h.scraped_at).toISOString().split("T")[0]
    )
  );

  for (let i = days; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Skip if we already have data for this date
    if (existingDates.has(dateStr)) {
      continue;
    }

    // Add random variation of +/- 5-10%
    const variation = Math.random() * 0.1 - 0.05; // -5% to +5%
    const historicalPrice =
      Math.round(currentPrice * (1 + variation) * 100) / 100;

    try {
      // Use simple insert instead of upsert (no scraped_date column needed)
      const { error } = await supabase.from("price_history").insert({
        product_id: productId,
        price: historicalPrice,
        currency: "PHP",
        in_stock: true,
        scraped_at: date.toISOString(),
      });

      if (error) {
        errors.push(`Day ${i}: ${error.message}`);
      } else {
        created++;
      }
    } catch (err) {
      errors.push(`Day ${i}: ${(err as Error).message}`);
    }
  }

  return { created, errors };
}

// Backfill all products with historical data
export async function backfillAllProductsHistory(days: number = 7): Promise<{
  productsProcessed: number;
  totalCreated: number;
  errors: string[];
}> {
  const products = await getAllProducts();
  let totalCreated = 0;
  const allErrors: string[] = [];

  for (const product of products) {
    const latestPrice = await getLatestPriceForProduct(product.id);
    if (latestPrice) {
      const result = await backfillPriceHistory(
        product.id,
        latestPrice.price,
        days
      );
      totalCreated += result.created;
      if (result.errors.length > 0) {
        allErrors.push(`Product ${product.name}: ${result.errors.join(", ")}`);
      }
    }
  }

  return {
    productsProcessed: products.length,
    totalCreated,
    errors: allErrors,
  };
}
