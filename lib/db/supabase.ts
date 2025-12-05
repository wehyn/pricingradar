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
  const { data, error } = await supabase
    .from("price_history")
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
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
