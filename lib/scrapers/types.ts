// Marketplace types
export type MarketplaceType = "medsgo" | "watsons" | "custom";

// Scraped product from competitor site
export interface ScrapedProduct {
  id: string;
  name: string;
  brand?: string;
  dosage?: string;
  quantity?: number; // Number of tablets/units in pack
  pricePerUnit?: number; // Price per tablet/unit
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  url: string;
  imageUrl?: string;
  inStock: boolean;
  marketplace: MarketplaceType;
  scrapedAt: Date;
}

// Marketplace configuration
export interface MarketplaceConfig {
  id: MarketplaceType;
  name: string;
  baseUrl: string;
  icon: string;
  enabled: boolean;
  selectors: {
    productCard: string;
    productName: string;
    price: string;
    originalPrice?: string;
    brand?: string;
    dosage?: string;
    imageUrl?: string;
    inStock?: string;
    productLink?: string;
  };
}

// Competitor product (stored in DB)
export interface CompetitorProduct {
  id: string;
  competitorId: string;
  name: string;
  brand?: string;
  dosage?: string;
  url: string;
  externalId?: string;
  marketplace: MarketplaceType;
  createdAt: Date;
  updatedAt: Date;
}

// Internal product (GoRocky's products)
export interface InternalProduct {
  id: string;
  sku: string;
  name: string;
  currentPrice: number;
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product mapping between competitor and internal products
export interface ProductMapping {
  id: string;
  competitorProductId: string;
  internalProductId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Price history entry
export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  scrapedAt: Date;
}

// Alert condition types
export type AlertCondition =
  | "price_drop"
  | "price_increase"
  | "price_drop_percentage"
  | "price_drop_absolute"
  | "price_increase_percentage"
  | "price_increase_absolute"
  | "price_below"
  | "price_above"
  | "discount_detected"
  | "out_of_stock"
  | "back_in_stock"
  | "price_below_threshold"
  | "price_above_threshold";

// Alert threshold configuration
export interface AlertThreshold {
  id: string;
  name: string;
  condition: AlertCondition;
  value: number; // percentage or absolute value depending on condition
  enabled: boolean;
  productIds?: string[]; // if empty, applies to all products
  notifyEmail?: boolean;
  notifySlack?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Alert instance (triggered alert)
export interface Alert {
  id: string;
  thresholdId: string;
  productId: string;
  competitorId: string;
  message: string;
  oldValue?: number;
  newValue: number;
  triggeredAt: Date;
  acknowledged: boolean;
}

// Competitor configuration
export interface Competitor {
  id: string;
  name: string;
  marketplace: MarketplaceType;
  baseUrl: string;
  categoryUrl: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Scrape result
export interface ScrapeResult {
  success: boolean;
  marketplace: MarketplaceType;
  productsScraped: number;
  products: ScrapedProduct[];
  errors?: string[];
  scrapedAt: Date;
  duration: number; // milliseconds
}
