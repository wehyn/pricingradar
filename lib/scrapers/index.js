"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_ALERT_PRESETS = void 0;
exports.generateId = generateId;
exports.parsePrice = parsePrice;
exports.calculateDiscount = calculateDiscount;
exports.formatPrice = formatPrice;
exports.sleep = sleep;
exports.extractBrand = extractBrand;
exports.extractDosage = extractDosage;
exports.cleanProductName = cleanProductName;
exports.isValidUrl = isValidUrl;
// Re-export types and marketplace configs
__exportStar(require("./types"), exports);
__exportStar(require("./marketplaces"), exports);
// Generate a unique ID
function generateId() {
    return "".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 9));
}
// Parse Philippine Peso price string to number
// Handles formats like: ₱1,234.56, ₱85, ₱1234, PHP 1,234.56
function parsePrice(priceStr) {
    if (!priceStr)
        return null;
    // Remove currency symbols and whitespace
    var cleaned = priceStr
        .replace(/[₱PHP\s]/gi, "")
        .replace(/,/g, "")
        .trim();
    // Extract the number
    var match = cleaned.match(/[\d.]+/);
    if (!match)
        return null;
    var price = parseFloat(match[0]);
    return isNaN(price) ? null : price;
}
// Calculate discount percentage
function calculateDiscount(originalPrice, currentPrice) {
    if (originalPrice <= 0 || currentPrice >= originalPrice)
        return 0;
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}
// Format price for display
function formatPrice(price, currency) {
    if (currency === void 0) { currency = "PHP"; }
    var formatter = new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: currency === "PHP" ? "PHP" : currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return formatter.format(price);
}
// Default alert presets
exports.DEFAULT_ALERT_PRESETS = [
    {
        name: "Price Drop > 10%",
        condition: "price_drop",
        value: 10,
        enabled: true,
    },
    {
        name: "Price Drop > 20%",
        condition: "price_drop",
        value: 20,
        enabled: false,
    },
    {
        name: "Price Increase > 10%",
        condition: "price_increase",
        value: 10,
        enabled: true,
    },
    {
        name: "Discount Detected",
        condition: "discount_detected",
        value: 0,
        enabled: true,
    },
    {
        name: "Out of Stock",
        condition: "out_of_stock",
        value: 0,
        enabled: true,
    },
];
// Sleep utility for rate limiting
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
// Extract brand from product name (common patterns for ED meds)
function extractBrand(productName) {
    var knownBrands = [
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
    var upperName = productName.toUpperCase();
    for (var _i = 0, knownBrands_1 = knownBrands; _i < knownBrands_1.length; _i++) {
        var brand = knownBrands_1[_i];
        if (upperName.includes(brand.toUpperCase())) {
            return brand;
        }
    }
    return undefined;
}
// Extract dosage from product name (e.g., "50mg", "100mg", "20mg")
function extractDosage(productName) {
    var match = productName.match(/(\d+)\s*(mg|MG|Mg)/);
    return match ? "".concat(match[1], "mg") : undefined;
}
// Clean product name by removing common noise
function cleanProductName(name) {
    return name.replace(/\s+/g, " ").replace(/\n/g, " ").trim();
}
// Validate URL
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch (_a) {
        return false;
    }
}
