/**
 * Test script to verify the scrapers are working
 *
 * Run with: npx tsx scripts/test-scraper.ts
 *
 * Note: Make sure Brave browser is installed at:
 * /Applications/Brave Browser.app/Contents/MacOS/Brave Browser
 */

import { scrapeMedsGo } from "../lib/scrapers/medsgo-scraper";
import { scrapeWatsons } from "../lib/scrapers/watsons-scraper";

async function testMedsGo() {
  console.log("\n🔍 Testing MedsGo scraper...\n");

  try {
    const products = await scrapeMedsGo();

    console.log(`✅ Found ${products.length} products from MedsGo\n`);

    if (products.length > 0) {
      console.log("Sample products:");
      products.slice(0, 5).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   Brand: ${p.brand || "N/A"}`);
        console.log(`   Dosage: ${p.dosage || "N/A"}`);
        console.log(`   Price: ₱${p.price.toLocaleString()}`);
        if (p.originalPrice) {
          console.log(
            `   Original: ₱${p.originalPrice.toLocaleString()} (${
              p.discountPercent
            }% off)`
          );
        }
        console.log(`   In Stock: ${p.inStock}`);
        console.log(`   URL: ${p.url}`);
      });
    }

    return products;
  } catch (error) {
    console.error("❌ MedsGo scraper failed:", error);
    return [];
  }
}

async function testWatsons() {
  console.log("\n🔍 Testing Watsons scraper...\n");

  try {
    const products = await scrapeWatsons();

    console.log(`✅ Found ${products.length} products from Watsons\n`);

    if (products.length > 0) {
      console.log("Sample products:");
      products.slice(0, 5).forEach((p, i) => {
        console.log(`\n${i + 1}. ${p.name}`);
        console.log(`   Brand: ${p.brand || "N/A"}`);
        console.log(`   Dosage: ${p.dosage || "N/A"}`);
        console.log(`   Price: ₱${p.price.toLocaleString()}`);
        if (p.originalPrice) {
          console.log(
            `   Original: ₱${p.originalPrice.toLocaleString()} (${
              p.discountPercent
            }% off)`
          );
        }
        console.log(`   In Stock: ${p.inStock}`);
        console.log(`   URL: ${p.url}`);
      });
    }

    return products;
  } catch (error) {
    console.error("❌ Watsons scraper failed:", error);
    return [];
  }
}

async function main() {
  const args = process.argv.slice(2);
  const testMedsGoOnly = args.includes("--medsgo");
  const testWatsonsOnly = args.includes("--watsons");

  console.log("=".repeat(60));
  console.log("PricingRadar - Scraper Test");
  console.log("=".repeat(60));

  let medsgoProducts: Awaited<ReturnType<typeof testMedsGo>> = [];
  let watsonsProducts: Awaited<ReturnType<typeof testWatsons>> = [];

  if (!testWatsonsOnly) {
    medsgoProducts = await testMedsGo();
  }

  if (!testMedsGoOnly) {
    watsonsProducts = await testWatsons();
  }

  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));

  if (!testWatsonsOnly) {
    console.log(`MedsGo: ${medsgoProducts.length} products`);
  }
  if (!testMedsGoOnly) {
    console.log(`Watsons: ${watsonsProducts.length} products`);
  }
  console.log(
    `Total: ${medsgoProducts.length + watsonsProducts.length} products`
  );
  console.log("=".repeat(60));
}

main().catch(console.error);
