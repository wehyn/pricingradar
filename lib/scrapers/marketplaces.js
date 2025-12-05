"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ED_CATEGORY_URLS = exports.SUPPORTED_MARKETPLACES = exports.MARKETPLACE_CONFIGS = void 0;
exports.getMarketplaceConfig = getMarketplaceConfig;
exports.validateMarketplaceUrl = validateMarketplaceUrl;
exports.getMarketplaceFromUrl = getMarketplaceFromUrl;
// Marketplace configurations with CSS selectors for scraping
exports.MARKETPLACE_CONFIGS = {
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
            price: '.product-card__price--current, [class*="price-current"], [class*="sale-price"]',
            originalPrice: '.product-card__price--old, [class*="price-old"], [class*="original-price"], del',
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
            productName: '.product-tile__name, [class*="product-name"], .product-title',
            price: '.product-tile__price--current, [class*="price"], .selling-price',
            originalPrice: '.product-tile__price--was, [class*="was-price"], .original-price, del',
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
exports.SUPPORTED_MARKETPLACES = Object.values(exports.MARKETPLACE_CONFIGS);
// Get marketplace config by type
function getMarketplaceConfig(type) {
    return exports.MARKETPLACE_CONFIGS[type];
}
// Validate if URL belongs to a marketplace
function validateMarketplaceUrl(url, marketplace) {
    try {
        var urlObj = new URL(url);
        var config = exports.MARKETPLACE_CONFIGS[marketplace];
        if (!config || marketplace === "custom") {
            return true; // Custom marketplace accepts any URL
        }
        var baseUrlHost = new URL(config.baseUrl).hostname;
        return (urlObj.hostname === baseUrlHost ||
            urlObj.hostname.endsWith(".".concat(baseUrlHost)));
    }
    catch (_a) {
        return false;
    }
}
// Get marketplace type from URL
function getMarketplaceFromUrl(url) {
    try {
        var urlObj = new URL(url);
        for (var _i = 0, _a = Object.entries(exports.MARKETPLACE_CONFIGS); _i < _a.length; _i++) {
            var _b = _a[_i], type = _b[0], config = _b[1];
            if (type === "custom")
                continue;
            var baseUrlHost = new URL(config.baseUrl).hostname;
            if (urlObj.hostname === baseUrlHost ||
                urlObj.hostname.endsWith(".".concat(baseUrlHost))) {
                return type;
            }
        }
        return null;
    }
    catch (_c) {
        return null;
    }
}
// Category URLs for ED medications
exports.ED_CATEGORY_URLS = {
    medsgo: "https://medsgo.ph/prescription-medicines/erectile-dysfunction/",
    watsons: "https://www.watsons.com.ph/health-and-rx/erectile-dysfunction-ed-/c/060410",
};
