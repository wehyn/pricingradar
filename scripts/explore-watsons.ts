/**
 * Exploration script for Watsons website to discover the correct selectors
 * Run with: npx tsx scripts/explore-watsons.ts
 */

import { chromium } from "playwright";
import fs from "fs";

const BRAVE_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
const CHROME_WIN_PATH = `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`;
const CHROME_WIN_PATH_X86 = `C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe`;
async function exploreWatsons() {
  console.log("=".repeat(60));
  console.log("Exploring Watsons ED Page Structure");
  console.log("=".repeat(60));

  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";

  const launchOpts: any = { headless: false };
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
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    locale: "en-PH",
  });

  const page = await context.newPage();

  try {
    console.log("\n📍 Navigating to Watsons ED page...");
    await page.goto(
      "https://www.watsons.com.ph/health-and-rx/erectile-dysfunction-ed-/c/060410",
      {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      }
    );

    console.log("⏳ Waiting for dynamic content to load...");
    await page.waitForTimeout(10000);

    // Take screenshot before scrolling
    await page.screenshot({
      path: "watsons-before-scroll.png",
      fullPage: false,
    });
    console.log("📸 Screenshot saved: watsons-before-scroll.png");

    // Scroll down to load more content
    console.log("📜 Scrolling to load lazy content...");
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 500);
        await new Promise((r) => setTimeout(r, 500));
      }
    });

    await page.waitForTimeout(3000);

    // Take screenshot after scrolling
    await page.screenshot({ path: "watsons-after-scroll.png", fullPage: true });
    console.log("📸 Screenshot saved: watsons-after-scroll.png");

    // Get page title
    const title = await page.title();
    console.log(`\n📄 Page Title: ${title}`);

    // Get current URL
    const currentUrl = page.url();
    console.log(`🔗 Current URL: ${currentUrl}`);

    // Explore the DOM structure
    console.log("\n🔍 Exploring DOM structure...\n");

    const exploration = await page.evaluate(() => {
      const results: {
        foundSelectors: string[];
        productContainers: number;
        sampleProducts: Array<{
          name: string;
          price: string;
          url: string;
          classes: string;
        }>;
        allClasses: string[];
        relevantHtml: string;
      } = {
        foundSelectors: [],
        productContainers: 0,
        sampleProducts: [],
        allClasses: [],
        relevantHtml: "",
      };

      // Try various selectors that might contain products
      const selectorsToTry = [
        // Common product container patterns
        ".productContainer",
        ".product-container",
        ".productInfo",
        ".product-info",
        ".product-item",
        ".productItem",
        ".product-tile",
        ".productTile",
        ".product-card",
        ".productCard",
        // Angular-specific patterns
        "cx-product-list-item",
        "app-product-list-item",
        "[data-product]",
        // Grid/list patterns
        ".product-grid-item",
        ".grid-item",
        ".listing-item",
        // Generic patterns with 'product' in class
        '[class*="product"]',
        '[class*="Product"]',
        // Price-based detection
        '[class*="price"]',
        '[class*="Price"]',
      ];

      for (const selector of selectorsToTry) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          results.foundSelectors.push(`${selector}: ${elements.length} found`);
        }
      }

      // Try to find product containers more generically
      const allElements = document.querySelectorAll("*");
      const classSet = new Set<string>();

      allElements.forEach((el) => {
        const classes = el.className;
        if (typeof classes === "string" && classes.includes("product")) {
          classes.split(" ").forEach((c) => {
            if (c.toLowerCase().includes("product")) {
              classSet.add(c);
            }
          });
        }
      });

      results.allClasses = Array.from(classSet);

      // Look for product info containers
      const productInfos = document.querySelectorAll(
        ".productInfo, .product-info, [class*='productInfo']"
      );
      results.productContainers = productInfos.length;

      // Try to extract sample products
      const containers = document.querySelectorAll(
        ".productInfo, .productContainer, [class*='product-item'], [class*='productItem']"
      );

      containers.forEach((container, index) => {
        if (index >= 5) return; // Only first 5

        const nameEl = container.querySelector(
          ".productName, [class*='name'], h2, h3, a"
        );
        const priceEl = container.querySelector(
          ".productPrice, [class*='price'], [class*='Price']"
        );
        const linkEl = container.querySelector("a[href]") as HTMLAnchorElement;

        if (nameEl || priceEl) {
          results.sampleProducts.push({
            name: nameEl?.textContent?.trim() || "N/A",
            price: priceEl?.textContent?.trim() || "N/A",
            url: linkEl?.href || "N/A",
            classes: container.className || "N/A",
          });
        }
      });

      // If no products found, look at the overall page structure
      if (results.sampleProducts.length === 0) {
        // Find anything with ₱ in it
        const priceElements = Array.from(document.querySelectorAll("*")).filter(
          (el) => el.textContent?.includes("₱") && el.children.length === 0
        );

        priceElements.slice(0, 10).forEach((el) => {
          const parent =
            el.closest('[class*="product"]') ||
            el.closest("a")?.closest("div") ||
            el.parentElement;
          const nameEl = parent?.querySelector("a, h2, h3, [class*='name']");

          results.sampleProducts.push({
            name: nameEl?.textContent?.trim()?.substring(0, 100) || "N/A",
            price: el.textContent?.trim() || "N/A",
            url:
              (
                parent?.querySelector("a[href*='/p/']") as HTMLAnchorElement
              )?.href?.substring(0, 100) || "N/A",
            classes:
              parent?.className?.substring(0, 100) ||
              el.className?.substring(0, 100) ||
              "N/A",
          });
        });
      }

      // Get relevant HTML snippet
      const mainContent =
        document.querySelector("main, .main-content, #content, [role='main']")
          ?.innerHTML || "";
      results.relevantHtml = mainContent.substring(0, 2000);

      return results;
    });

    console.log("Found Selectors:");
    exploration.foundSelectors.forEach((s) => console.log(`  ✓ ${s}`));

    console.log(
      `\nProduct-related classes found: ${exploration.allClasses.length}`
    );
    exploration.allClasses.slice(0, 20).forEach((c) => console.log(`  • ${c}`));

    console.log(`\nProduct containers found: ${exploration.productContainers}`);

    console.log("\nSample Products:");
    exploration.sampleProducts.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.name.substring(0, 80)}`);
      console.log(`   Price: ${p.price}`);
      console.log(`   URL: ${p.url.substring(0, 80)}`);
      console.log(`   Classes: ${p.classes.substring(0, 80)}`);
    });

    // Log raw HTML structure for debugging
    console.log("\n\n📄 Sample HTML structure (first 1500 chars):");
    console.log(exploration.relevantHtml.substring(0, 1500));

    // Also try to get the full outer HTML of a product container
    const sampleProductHtml = await page.evaluate(() => {
      const container = document.querySelector(
        ".productInfo, .productContainer, [class*='product-item']"
      );
      return container?.outerHTML?.substring(0, 2000) || "No container found";
    });

    console.log("\n\n📦 Sample Product Container HTML:");
    console.log(sampleProductHtml);

    // Wait for user to see the browser
    console.log("\n⏳ Keeping browser open for 10 seconds for inspection...");
    await page.waitForTimeout(10000);
  } catch (error) {
    console.error("Error:", error);

    // Take error screenshot
    await page.screenshot({ path: "watsons-error.png", fullPage: true });
    console.log("📸 Error screenshot saved: watsons-error.png");
  } finally {
    await browser.close();
    console.log("\n✅ Browser closed");
  }
}

exploreWatsons().catch(console.error);
