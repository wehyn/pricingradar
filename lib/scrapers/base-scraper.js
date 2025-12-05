"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.BaseScraper = void 0;
exports.scrapeWithBrowser = scrapeWithBrowser;
var playwright_1 = require("playwright");
var index_1 = require("./index");
// Brave browser executable path for macOS
var BRAVE_PATH = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser";
var DEFAULT_OPTIONS = {
    headless: true,
    timeout: 30000,
    delayBetweenRequests: 2000, // 2 seconds between requests for ethical scraping
    userAgent: "PricingRadar/1.0 (GoRocky price monitoring bot)",
};
// Base scraper class
var BaseScraper = /** @class */ (function () {
    function BaseScraper(marketplace, options) {
        if (options === void 0) { options = {}; }
        this.browser = null;
        this.context = null;
        this.page = null;
        this.marketplace = marketplace;
        this.options = __assign(__assign({}, DEFAULT_OPTIONS), options);
    }
    // Initialize browser
    BaseScraper.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = this;
                        return [4 /*yield*/, playwright_1.chromium.launch({
                                executablePath: BRAVE_PATH,
                                headless: this.options.headless,
                            })];
                    case 1:
                        _a.browser = _d.sent();
                        _b = this;
                        return [4 /*yield*/, this.browser.newContext({
                                userAgent: this.options.userAgent,
                                viewport: { width: 1280, height: 720 },
                                locale: "en-PH",
                            })];
                    case 2:
                        _b.context = _d.sent();
                        _c = this;
                        return [4 /*yield*/, this.context.newPage()];
                    case 3:
                        _c.page = _d.sent();
                        this.page.setDefaultTimeout(this.options.timeout);
                        return [2 /*return*/];
                }
            });
        });
    };
    // Close browser
    BaseScraper.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.page.close()];
                    case 1:
                        _a.sent();
                        this.page = null;
                        _a.label = 2;
                    case 2:
                        if (!this.context) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.context.close()];
                    case 3:
                        _a.sent();
                        this.context = null;
                        _a.label = 4;
                    case 4:
                        if (!this.browser) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.browser.close()];
                    case 5:
                        _a.sent();
                        this.browser = null;
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Navigate to URL with retry logic
    BaseScraper.prototype.navigateTo = function (url_1) {
        return __awaiter(this, arguments, void 0, function (url, retries) {
            var lastError, i, error_1;
            if (retries === void 0) { retries = 3; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page) {
                            throw new Error("Browser not initialized. Call init() first.");
                        }
                        lastError = null;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < retries)) return [3 /*break*/, 8];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 7]);
                        return [4 /*yield*/, this.page.goto(url, {
                                waitUntil: "networkidle",
                                timeout: this.options.timeout,
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                    case 4:
                        error_1 = _a.sent();
                        lastError = error_1;
                        console.warn("Navigation attempt ".concat(i + 1, " failed:"), error_1);
                        if (!(i < retries - 1)) return [3 /*break*/, 6];
                        return [4 /*yield*/, (0, index_1.sleep)(this.options.delayBetweenRequests)];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [3 /*break*/, 7];
                    case 7:
                        i++;
                        return [3 /*break*/, 1];
                    case 8: throw lastError || new Error("Navigation failed after retries");
                }
            });
        });
    };
    // Wait for content to load
    BaseScraper.prototype.waitForContent = function (selector, timeout) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page) {
                            throw new Error("Browser not initialized. Call init() first.");
                        }
                        return [4 /*yield*/, this.page.waitForSelector(selector, {
                                timeout: timeout || this.options.timeout,
                                state: "visible",
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Scroll to load lazy content
    BaseScraper.prototype.scrollToBottom = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.page.evaluate(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, new Promise(function (resolve) {
                                                var totalHeight = 0;
                                                var distance = 300;
                                                var timer = setInterval(function () {
                                                    var scrollHeight = document.body.scrollHeight;
                                                    window.scrollBy(0, distance);
                                                    totalHeight += distance;
                                                    if (totalHeight >= scrollHeight) {
                                                        clearInterval(timer);
                                                        resolve();
                                                    }
                                                }, 100);
                                            })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        // Wait for any lazy-loaded content
                        return [4 /*yield*/, (0, index_1.sleep)(1000)];
                    case 2:
                        // Wait for any lazy-loaded content
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Take screenshot for debugging
    BaseScraper.prototype.takeScreenshot = function (path) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.page)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.page.screenshot({ path: path, fullPage: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Run scraper and return results
    BaseScraper.prototype.run = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, errors, products, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        errors = [];
                        products = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 7]);
                        return [4 /*yield*/, this.init()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.scrapeCategory(url)];
                    case 3:
                        products = _a.sent();
                        return [3 /*break*/, 7];
                    case 4:
                        error_2 = _a.sent();
                        errors.push(error_2.message);
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, this.close()];
                    case 6:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/, {
                            success: errors.length === 0,
                            marketplace: this.marketplace,
                            productsScraped: products.length,
                            products: products,
                            errors: errors.length > 0 ? errors : undefined,
                            scrapedAt: new Date(),
                            duration: Date.now() - startTime,
                        }];
                }
            });
        });
    };
    return BaseScraper;
}());
exports.BaseScraper = BaseScraper;
// Helper to create a one-off scrape without managing browser lifecycle
function scrapeWithBrowser(callback_1) {
    return __awaiter(this, arguments, void 0, function (callback, options) {
        var opts, browser, context, page;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    opts = __assign(__assign({}, DEFAULT_OPTIONS), options);
                    return [4 /*yield*/, playwright_1.chromium.launch({
                            executablePath: BRAVE_PATH,
                            headless: opts.headless,
                        })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newContext({
                            userAgent: opts.userAgent,
                            viewport: { width: 1280, height: 720 },
                        })];
                case 2:
                    context = _a.sent();
                    return [4 /*yield*/, context.newPage()];
                case 3:
                    page = _a.sent();
                    page.setDefaultTimeout(opts.timeout);
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, , 6, 10]);
                    return [4 /*yield*/, callback(page)];
                case 5: return [2 /*return*/, _a.sent()];
                case 6: return [4 /*yield*/, page.close()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, context.close()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, browser.close()];
                case 9:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
