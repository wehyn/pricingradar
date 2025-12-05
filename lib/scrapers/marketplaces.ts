import { MarketplaceConfig, MarketplaceType } from "./types";

// Marketplace configurations with CSS selectors for scraping
export const MARKETPLACE_CONFIGS: Record<MarketplaceType, MarketplaceConfig> = {
  medsgo: {
    id: "medsgo",
    name: "MedsGo",
    baseUrl: "https://medsgo.ph",
    icon: "💊",
    enabled: true,
    selectors: {
      // MedsGo product card selectors based on their HTML structure
      productCard: '.product-card, [class*="product-item"], .catalog-item',
      productName: '.product-card__title, [class*="product-name"], h3, h4',
      price:
        '.product-card__price--current, [class*="price-current"], [class*="sale-price"]',
      originalPrice:
        '.product-card__price--old, [class*="price-old"], [class*="original-price"], del',
      brand: '[class*="brand"], .product-brand',
      dosage: '[class*="dosage"], .product-dosage',
      imageUrl: '.product-card__image img, [class*="product-image"] img',
      inStock: '.product-card__stock, [class*="in-stock"], .stock-status',
      productLink: 'a[href*="/product"], .product-card a, a.product-link',
    },
  },
  watsons: {
    id: "watsons",
    name: "Watsons",
    baseUrl: "https://www.watsons.com.ph",
    icon: "🏪",
    enabled: true,
    selectors: {
      // Watsons product card selectors
      productCard: '.product-tile, [class*="product-item"], .plp-product-card',
      productName:
        '.product-tile__name, [class*="product-name"], .product-title',
      price: '.product-tile__price--current, [class*="price"], .selling-price',
      originalPrice:
        '.product-tile__price--was, [class*="was-price"], .original-price, del',
      brand: '.product-tile__brand, [class*="brand"]',
      dosage: '[class*="dosage"], [class*="variant"]',
      imageUrl: '.product-tile__image img, [class*="product-image"] img',
      inStock: '[class*="in-stock"], .availability',
      productLink: 'a[href*="/p/"], .product-tile a',
    },
  },
  custom: {
    id: "custom",
    name: "Custom",
    baseUrl: "",
    icon: "🔗",
    enabled: true,
    selectors: {
      productCard: ".product",
      productName: ".product-name",
      price: ".price",
      originalPrice: ".original-price",
      productLink: "a",
    },
  },
};

// Export as array for UI components
export const SUPPORTED_MARKETPLACES = Object.values(MARKETPLACE_CONFIGS);

// Get marketplace config by type
export function getMarketplaceConfig(
  type: MarketplaceType
): MarketplaceConfig | undefined {
  return MARKETPLACE_CONFIGS[type];
}

// Validate if URL belongs to a marketplace
export function validateMarketplaceUrl(
  url: string,
  marketplace: MarketplaceType
): boolean {
  try {
    const urlObj = new URL(url);
    const config = MARKETPLACE_CONFIGS[marketplace];

    if (!config || marketplace === "custom") {
      return true; // Custom marketplace accepts any URL
    }

    const baseUrlHost = new URL(config.baseUrl).hostname;
    return (
      urlObj.hostname === baseUrlHost ||
      urlObj.hostname.endsWith(`.${baseUrlHost}`)
    );
  } catch {
    return false;
  }
}

// Get marketplace type from URL
export function getMarketplaceFromUrl(url: string): MarketplaceType | null {
  try {
    const urlObj = new URL(url);

    for (const [type, config] of Object.entries(MARKETPLACE_CONFIGS)) {
      if (type === "custom") continue;

      const baseUrlHost = new URL(config.baseUrl).hostname;
      if (
        urlObj.hostname === baseUrlHost ||
        urlObj.hostname.endsWith(`.${baseUrlHost}`)
      ) {
        return type as MarketplaceType;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Category URLs for ED medications
export const ED_CATEGORY_URLS: Record<
  Exclude<MarketplaceType, "custom">,
  string
> = {
  medsgo: "https://medsgo.ph/prescription-medicines/erectile-dysfunction/",
  watsons:
    "https://www.watsons.com.ph/health-and-rx/erectile-dysfunction-ed-/c/060410",
};
