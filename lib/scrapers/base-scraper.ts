import { chromium, Browser, Page, BrowserContext } from "playwright";
import { ScrapedProduct, MarketplaceType, ScrapeResult } from "./types";
import { sleep } from "./index";

// Brave browser executable path for macOS
const BRAVE_PATH =
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";

// Scraper configuration
export interface ScraperOptions {
  headless?: boolean;
  timeout?: number;
  delayBetweenRequests?: number;
  userAgent?: string;
}

// Realistic user agent to avoid bot detection
const REALISTIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_OPTIONS: ScraperOptions = {
  headless: true,
  timeout: 60000, // Increased timeout for slow sites
  delayBetweenRequests: 2000, // 2 seconds between requests for ethical scraping
  userAgent: REALISTIC_USER_AGENT,
};

// Base scraper class
export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected context: BrowserContext | null = null;
  protected page: Page | null = null;
  protected options: ScraperOptions;
  protected marketplace: MarketplaceType;

  constructor(
    marketplace: MarketplaceType,
    options: Partial<ScraperOptions> = {}
  ) {
    this.marketplace = marketplace;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Initialize browser
  async init(): Promise<void> {
    this.browser = await chromium.launch({
      executablePath: BRAVE_PATH,
      headless: this.options.headless,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    this.context = await this.browser.newContext({
      userAgent: this.options.userAgent,
      viewport: { width: 1280, height: 720 },
      locale: "en-PH",
      // Additional headers to appear more like a real browser
      extraHTTPHeaders: {
        "Accept-Language": "en-PH,en-US;q=0.9,en;q=0.8",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.options.timeout!);

    // Remove webdriver property to avoid bot detection
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });
  }

  // Close browser
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Navigate to URL with retry logic
  async navigateTo(
    url: string,
    retries: number = 3,
    waitUntil: "load" | "domcontentloaded" | "networkidle" = "domcontentloaded"
  ): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call init() first.");
    }

    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        await this.page.goto(url, {
          waitUntil,
          timeout: this.options.timeout,
        });
        return;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Navigation attempt ${i + 1} failed:`, error);
        if (i < retries - 1) {
          await sleep(this.options.delayBetweenRequests!);
        }
      }
    }

    throw lastError || new Error("Navigation failed after retries");
  }

  // Wait for content to load
  async waitForContent(selector: string, timeout?: number): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not initialized. Call init() first.");
    }

    await this.page.waitForSelector(selector, {
      timeout: timeout || this.options.timeout,
      state: "visible",
    });
  }

  // Scroll to load lazy content
  async scrollToBottom(): Promise<void> {
    if (!this.page) return;

    await this.page.evaluate(async () => {
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

    // Wait for any lazy-loaded content
    await sleep(1000);
  }

  // Take screenshot for debugging
  async takeScreenshot(path: string): Promise<void> {
    if (!this.page) return;
    await this.page.screenshot({ path, fullPage: true });
  }

  // Abstract method to be implemented by site-specific scrapers
  abstract scrapeCategory(url: string): Promise<ScrapedProduct[]>;

  // Run scraper and return results
  async run(url: string): Promise<ScrapeResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let products: ScrapedProduct[] = [];

    try {
      await this.init();
      products = await this.scrapeCategory(url);
    } catch (error) {
      errors.push((error as Error).message);
    } finally {
      await this.close();
    }

    return {
      success: errors.length === 0,
      marketplace: this.marketplace,
      productsScraped: products.length,
      products,
      errors: errors.length > 0 ? errors : undefined,
      scrapedAt: new Date(),
      duration: Date.now() - startTime,
    };
  }
}

// Helper to create a one-off scrape without managing browser lifecycle
export async function scrapeWithBrowser<T>(
  callback: (page: Page) => Promise<T>,
  options: Partial<ScraperOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const browser = await chromium.launch({
    executablePath: BRAVE_PATH,
    headless: opts.headless,
  });

  const context = await browser.newContext({
    userAgent: opts.userAgent,
    viewport: { width: 1280, height: 720 },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(opts.timeout!);

  try {
    return await callback(page);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}
