import { AlertThreshold, AlertCondition } from "./types";

// Re-export types and marketplace configs
export * from "./types";
export * from "./marketplaces";

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Parse Philippine Peso price string to number
// Handles formats like: ₱1,234.56, ₱85, ₱1234, PHP 1,234.56
export function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;

  // Remove currency symbols and whitespace
  const cleaned = priceStr
    .replace(/[₱PHP\s]/gi, "")
    .replace(/,/g, "")
    .trim();

  // Extract the number
  const match = cleaned.match(/[\d.]+/);
  if (!match) return null;

  const price = parseFloat(match[0]);
  return isNaN(price) ? null : price;
}

// Calculate discount percentage
export function calculateDiscount(
  originalPrice: number,
  currentPrice: number
): number {
  if (originalPrice <= 0 || currentPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

// Format price for display
export function formatPrice(price: number, currency: string = "PHP"): string {
  const formatter = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency === "PHP" ? "PHP" : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(price);
}

// Default alert presets
export const DEFAULT_ALERT_PRESETS: Omit<
  AlertThreshold,
  "id" | "createdAt" | "updatedAt"
>[] = [
  {
    name: "Price Drop > 10%",
    condition: "price_drop" as AlertCondition,
    value: 10,
    enabled: true,
  },
  {
    name: "Price Drop > 20%",
    condition: "price_drop" as AlertCondition,
    value: 20,
    enabled: false,
  },
  {
    name: "Price Increase > 10%",
    condition: "price_increase" as AlertCondition,
    value: 10,
    enabled: true,
  },
  {
    name: "Discount Detected",
    condition: "discount_detected" as AlertCondition,
    value: 0,
    enabled: true,
  },
  {
    name: "Out of Stock",
    condition: "out_of_stock" as AlertCondition,
    value: 0,
    enabled: true,
  },
];

// Sleep utility for rate limiting
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extract brand from product name (common patterns for ED meds)
export function extractBrand(productName: string): string | undefined {
  const knownBrands = [
    "VIAGRA",
    "CIALIS",
    "LEVITRA",
    "Erecfil",
    "Erecto",
    "Spiagra",
    "Dalafil",
    "Retafil",
    "Vivax",
    "Caliberi",
  ];

  const upperName = productName.toUpperCase();

  for (const brand of knownBrands) {
    if (upperName.includes(brand.toUpperCase())) {
      return brand;
    }
  }

  return undefined;
}

// Extract dosage from product name (e.g., "50mg", "100mg", "20mg")
export function extractDosage(productName: string): string | undefined {
  const match = productName.match(/(\d+)\s*(mg|MG|Mg)/);
  return match ? `${match[1]}mg` : undefined;
}

// Extract quantity (tablet/unit count) from product name
// Handles patterns like: "8 Tablets", "10 tabs", "1 Tablet", "4s", "Box of 4", "x4", "4 pcs"
export function extractQuantity(productName: string): number {
  const name = productName.toLowerCase();

  // Pattern: "X tablets/tabs/tab/pcs/capsules"
  const tabletMatch = name.match(
    /(\d+)\s*(tablets?|tabs?|pcs?|capsules?|pieces?|units?)/i
  );
  if (tabletMatch) {
    return parseInt(tabletMatch[1], 10);
  }

  // Pattern: "Xs" at end (e.g., "4s", "8s") - common in Philippines
  const sMatch = name.match(/(\d+)s\b/i);
  if (sMatch) {
    return parseInt(sMatch[1], 10);
  }

  // Pattern: "Box of X" or "Pack of X"
  const boxMatch = name.match(/(box|pack)\s*(of)?\s*(\d+)/i);
  if (boxMatch) {
    return parseInt(boxMatch[3], 10);
  }

  // Pattern: "xX" at end (e.g., "x4", "x10")
  const xMatch = name.match(/x(\d+)\b/i);
  if (xMatch) {
    return parseInt(xMatch[1], 10);
  }

  // Pattern: "(X)" - quantity in parentheses
  const parenMatch = name.match(/\((\d+)\)/);
  if (parenMatch && parseInt(parenMatch[1], 10) <= 100) {
    // Avoid matching dosage in parentheses
    return parseInt(parenMatch[1], 10);
  }

  // Default to 1 if no quantity found (assume single unit)
  return 1;
}

// Calculate price per unit
export function calculatePricePerUnit(price: number, quantity: number): number {
  if (quantity <= 0) return price;
  return Math.round((price / quantity) * 100) / 100; // Round to 2 decimal places
}

// Clean product name by removing common noise
export function cleanProductName(name: string): string {
  return name.replace(/\s+/g, " ").replace(/\n/g, " ").trim();
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
