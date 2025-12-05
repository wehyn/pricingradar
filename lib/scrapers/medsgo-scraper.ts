import { BaseScraper, ScraperOptions } from "./base-scraper";
import { ScrapedProduct } from "./types";
import {
  generateId,
  calculateDiscount,
  extractBrand,
  extractDosage,
  cleanProductName,
  sleep,
} from "./index";

// MedsGo-specific selectors discovered via Playwright exploration
const MEDSGO_SELECTORS = {
  productCard: ".ut2-gl__item",
  productName: ".ut2-gl__name a",
  productLink: ".ut2-gl__name a",
  productImage: ".ut2-gl__image img",
  priceContainer: ".ut2-gl__price",
  addToCart: ".ty-btn__add-to-cart",
  stockStatus: ".ty-qty-in-stock",
};

export class MedsGoScraper extends BaseScraper {
  constructor(options: Partial<ScraperOptions> = {}) {
    super("medsgo", options);
  }

  async scrapeCategory(url: string): Promise<ScrapedProduct[]> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call init() first.");
    }

    console.log(`[MedsGo] Navigating to: ${url}`);
    await this.navigateTo(url);

    // Wait for product content to load
    await sleep(3000);

    // Wait for the product grid to appear
    try {
      await this.page.waitForSelector(MEDSGO_SELECTORS.productCard, {
        timeout: 10000,
      });
    } catch {
      console.warn("[MedsGo] Product cards not found, trying to scroll...");
    }

    // Scroll to load any lazy content
    await this.scrollToBottom();
    await sleep(2000);

    console.log("[MedsGo] Extracting product data...");

    // Extract product data using the correct MedsGo selectors
    const products = await this.page.evaluate((selectors) => {
      const items: Array<{
        name: string;
        currentPrice: number;
        originalPrice: number | null;
        url: string;
        imageUrl: string | null;
        brand: string | null;
        dosage: string | null;
        inStock: boolean;
      }> = [];

      const productCards = document.querySelectorAll(selectors.productCard);

      productCards.forEach((card) => {
        // Get product name
        const nameEl = card.querySelector(selectors.productName);
        const name = nameEl?.textContent?.trim() || "";

        // Get product URL
        const linkEl = card.querySelector(
          selectors.productLink
        ) as HTMLAnchorElement;
        const url = linkEl?.href || "";

        // Get image URL
        const imgEl = card.querySelector(
          selectors.productImage
        ) as HTMLImageElement;
        const imageUrl = imgEl?.src || imgEl?.getAttribute("data-src") || null;

        // Get prices from the price container
        const priceContainer = card.querySelector(selectors.priceContainer);
        const allText = priceContainer?.textContent || card.textContent || "";

        // MedsGo prices are in format ₱X,XXX00 (no decimal point, last 2 digits are cents)
        // Extract all price patterns
        const priceRegex = /₱([\d,]+)/g;
        const priceMatches = [...allText.matchAll(priceRegex)];
        const prices = priceMatches.map((m) => {
          const rawPrice = m[1].replace(/,/g, "");
          // Convert to actual price (divide by 100 as prices appear to be in centavos)
          return parseFloat(rawPrice) / 100;
        });

        // Determine current vs original price
        let currentPrice = 0;
        let originalPrice: number | null = null;

        if (prices.length >= 2) {
          // Usually: original (higher) comes first, then sale price (lower)
          const sorted = [...prices].sort((a, b) => b - a);
          originalPrice = sorted[0];
          currentPrice = sorted[1];
        } else if (prices.length === 1) {
          currentPrice = prices[0];
        }

        // Check stock status
        const stockEl = card.querySelector(selectors.stockStatus);
        const inStock =
          stockEl?.textContent?.toLowerCase().includes("in stock") ||
          !allText.toLowerCase().includes("out of stock");

        // Try to extract brand from feature items in the card
        let brand: string | null = null;
        let dosage: string | null = null;

        // Check for feature items with brand/dosage
        const featureItems = card.querySelectorAll(".ut2-pl__feature-item");
        featureItems.forEach((item) => {
          const text = item.textContent || "";
          if (text.includes("Brand")) {
            const valueEl = item.querySelector(
              "em, span, .ut2-pl__feature-value"
            );
            brand = valueEl?.textContent?.trim() || null;
          }
          if (text.includes("Dosage")) {
            const valueEl = item.querySelector(
              "em, span, .ut2-pl__feature-value"
            );
            dosage = valueEl?.textContent?.trim() || null;
          }
        });

        // Fallback: extract from _Brand_ _Value_ pattern in text
        if (!brand) {
          const brandMatch = allText.match(/_Brand_\s*_([^_]+)_/);
          if (brandMatch) brand = brandMatch[1].trim();
        }

        if (!dosage) {
          const dosageMatch = allText.match(/_Dosage_\s*_([^_]+)_/);
          if (dosageMatch) dosage = dosageMatch[1].trim();
        }

        // Extract dosage from product name if not found
        if (!dosage) {
          const dosageFromName = name.match(/(\d+)\s*mg/i);
          if (dosageFromName) dosage = `${dosageFromName[1]}mg`;
        }

        // Extract brand from product name if not found
        if (!brand) {
          const brands = [
            "VIAGRA",
            "CIALIS",
            "Erecfil",
            "Erecto",
            "Spiagra",
            "Dalafil",
            "RETAFIL",
            "VIVAX",
            "CALIBERI",
          ];
          for (const b of brands) {
            if (name.toUpperCase().includes(b.toUpperCase())) {
              brand = b;
              break;
            }
          }
        }

        if (name && currentPrice > 0) {
          items.push({
            name,
            currentPrice,
            originalPrice,
            url,
            imageUrl,
            brand,
            dosage,
            inStock,
          });
        }
      });

      return items;
    }, MEDSGO_SELECTORS);

    console.log(`[MedsGo] Found ${products.length} products`);

    // Transform to ScrapedProduct format
    const scrapedProducts: ScrapedProduct[] = [];

    for (const product of products) {
      const name = cleanProductName(product.name);

      const discountPercent =
        product.originalPrice &&
        product.currentPrice &&
        product.originalPrice > product.currentPrice
          ? calculateDiscount(product.originalPrice, product.currentPrice)
          : undefined;

      scrapedProducts.push({
        id: generateId(),
        name,
        brand: product.brand || extractBrand(name),
        dosage: product.dosage || extractDosage(name),
        price: product.currentPrice,
        originalPrice: product.originalPrice || undefined,
        discountPercent,
        currency: "PHP",
        url: product.url,
        imageUrl: product.imageUrl || undefined,
        inStock: product.inStock,
        marketplace: "medsgo",
        scrapedAt: new Date(),
      });
    }

    return scrapedProducts;
  }
}

// Factory function
export function createMedsGoScraper(
  options?: Partial<ScraperOptions>
): MedsGoScraper {
  return new MedsGoScraper(options);
}

// Convenience function for one-off scrape
export async function scrapeMedsGo(
  url: string = "https://medsgo.ph/prescription-medicines/erectile-dysfunction/",
  options?: Partial<ScraperOptions>
): Promise<ScrapedProduct[]> {
  const scraper = createMedsGoScraper(options);
  const result = await scraper.run(url);

  if (!result.success) {
    console.error("[MedsGo] Scraping failed:", result.errors);
  }

  return result.products;
}
