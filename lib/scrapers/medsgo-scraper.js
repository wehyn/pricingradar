"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedsGoScraper = void 0;
exports.createMedsGoScraper = createMedsGoScraper;
exports.scrapeMedsGo = scrapeMedsGo;
var base_scraper_1 = require("./base-scraper");
var index_1 = require("./index");
// MedsGo-specific selectors discovered via Playwright exploration
var MEDSGO_SELECTORS = {
    productCard: ".ut2-gl__item",
    productName: ".ut2-gl__name a",
    productLink: ".ut2-gl__name a",
    productImage: ".ut2-gl__image img",
    priceContainer: ".ut2-gl__price",
    addToCart: ".ty-btn__add-to-cart",
    stockStatus: ".ty-qty-in-stock",
};
var MedsGoScraper = /** @class */ (function (_super) {
    __extends(MedsGoScraper, _super);
    function MedsGoScraper(options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, "medsgo", options) || this;
    }
    MedsGoScraper.prototype.scrapeCategory = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, products, scrapedProducts, _i, products_1, product, name_1, discountPercent;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.page) {
                            throw new Error("Browser not initialized. Call init() first.");
                        }
                        console.log("[MedsGo] Navigating to: ".concat(url));
                        return [4 /*yield*/, this.navigateTo(url)];
                    case 1:
                        _b.sent();
                        // Wait for product content to load
                        return [4 /*yield*/, (0, index_1.sleep)(3000)];
                    case 2:
                        // Wait for product content to load
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.page.waitForSelector(MEDSGO_SELECTORS.productCard, {
                                timeout: 10000,
                            })];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        _a = _b.sent();
                        console.warn("[MedsGo] Product cards not found, trying to scroll...");
                        return [3 /*break*/, 6];
                    case 6: 
                    // Scroll to load any lazy content
                    return [4 /*yield*/, this.scrollToBottom()];
                    case 7:
                        // Scroll to load any lazy content
                        _b.sent();
                        return [4 /*yield*/, (0, index_1.sleep)(2000)];
                    case 8:
                        _b.sent();
                        console.log("[MedsGo] Extracting product data...");
                        return [4 /*yield*/, this.page.evaluate(function (selectors) {
                                var items = [];
                                var productCards = document.querySelectorAll(selectors.productCard);
                                productCards.forEach(function (card) {
                                    var _a, _b;
                                    // Get product name
                                    var nameEl = card.querySelector(selectors.productName);
                                    var name = ((_a = nameEl === null || nameEl === void 0 ? void 0 : nameEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                                    // Get product URL
                                    var linkEl = card.querySelector(selectors.productLink);
                                    var url = (linkEl === null || linkEl === void 0 ? void 0 : linkEl.href) || "";
                                    // Get image URL
                                    var imgEl = card.querySelector(selectors.productImage);
                                    var imageUrl = (imgEl === null || imgEl === void 0 ? void 0 : imgEl.src) || (imgEl === null || imgEl === void 0 ? void 0 : imgEl.getAttribute("data-src")) || null;
                                    // Get prices from the price container
                                    var priceContainer = card.querySelector(selectors.priceContainer);
                                    var allText = (priceContainer === null || priceContainer === void 0 ? void 0 : priceContainer.textContent) || card.textContent || "";
                                    // MedsGo prices are in format ₱X,XXX00 (no decimal point, last 2 digits are cents)
                                    // Extract all price patterns
                                    var priceRegex = /₱([\d,]+)/g;
                                    var priceMatches = __spreadArray([], allText.matchAll(priceRegex), true);
                                    var prices = priceMatches.map(function (m) {
                                        var rawPrice = m[1].replace(/,/g, "");
                                        // Convert to actual price (divide by 100 as prices appear to be in centavos)
                                        return parseFloat(rawPrice) / 100;
                                    });
                                    // Determine current vs original price
                                    var currentPrice = 0;
                                    var originalPrice = null;
                                    if (prices.length >= 2) {
                                        // Usually: original (higher) comes first, then sale price (lower)
                                        var sorted = __spreadArray([], prices, true).sort(function (a, b) { return b - a; });
                                        originalPrice = sorted[0];
                                        currentPrice = sorted[1];
                                    }
                                    else if (prices.length === 1) {
                                        currentPrice = prices[0];
                                    }
                                    // Check stock status
                                    var stockEl = card.querySelector(selectors.stockStatus);
                                    var inStock = ((_b = stockEl === null || stockEl === void 0 ? void 0 : stockEl.textContent) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes("in stock")) ||
                                        !allText.toLowerCase().includes("out of stock");
                                    // Try to extract brand from feature items in the card
                                    var brand = null;
                                    var dosage = null;
                                    // Check for feature items with brand/dosage
                                    var featureItems = card.querySelectorAll(".ut2-pl__feature-item");
                                    featureItems.forEach(function (item) {
                                        var _a, _b;
                                        var text = item.textContent || "";
                                        if (text.includes("Brand")) {
                                            var valueEl = item.querySelector("em, span, .ut2-pl__feature-value");
                                            brand = ((_a = valueEl === null || valueEl === void 0 ? void 0 : valueEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || null;
                                        }
                                        if (text.includes("Dosage")) {
                                            var valueEl = item.querySelector("em, span, .ut2-pl__feature-value");
                                            dosage = ((_b = valueEl === null || valueEl === void 0 ? void 0 : valueEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || null;
                                        }
                                    });
                                    // Fallback: extract from _Brand_ _Value_ pattern in text
                                    if (!brand) {
                                        var brandMatch = allText.match(/_Brand_\s*_([^_]+)_/);
                                        if (brandMatch)
                                            brand = brandMatch[1].trim();
                                    }
                                    if (!dosage) {
                                        var dosageMatch = allText.match(/_Dosage_\s*_([^_]+)_/);
                                        if (dosageMatch)
                                            dosage = dosageMatch[1].trim();
                                    }
                                    // Extract dosage from product name if not found
                                    if (!dosage) {
                                        var dosageFromName = name.match(/(\d+)\s*mg/i);
                                        if (dosageFromName)
                                            dosage = "".concat(dosageFromName[1], "mg");
                                    }
                                    // Extract brand from product name if not found
                                    if (!brand) {
                                        var brands = [
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
                                        for (var _i = 0, brands_1 = brands; _i < brands_1.length; _i++) {
                                            var b = brands_1[_i];
                                            if (name.toUpperCase().includes(b.toUpperCase())) {
                                                brand = b;
                                                break;
                                            }
                                        }
                                    }
                                    if (name && currentPrice > 0) {
                                        items.push({
                                            name: name,
                                            currentPrice: currentPrice,
                                            originalPrice: originalPrice,
                                            url: url,
                                            imageUrl: imageUrl,
                                            brand: brand,
                                            dosage: dosage,
                                            inStock: inStock,
                                        });
                                    }
                                });
                                return items;
                            }, MEDSGO_SELECTORS)];
                    case 9:
                        products = _b.sent();
                        console.log("[MedsGo] Found ".concat(products.length, " products"));
                        scrapedProducts = [];
                        for (_i = 0, products_1 = products; _i < products_1.length; _i++) {
                            product = products_1[_i];
                            name_1 = (0, index_1.cleanProductName)(product.name);
                            discountPercent = product.originalPrice &&
                                product.currentPrice &&
                                product.originalPrice > product.currentPrice
                                ? (0, index_1.calculateDiscount)(product.originalPrice, product.currentPrice)
                                : undefined;
                            scrapedProducts.push({
                                id: (0, index_1.generateId)(),
                                name: name_1,
                                brand: product.brand || (0, index_1.extractBrand)(name_1),
                                dosage: product.dosage || (0, index_1.extractDosage)(name_1),
                                price: product.currentPrice,
                                originalPrice: product.originalPrice || undefined,
                                discountPercent: discountPercent,
                                currency: "PHP",
                                url: product.url,
                                imageUrl: product.imageUrl || undefined,
                                inStock: product.inStock,
                                marketplace: "medsgo",
                                scrapedAt: new Date(),
                            });
                        }
                        return [2 /*return*/, scrapedProducts];
                }
            });
        });
    };
    return MedsGoScraper;
}(base_scraper_1.BaseScraper));
exports.MedsGoScraper = MedsGoScraper;
// Factory function
function createMedsGoScraper(options) {
    return new MedsGoScraper(options);
}
// Convenience function for one-off scrape
function scrapeMedsGo() {
    return __awaiter(this, arguments, void 0, function (url, options) {
        var scraper, result;
        if (url === void 0) { url = "https://medsgo.ph/prescription-medicines/erectile-dysfunction/"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper = createMedsGoScraper(options);
                    return [4 /*yield*/, scraper.run(url)];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        console.error("[MedsGo] Scraping failed:", result.errors);
                    }
                    return [2 /*return*/, result.products];
            }
        });
    });
}
