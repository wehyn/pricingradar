/**
 * Explore MedsGo page structure using the correct selector: .ut2-gl__item
 * Run with: npx tsx scripts/explore-medsgo.ts
 */

import { chromium } from "playwright";
import fs from "fs";

const BRAVE_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const CHROME_WIN_PATH = `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`;
const CHROME_WIN_PATH_X86 = `C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`;
async function exploreMedsGo() {
  console.log("🚀 Launching browser...\n");

  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";

  const launchOpts: any = { headless: true };
  if (process.env.CHROME_EXECUTABLE) {
    launchOpts.executablePath = process.env.CHROME_EXECUTABLE;
  } else if (isWin) {
    launchOpts.channel = "chrome";
    if (fs.existsSync(CHROME_WIN_PATH)) {
      launchOpts.executablePath = CHROME_WIN_PATH;
      delete launchOpts.channel;
    } else if (fs.existsSync(CHROME_WIN_PATH_X86)) {
      launchOpts.executablePath = CHROME_WIN_PATH_X86;
      delete launchOpts.channel;
    }
  } else if (isMac && fs.existsSync(BRAVE_PATH)) {
    launchOpts.executablePath = BRAVE_PATH;
  } else {
    launchOpts.channel = "chrome";
  }

  const browser = await chromium.launch(launchOpts);

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  console.log("📄 Navigating to MedsGo ED page...\n");
  await page.goto(
    "https://medsgo.ph/prescription-medicines/erectile-dysfunction/",
    { waitUntil: "networkidle", timeout: 60000 }
  );

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Scroll to load lazy content
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  await page.waitForTimeout(2000);

  // Use the correct selector: .ut2-gl__item
  console.log("🎯 Extracting products using .ut2-gl__item selector...\n");

  const products = await page.evaluate(() => {
    const items: Array<{
      name: string;
      currentPrice: number;
      originalPrice: number | null;
      discountPercent: number | null;
      url: string;
      imageUrl: string | null;
      brand: string | null;
      dosage: string | null;
      inStock: boolean;
    }> = [];

    // The main product card selector for MedsGo
    const productCards = document.querySelectorAll(".ut2-gl__item");

    console.log(`Found ${productCards.length} product cards`);

    productCards.forEach((card) => {
      // Get product name from the title/name element
      const nameEl = card.querySelector(
        ".ut2-gl__name a, .product-title a, [class*='name'] a"
      );
      const name = nameEl?.textContent?.trim() || "";

      // Get product URL
      const linkEl = card.querySelector(
        ".ut2-gl__name a, a.product-title, [class*='name'] a"
      ) as HTMLAnchorElement;
      const url = linkEl?.href || "";

      // Get image URL
      const imgEl = card.querySelector(
        ".ut2-gl__image img, img.ty-pict"
      ) as HTMLImageElement;
      const imageUrl = imgEl?.src || imgEl?.getAttribute("data-src") || null;

      // Get prices - look for price elements
      const priceContainer = card.querySelector(
        ".ut2-gl__price, .ty-price-block, [class*='price']"
      );
      const allText = priceContainer?.textContent || card.textContent || "";

      // Extract all prices from text
      const priceRegex = /₱([\d,]+)(?:00)?/g;
      const priceMatches = [...allText.matchAll(priceRegex)];
      const prices = priceMatches.map((m) =>
        parseFloat(m[1].replace(/,/g, ""))
      );

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

      // Calculate discount
      let discountPercent: number | null = null;
      if (originalPrice && currentPrice && originalPrice > currentPrice) {
        discountPercent = Math.round(
          ((originalPrice - currentPrice) / originalPrice) * 100
        );
      }

      // Get brand from the structured data at bottom of card
      const brandEl = card.querySelector(
        '[class*="brand"], .ty-product-feature__value'
      );
      let brand: string | null = null;

      // Try to find brand from the feature list
      const featureItems = card.querySelectorAll(".ut2-pl__feature-item");
      featureItems.forEach((item) => {
        const text = item.textContent || "";
        if (text.includes("Brand")) {
          const valueEl = item.querySelector(
            ".ut2-pl__feature-value, em, span"
          );
          brand = valueEl?.textContent?.trim() || null;
        }
      });

      // Extract brand from card text if not found
      if (!brand) {
        const brandMatch = allText.match(/_Brand_\s*_([^_]+)_/);
        if (brandMatch) brand = brandMatch[1].trim();
      }

      // Get dosage similarly
      let dosage: string | null = null;
      featureItems.forEach((item) => {
        const text = item.textContent || "";
        if (text.includes("Dosage")) {
          const valueEl = item.querySelector(
            ".ut2-pl__feature-value, em, span"
          );
          dosage = valueEl?.textContent?.trim() || null;
        }
      });

      if (!dosage) {
        const dosageMatch = allText.match(/_Dosage_\s*_([^_]+)_/);
        if (dosageMatch) dosage = dosageMatch[1].trim();
      }

      // Also try to extract from product name
      if (!dosage) {
        const dosageFromName = name.match(/(\d+)\s*mg/i);
        if (dosageFromName) dosage = `${dosageFromName[1]}mg`;
      }

      if (!brand) {
        // Common ED medication brands
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

      // Check stock status
      const stockEl = card.querySelector(
        ".ty-qty-in-stock, [class*='stock'], .availability"
      );
      const inStock =
        stockEl?.textContent?.toLowerCase().includes("in stock") ||
        !allText.toLowerCase().includes("out of stock");

      if (name && currentPrice > 0) {
        items.push({
          name,
          currentPrice,
          originalPrice,
          discountPercent,
          url,
          imageUrl,
          brand,
          dosage,
          inStock,
        });
      }
    });

    return items;
  });

  console.log(`✅ Found ${products.length} products:\n`);

  products.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   💰 Price: ₱${p.currentPrice.toLocaleString()}`);
    if (p.originalPrice) {
      console.log(
        `   📉 Original: ₱${p.originalPrice.toLocaleString()} (${
          p.discountPercent
        }% off)`
      );
    }
    console.log(`   🏷️  Brand: ${p.brand || "N/A"}`);
    console.log(`   💊 Dosage: ${p.dosage || "N/A"}`);
    console.log(`   📦 In Stock: ${p.inStock ? "Yes" : "No"}`);
    console.log(`   🔗 URL: ${p.url}`);
    console.log("");
  });

  // Output the selectors for the scraper
  console.log("\n📋 SELECTORS FOR SCRAPER:");
  console.log("========================");
  console.log("Product card: .ut2-gl__item");
  console.log("Product name: .ut2-gl__name a");
  console.log("Product link: .ut2-gl__name a");
  console.log("Product image: .ut2-gl__image img");
  console.log("Price container: .ut2-gl__price");
  console.log("Add to cart: .ty-btn__add-to-cart");
  console.log("Stock status: .ty-qty-in-stock");

  await browser.close();
  console.log("\n✅ Done!");
}

exploreMedsGo().catch(console.error);
