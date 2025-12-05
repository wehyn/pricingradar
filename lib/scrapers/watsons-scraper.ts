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

// Watsons-specific selectors discovered via Playwright exploration
// DOM structure:
// .productContainer.gridMode
//   .productImage > a > e2-product-thumbnail > img
//   .productInfo
//     .productName > a > span (brand) + text
//     .productPrice > .formatted-value (₱277.00)
//     .social-proof (4000+ Sold)
const WATSONS_SELECTORS = {
  // Use productInfo to avoid duplicates (one per product)
  productContainer: ".productInfo",
  productName: ".productName a",
  productPrice: ".productPrice .formatted-value",
  productImage: ".productImage img, .productImage e2-media img",
  socialProof: ".social-proof",
  productLink: ".productName a",
  brandSpan: ".productName a span", // Brand is often in a span
};

export class WatsonsScraper extends BaseScraper {
  constructor(options: Partial<ScraperOptions> = {}) {
    super("watsons", options);
  }

  async scrapeCategory(url: string): Promise<ScrapedProduct[]> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call init() first.");
    }

    console.log(`[Watsons] Navigating to: ${url}`);

    // Use domcontentloaded as Watsons is slow to fully load
    await this.page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for dynamic content to load (Watsons uses Angular)
    console.log("[Watsons] Waiting for dynamic content...");
    await sleep(8000);

    // Try to wait for product containers
    try {
      await this.page.waitForSelector(".productInfo, .productContainer", {
        timeout: 10000,
      });
    } catch {
      console.warn(
        "[Watsons] Product containers not found immediately, scrolling..."
      );
    }

    // Scroll to load lazy content
    await this.scrollToBottom();
    await sleep(3000);

    console.log("[Watsons] Extracting product data...");

    // Extract product data using the discovered Watsons selectors
    const products = await this.page.evaluate((selectors) => {
      const items: Array<{
        name: string;
        currentPrice: number;
        originalPrice: number | null;
        url: string;
        imageUrl: string | null;
        brand: string | null;
        dosage: string | null;
        soldCount: string | null;
        inStock: boolean;
      }> = [];

      // Find all .productInfo containers (one per product)
      const productInfos = document.querySelectorAll(
        selectors.productContainer
      );

      productInfos.forEach((info) => {
        // Get product name from .productName a
        const nameEl = info.querySelector(selectors.productName);
        const fullName = nameEl?.textContent?.trim() || "";

        if (!fullName || fullName.length < 3) return;

        // Get brand from span inside the link (Watsons puts brand in <span>)
        const brandSpan = info.querySelector(selectors.brandSpan);
        let brand = brandSpan?.textContent?.trim() || null;

        // Get product URL
        const linkEl = info.querySelector(
          selectors.productLink
        ) as HTMLAnchorElement;
        const url = linkEl?.href || "";

        // Get price from .productPrice .formatted-value
        const priceEl = info.querySelector(selectors.productPrice);
        const priceText = priceEl?.textContent?.trim() || "";

        // Parse price - format is "₱277.00"
        const priceMatch = priceText.match(/₱([\d,]+\.?\d*)/);
        const currentPrice = priceMatch
          ? parseFloat(priceMatch[1].replace(/,/g, ""))
          : 0;

        if (currentPrice <= 0) return;

        // Check for original/crossed-out price (sale items)
        const originalPriceEl = info.querySelector(
          ".was-price, .original-price, .crossed-price, del, s, .strikethrough"
        );
        let originalPrice: number | null = null;
        if (originalPriceEl) {
          const origMatch =
            originalPriceEl.textContent?.match(/₱([\d,]+\.?\d*)/);
          if (origMatch) {
            originalPrice = parseFloat(origMatch[1].replace(/,/g, ""));
          }
        }

        // Get image URL from parent .productContainer
        const productContainer = info.closest(".productContainer");
        const imgEl = productContainer?.querySelector(
          selectors.productImage
        ) as HTMLImageElement;
        const imageUrl = imgEl?.src || imgEl?.getAttribute("data-src") || null;

        // Get sold count from .social-proof
        const socialEl = info.querySelector(selectors.socialProof);
        const soldCount = socialEl?.textContent?.trim() || null;

        // Extract dosage (e.g., "5 mg", "50mg", "100 mg")
        let dosage: string | null = null;
        const dosageMatch = fullName.match(/(\d+)\s*mg/i);
        if (dosageMatch) {
          dosage = `${dosageMatch[1]}mg`;
        }

        // If brand not found in span, try to extract from known brands
        if (!brand) {
          const knownBrands = [
            "CIALIS",
            "VIAGRA",
            "TIGERFIL",
            "ZILDEN",
            "LEVITRA",
          ];
          for (const b of knownBrands) {
            if (fullName.toUpperCase().includes(b)) {
              brand = b;
              break;
            }
          }
        }

        // Check stock status
        const outOfStock =
          info.textContent?.toLowerCase().includes("out of stock") ||
          productContainer?.textContent?.toLowerCase().includes("out of stock");
        const inStock = !outOfStock;

        // Avoid duplicates by URL
        if (url && items.some((item) => item.url === url)) return;

        items.push({
          name: fullName,
          currentPrice,
          originalPrice,
          url,
          imageUrl,
          brand,
          dosage,
          soldCount,
          inStock,
        });
      });

      return items;
    }, WATSONS_SELECTORS);

    console.log(`[Watsons] Found ${products.length} products`);

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
        marketplace: "watsons",
        scrapedAt: new Date(),
      });
    }

    return scrapedProducts;
  }
}

// Factory function
export function createWatsonsScraper(
  options?: Partial<ScraperOptions>
): WatsonsScraper {
  return new WatsonsScraper(options);
}

// Convenience function for one-off scrape
export async function scrapeWatsons(
  url: string = "https://www.watsons.com.ph/health-and-rx/erectile-dysfunction-ed-/c/060410",
  options?: Partial<ScraperOptions>
): Promise<ScrapedProduct[]> {
  const scraper = createWatsonsScraper(options);
  const result = await scraper.run(url);

  if (!result.success) {
    console.error("[Watsons] Scraping failed:", result.errors);
  }

  return result.products;
}
