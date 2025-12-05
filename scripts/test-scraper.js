"use strict";
/**
 * Test script to verify the scrapers are working
 *
 * Run with: npx tsx scripts/test-scraper.ts
 *
 * Note: Make sure Brave browser is installed at:
 * /Applications/Brave Browser.app/Contents/MacOS/Brave Browser
 */
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
var medsgo_scraper_1 = require("../lib/scrapers/medsgo-scraper");
var watsons_scraper_1 = require("../lib/scrapers/watsons-scraper");
function testMedsGo() {
    return __awaiter(this, void 0, void 0, function () {
        var products, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n🔍 Testing MedsGo scraper...\n");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, medsgo_scraper_1.scrapeMedsGo)()];
                case 2:
                    products = _a.sent();
                    console.log("\u2705 Found ".concat(products.length, " products from MedsGo\n"));
                    if (products.length > 0) {
                        console.log("Sample products:");
                        products.slice(0, 3).forEach(function (p, i) {
                            console.log("\n".concat(i + 1, ". ").concat(p.name));
                            console.log("   Brand: ".concat(p.brand || "N/A"));
                            console.log("   Dosage: ".concat(p.dosage || "N/A"));
                            console.log("   Price: \u20B1".concat(p.price.toLocaleString()));
                            if (p.originalPrice) {
                                console.log("   Original: \u20B1".concat(p.originalPrice.toLocaleString(), " (").concat(p.discountPercent, "% off)"));
                            }
                            console.log("   URL: ".concat(p.url));
                        });
                    }
                    return [2 /*return*/, products];
                case 3:
                    error_1 = _a.sent();
                    console.error("❌ MedsGo scraper failed:", error_1);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function testWatsons() {
    return __awaiter(this, void 0, void 0, function () {
        var products, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("\n🔍 Testing Watsons scraper...\n");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, watsons_scraper_1.scrapeWatsons)()];
                case 2:
                    products = _a.sent();
                    console.log("\u2705 Found ".concat(products.length, " products from Watsons\n"));
                    if (products.length > 0) {
                        console.log("Sample products:");
                        products.slice(0, 3).forEach(function (p, i) {
                            console.log("\n".concat(i + 1, ". ").concat(p.name));
                            console.log("   Brand: ".concat(p.brand || "N/A"));
                            console.log("   Dosage: ".concat(p.dosage || "N/A"));
                            console.log("   Price: \u20B1".concat(p.price.toLocaleString()));
                            if (p.originalPrice) {
                                console.log("   Original: \u20B1".concat(p.originalPrice.toLocaleString(), " (").concat(p.discountPercent, "% off)"));
                            }
                            console.log("   URL: ".concat(p.url));
                        });
                    }
                    return [2 /*return*/, products];
                case 3:
                    error_2 = _a.sent();
                    console.error("❌ Watsons scraper failed:", error_2);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var medsgoProducts, watsonsProducts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("=".repeat(60));
                    console.log("PricingRadar - Scraper Test");
                    console.log("=".repeat(60));
                    return [4 /*yield*/, testMedsGo()];
                case 1:
                    medsgoProducts = _a.sent();
                    return [4 /*yield*/, testWatsons()];
                case 2:
                    watsonsProducts = _a.sent();
                    console.log("\n" + "=".repeat(60));
                    console.log("Summary");
                    console.log("=".repeat(60));
                    console.log("MedsGo: ".concat(medsgoProducts.length, " products"));
                    console.log("Watsons: ".concat(watsonsProducts.length, " products"));
                    console.log("Total: ".concat(medsgoProducts.length + watsonsProducts.length, " products"));
                    console.log("=".repeat(60));
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
