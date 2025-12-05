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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WatsonsScraper = void 0;
exports.createWatsonsScraper = createWatsonsScraper;
exports.scrapeWatsons = scrapeWatsons;
var base_scraper_1 = require("./base-scraper");
var index_1 = require("./index");
var WatsonsScraper = /** @class */ (function (_super) {
    __extends(WatsonsScraper, _super);
    function WatsonsScraper(options) {
        if (options === void 0) { options = {}; }
        return _super.call(this, "watsons", options) || this;
    }
    WatsonsScraper.prototype.scrapeCategory = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var products, scrapedProducts, _i, products_1, product, name_1, price, originalPrice, discountPercent;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page) {
                            throw new Error("Browser not initialized. Call init() first.");
                        }
                        console.log("[Watsons] Navigating to: ".concat(url));
                        return [4 /*yield*/, this.navigateTo(url)];
                    case 1:
                        _a.sent();
                        // Wait for product content to load
                        return [4 /*yield*/, (0, index_1.sleep)(3000)];
                    case 2:
                        // Wait for product content to load
                        _a.sent();
                        // Scroll to load any lazy content
                        return [4 /*yield*/, this.scrollToBottom()];
                    case 3:
                        // Scroll to load any lazy content
                        _a.sent();
                        return [4 /*yield*/, (0, index_1.sleep)(1500)];
                    case 4:
                        _a.sent();
                        console.log("[Watsons] Extracting product data...");
                        return [4 /*yield*/, this.page.evaluate(function () {
                                var items = [];
                                // Watsons product tiles - try multiple selectors
                                var productCards = document.querySelectorAll('.product-tile, .product-item, [class*="product-card"], [class*="plp-product"], .e-product');
                                // Alternative: find products by their structure
                                if (productCards.length === 0) {
                                    // Look for product containers with price and name
                                    var containers = document.querySelectorAll('[data-product], [class*="product"]');
                                    containers.forEach(function (container) {
                                        var _a, _b, _c, _d;
                                        var nameEl = container.querySelector('[class*="name"], [class*="title"], h2, h3, h4');
                                        var priceEl = container.querySelector('[class*="price"], .price');
                                        var linkEl = container.querySelector('a[href*="/p/"]');
                                        var imgEl = container.querySelector("img");
                                        if (nameEl && priceEl && linkEl) {
                                            var originalPriceEl = container.querySelector('[class*="was"], [class*="original"], [class*="old"], del, s');
                                            items.push({
                                                name: ((_a = nameEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "",
                                                price: ((_b = priceEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || "",
                                                originalPrice: ((_c = originalPriceEl === null || originalPriceEl === void 0 ? void 0 : originalPriceEl.textContent) === null || _c === void 0 ? void 0 : _c.trim()) || null,
                                                url: linkEl.href,
                                                imageUrl: (imgEl === null || imgEl === void 0 ? void 0 : imgEl.src) || null,
                                                inStock: !((_d = container.textContent) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes("out of stock")),
                                                brand: null,
                                            });
                                        }
                                    });
                                }
                                else {
                                    productCards.forEach(function (card) {
                                        var _a, _b, _c, _d, _e, _f;
                                        // Get product name
                                        var nameEl = card.querySelector('.product-tile__name, [class*="product-name"], [class*="title"], .name, h3, h4');
                                        // Get prices
                                        var priceContainer = card.querySelector('[class*="price"]');
                                        var currentPrice = "";
                                        var originalPrice = null;
                                        if (priceContainer) {
                                            // Look for sale/current price
                                            var saleEl = priceContainer.querySelector('[class*="sale"], [class*="current"], [class*="now"], .selling-price');
                                            var wasEl = priceContainer.querySelector('[class*="was"], [class*="original"], del, s');
                                            if (saleEl) {
                                                currentPrice = ((_a = saleEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                                                originalPrice = ((_b = wasEl === null || wasEl === void 0 ? void 0 : wasEl.textContent) === null || _b === void 0 ? void 0 : _b.trim()) || null;
                                            }
                                            else {
                                                currentPrice = ((_c = priceContainer.textContent) === null || _c === void 0 ? void 0 : _c.trim()) || "";
                                            }
                                        }
                                        // Get product link
                                        var linkEl = card.querySelector('a[href*="/p/"], a[href]');
                                        // Get image
                                        var imgEl = card.querySelector("img");
                                        // Get brand
                                        var brandEl = card.querySelector('[class*="brand"]');
                                        // Check stock
                                        var inStock = !((_d = card.textContent) === null || _d === void 0 ? void 0 : _d.toLowerCase().includes("out of stock"));
                                        if (nameEl && currentPrice) {
                                            items.push({
                                                name: ((_e = nameEl.textContent) === null || _e === void 0 ? void 0 : _e.trim()) || "",
                                                price: currentPrice,
                                                originalPrice: originalPrice,
                                                url: (linkEl === null || linkEl === void 0 ? void 0 : linkEl.href) || "",
                                                imageUrl: (imgEl === null || imgEl === void 0 ? void 0 : imgEl.src) || (imgEl === null || imgEl === void 0 ? void 0 : imgEl.getAttribute("data-src")) || null,
                                                inStock: inStock,
                                                brand: ((_f = brandEl === null || brandEl === void 0 ? void 0 : brandEl.textContent) === null || _f === void 0 ? void 0 : _f.trim()) || null,
                                            });
                                        }
                                    });
                                }
                                // Fallback: Try to find any elements with Philippine peso prices
                                if (items.length === 0) {
                                    var allElements = document.querySelectorAll("*");
                                    var priceRegex_1 = /₱[\d,]+(?:\.\d{2})?/;
                                    var seenUrls_1 = new Set();
                                    allElements.forEach(function (el) {
                                        var _a, _b;
                                        var text = el.textContent || "";
                                        if (priceRegex_1.test(text)) {
                                            var parent_1 = el.closest('a[href], [class*="product"]');
                                            var link = parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.querySelector('a[href*="/p/"]');
                                            if (link && !seenUrls_1.has(link.href)) {
                                                seenUrls_1.add(link.href);
                                                var container = link.closest('[class*="product"], article, div');
                                                var nameEl = container === null || container === void 0 ? void 0 : container.querySelector('h2, h3, h4, [class*="name"], [class*="title"]');
                                                var imgEl = container === null || container === void 0 ? void 0 : container.querySelector("img");
                                                if (nameEl) {
                                                    items.push({
                                                        name: ((_a = nameEl.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || "",
                                                        price: ((_b = text.match(priceRegex_1)) === null || _b === void 0 ? void 0 : _b[0]) || "",
                                                        originalPrice: null,
                                                        url: link.href,
                                                        imageUrl: (imgEl === null || imgEl === void 0 ? void 0 : imgEl.src) || null,
                                                        inStock: true,
                                                        brand: null,
                                                    });
                                                }
                                            }
                                        }
                                    });
                                }
                                return items;
                            })];
                    case 5:
                        products = _a.sent();
                        console.log("[Watsons] Found ".concat(products.length, " products"));
                        scrapedProducts = [];
                        for (_i = 0, products_1 = products; _i < products_1.length; _i++) {
                            product = products_1[_i];
                            if (!product.name || !product.price)
                                continue;
                            name_1 = (0, index_1.cleanProductName)(product.name);
                            price = (0, index_1.parsePrice)(product.price);
                            originalPrice = product.originalPrice
                                ? (0, index_1.parsePrice)(product.originalPrice)
                                : null;
                            // Skip if we couldn't parse the price
                            if (price === null) {
                                console.warn("[Watsons] Could not parse price for: ".concat(name_1));
                                continue;
                            }
                            discountPercent = originalPrice && originalPrice > price
                                ? (0, index_1.calculateDiscount)(originalPrice, price)
                                : undefined;
                            scrapedProducts.push({
                                id: (0, index_1.generateId)(),
                                name: name_1,
                                brand: product.brand || (0, index_1.extractBrand)(name_1),
                                dosage: (0, index_1.extractDosage)(name_1),
                                price: price,
                                originalPrice: originalPrice || undefined,
                                discountPercent: discountPercent,
                                currency: "PHP",
                                url: product.url,
                                imageUrl: product.imageUrl || undefined,
                                inStock: product.inStock,
                                marketplace: "watsons",
                                scrapedAt: new Date(),
                            });
                        }
                        return [2 /*return*/, scrapedProducts];
                }
            });
        });
    };
    return WatsonsScraper;
}(base_scraper_1.BaseScraper));
exports.WatsonsScraper = WatsonsScraper;
// Factory function
function createWatsonsScraper(options) {
    return new WatsonsScraper(options);
}
// Convenience function for one-off scrape
function scrapeWatsons() {
    return __awaiter(this, arguments, void 0, function (url, options) {
        var scraper, result;
        if (url === void 0) { url = "https://www.watsons.com.ph/health-and-rx/erectile-dysfunction-ed-/c/060410"; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper = createWatsonsScraper(options);
                    return [4 /*yield*/, scraper.run(url)];
                case 1:
                    result = _a.sent();
                    if (!result.success) {
                        console.error("[Watsons] Scraping failed:", result.errors);
                    }
                    return [2 /*return*/, result.products];
            }
        });
    });
}
