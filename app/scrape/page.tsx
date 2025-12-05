"use client";

import { useState, useMemo } from "react";

interface ScrapedProduct {
  id: string;
  name: string;
  brand?: string;
  dosage?: string;
  quantity?: number;
  pricePerUnit?: number;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  currency: string;
  url: string;
  imageUrl?: string;
  inStock: boolean;
  marketplace: string;
  scrapedAt: string;
}

interface ScrapeResult {
  success: boolean;
  results: Array<{
    marketplace: string;
    productsScraped: number;
    savedToDb: number;
    errors?: string[];
    duration: number;
    products?: ScrapedProduct[];
  }>;
  totalProducts: number;
  totalDuration: number;
  allProducts?: ScrapedProduct[];
}

interface ComparisonGroup {
  ingredient: string;
  dosage: string;
  products: {
    medsgo?: ScrapedProduct;
    watsons?: ScrapedProduct;
  };
  priceDiff?: number; // Difference in price per unit
  priceDiffPercent?: number;
  cheapest?: string;
  marketAverage?: number; // Average price per unit
}

interface Alert {
  type: "price_drop" | "cheapest" | "discount" | "out_of_stock";
  severity: "info" | "warning" | "success";
  title: string;
  message: string;
  action?: string;
  product?: ScrapedProduct;
}

export default function ScrapePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"comparison" | "all" | "alerts">(
    "comparison"
  );

  const runScrape = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace: selectedMarketplace,
          saveToDb: true,
          includeProducts: true,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Normalize product name to extract ingredient and dosage for matching
  const normalizeProduct = (product: ScrapedProduct) => {
    const name = product.name.toUpperCase();
    let ingredient = "UNKNOWN";
    let dosage = product.dosage || "";

    // Extract ingredient
    if (name.includes("SILDENAFIL")) ingredient = "Sildenafil";
    else if (name.includes("TADALAFIL")) ingredient = "Tadalafil";
    else if (name.includes("VARDENAFIL")) ingredient = "Vardenafil";

    // Extract dosage if not already set
    if (!dosage) {
      const dosageMatch = name.match(/(\d+)\s*MG/i);
      if (dosageMatch) dosage = `${dosageMatch[1]}mg`;
    }

    return { ingredient, dosage: dosage.toLowerCase() };
  };

  // Create comparison groups by matching products
  const comparisonGroups = useMemo((): ComparisonGroup[] => {
    if (!result?.allProducts) return [];

    const groups: Map<string, ComparisonGroup> = new Map();

    result.allProducts.forEach((product) => {
      const { ingredient, dosage } = normalizeProduct(product);
      if (ingredient === "UNKNOWN" || !dosage) return;

      const key = `${ingredient}-${dosage}`;

      if (!groups.has(key)) {
        groups.set(key, {
          ingredient,
          dosage,
          products: {},
        });
      }

      const group = groups.get(key)!;
      // Use pricePerUnit for comparison (fallback to price if not available)
      const productPricePerUnit = product.pricePerUnit || product.price;

      if (product.marketplace === "medsgo") {
        // Keep the cheapest per unit if multiple
        const existingPricePerUnit =
          group.products.medsgo?.pricePerUnit || group.products.medsgo?.price;
        if (
          !group.products.medsgo ||
          productPricePerUnit < (existingPricePerUnit || Infinity)
        ) {
          group.products.medsgo = product;
        }
      } else if (product.marketplace === "watsons") {
        const existingPricePerUnit =
          group.products.watsons?.pricePerUnit || group.products.watsons?.price;
        if (
          !group.products.watsons ||
          productPricePerUnit < (existingPricePerUnit || Infinity)
        ) {
          group.products.watsons = product;
        }
      }
    });

    // Calculate price differences and market averages using PRICE PER UNIT
    return Array.from(groups.values())
      .map((group) => {
        // Use pricePerUnit for fair comparison
        const medsgoPricePerUnit =
          group.products.medsgo?.pricePerUnit || group.products.medsgo?.price;
        const watsonsPricePerUnit =
          group.products.watsons?.pricePerUnit || group.products.watsons?.price;

        if (medsgoPricePerUnit && watsonsPricePerUnit) {
          group.priceDiff = medsgoPricePerUnit - watsonsPricePerUnit;
          group.priceDiffPercent =
            ((medsgoPricePerUnit - watsonsPricePerUnit) / watsonsPricePerUnit) *
            100;
          group.cheapest =
            medsgoPricePerUnit <= watsonsPricePerUnit ? "medsgo" : "watsons";
          group.marketAverage = (medsgoPricePerUnit + watsonsPricePerUnit) / 2;
        } else if (medsgoPricePerUnit) {
          group.cheapest = "medsgo";
          group.marketAverage = medsgoPricePerUnit;
        } else if (watsonsPricePerUnit) {
          group.cheapest = "watsons";
          group.marketAverage = watsonsPricePerUnit;
        }

        return group;
      })
      .filter((g) => g.products.medsgo || g.products.watsons)
      .sort(
        (a, b) =>
          a.ingredient.localeCompare(b.ingredient) ||
          a.dosage.localeCompare(b.dosage)
      );
  }, [result]);

  // Generate alerts and suggested actions
  const alerts = useMemo((): Alert[] => {
    if (!result?.allProducts) return [];

    const alertsList: Alert[] = [];

    // Find significant discounts
    result.allProducts.forEach((product) => {
      if (product.discountPercent && product.discountPercent >= 15) {
        alertsList.push({
          type: "discount",
          severity: "success",
          title: `${product.discountPercent}% Discount at ${product.marketplace}`,
          message: `${product.name} is ${product.discountPercent}% off`,
          action: `Check if GoRocky can match this ${product.discountPercent}% discount`,
          product,
        });
      }
    });

    // Find price comparison opportunities (using price per unit)
    comparisonGroups.forEach((group) => {
      if (group.products.medsgo && group.products.watsons) {
        const diff = Math.abs(group.priceDiffPercent || 0);
        if (diff >= 10) {
          const cheaper = group.cheapest === "medsgo" ? "MedsGo" : "Watsons";
          const moreExpensive =
            group.cheapest === "medsgo" ? "Watsons" : "MedsGo";
          const cheaperProduct =
            group.cheapest === "medsgo"
              ? group.products.medsgo
              : group.products.watsons;
          const expensiveProduct =
            group.cheapest === "medsgo"
              ? group.products.watsons
              : group.products.medsgo;
          const cheaperPricePerUnit =
            cheaperProduct.pricePerUnit || cheaperProduct.price;
          const expensivePricePerUnit =
            expensiveProduct.pricePerUnit || expensiveProduct.price;

          alertsList.push({
            type: "cheapest",
            severity: "warning",
            title: `${group.ingredient} ${
              group.dosage
            }: ${cheaper} is ${diff.toFixed(0)}% cheaper per tablet`,
            message: `${cheaper} sells at ₱${cheaperPricePerUnit.toFixed(
              2
            )}/tab (${
              cheaperProduct.quantity || 1
            } tabs) vs ${moreExpensive} at ₱${expensivePricePerUnit.toFixed(
              2
            )}/tab (${expensiveProduct.quantity || 1} tabs)`,
            action: `Consider pricing GoRocky's ${group.ingredient} ${
              group.dosage
            } competitively around ₱${group.marketAverage?.toFixed(2)}/tablet`,
          });
        }
      }
    });

    return alertsList.slice(0, 10); // Limit to 10 alerts
  }, [result, comparisonGroups]);

  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Calculate market stats
  const marketStats = useMemo(() => {
    if (!comparisonGroups.length) return null;

    const comparableGroups = comparisonGroups.filter(
      (g) => g.products.medsgo && g.products.watsons
    );

    const medsgoWins = comparableGroups.filter(
      (g) => g.cheapest === "medsgo"
    ).length;
    const watsonsWins = comparableGroups.filter(
      (g) => g.cheapest === "watsons"
    ).length;

    const avgMedsgoPrice =
      comparableGroups.reduce(
        (sum, g) => sum + (g.products.medsgo?.price || 0),
        0
      ) / comparableGroups.length;
    const avgWatsonsPrice =
      comparableGroups.reduce(
        (sum, g) => sum + (g.products.watsons?.price || 0),
        0
      ) / comparableGroups.length;

    return {
      totalComparable: comparableGroups.length,
      medsgoWins,
      watsonsWins,
      avgMedsgoPrice,
      avgWatsonsPrice,
      overallCheaper: avgMedsgoPrice < avgWatsonsPrice ? "MedsGo" : "Watsons",
      priceDiffPercent:
        ((avgMedsgoPrice - avgWatsonsPrice) / avgWatsonsPrice) * 100,
    };
  }, [comparisonGroups]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            📊 PricingRadar Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Compare ED medication prices between MedsGo and Watsons for
            GoRocky&apos;s competitive intelligence
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Scrape From
              </label>
              <select
                value={selectedMarketplace}
                onChange={(e) => setSelectedMarketplace(e.target.value)}
                className="px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="all">All Competitors</option>
                <option value="medsgo">MedsGo Only</option>
                <option value="watsons">Watsons Only</option>
              </select>
            </div>

            <button
              onClick={runScrape}
              disabled={loading}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Scraping...
                </>
              ) : (
                "🚀 Run Price Scan"
              )}
            </button>

            {result && (
              <div className="ml-auto text-sm text-zinc-500">
                Last scan: {new Date().toLocaleTimeString()} •{" "}
                {result.totalProducts} products •{" "}
                {(result.totalDuration / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">Error: {error}</p>
          </div>
        )}

        {/* Market Overview Cards */}
        {marketStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 mb-1">
                Comparable Products
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {marketStats.totalComparable}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 mb-1">Overall Cheaper</div>
              <div
                className={`text-2xl font-bold ${
                  marketStats.overallCheaper === "MedsGo"
                    ? "text-purple-600"
                    : "text-blue-600"
                }`}
              >
                {marketStats.overallCheaper}
              </div>
              <div className="text-xs text-zinc-400">
                by {Math.abs(marketStats.priceDiffPercent).toFixed(1)}%
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 mb-1">💊 MedsGo Wins</div>
              <div className="text-2xl font-bold text-purple-600">
                {marketStats.medsgoWins}
              </div>
              <div className="text-xs text-zinc-400">cheapest products</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="text-sm text-zinc-500 mb-1">🏪 Watsons Wins</div>
              <div className="text-2xl font-bold text-blue-600">
                {marketStats.watsonsWins}
              </div>
              <div className="text-xs text-zinc-400">cheapest products</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {result && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("comparison")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "comparison"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              📊 Price Comparison
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeTab === "alerts"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              🔔 Alerts & Actions
              {alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "all"
                  ? "bg-emerald-600 text-white"
                  : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              📦 All Products ({result.totalProducts})
            </button>
          </div>
        )}

        {/* Price Comparison Table */}
        {activeTab === "comparison" && comparisonGroups.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Side-by-Side Price Comparison
              </h2>
              <p className="text-sm text-zinc-500">
                Products matched by active ingredient and dosage
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        💊 MedsGo
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        🏪 Watsons
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">
                      Difference
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">
                      Cheapest
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">
                      Market Avg
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {comparisonGroups.map((group) => (
                    <tr
                      key={`${group.ingredient}-${group.dosage}`}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {group.ingredient}
                        </div>
                        <div className="text-sm text-zinc-500">
                          {group.dosage}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {group.products.medsgo ? (
                          <div>
                            <div
                              className={`font-semibold ${
                                group.cheapest === "medsgo"
                                  ? "text-green-600"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {formatPrice(
                                group.products.medsgo.pricePerUnit ||
                                  group.products.medsgo.price
                              )}
                              <span className="text-xs font-normal text-zinc-500">
                                /tab
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500">
                              {formatPrice(group.products.medsgo.price)} (
                              {group.products.medsgo.quantity || 1} tabs)
                            </div>
                            {group.products.medsgo.discountPercent && (
                              <div className="text-xs text-emerald-600">
                                -{group.products.medsgo.discountPercent}% off
                              </div>
                            )}
                            <div className="text-xs text-zinc-400 truncate max-w-[150px]">
                              {group.products.medsgo.brand}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {group.products.watsons ? (
                          <div>
                            <div
                              className={`font-semibold ${
                                group.cheapest === "watsons"
                                  ? "text-green-600"
                                  : "text-zinc-900 dark:text-zinc-100"
                              }`}
                            >
                              {formatPrice(
                                group.products.watsons.pricePerUnit ||
                                  group.products.watsons.price
                              )}
                              <span className="text-xs font-normal text-zinc-500">
                                /tab
                              </span>
                            </div>
                            <div className="text-xs text-zinc-500">
                              {formatPrice(group.products.watsons.price)} (
                              {group.products.watsons.quantity || 1} tabs)
                            </div>
                            {group.products.watsons.discountPercent && (
                              <div className="text-xs text-emerald-600">
                                -{group.products.watsons.discountPercent}% off
                              </div>
                            )}
                            <div className="text-xs text-zinc-400 truncate max-w-[150px]">
                              {group.products.watsons.brand}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {group.priceDiff !== undefined ? (
                          <div
                            className={`font-medium ${
                              group.priceDiff > 0
                                ? "text-red-600"
                                : group.priceDiff < 0
                                ? "text-green-600"
                                : "text-zinc-500"
                            }`}
                          >
                            {group.priceDiff > 0 ? "+" : ""}
                            {formatPrice(group.priceDiff)}/tab
                            <div className="text-xs">
                              ({group.priceDiffPercent! > 0 ? "+" : ""}
                              {group.priceDiffPercent!.toFixed(1)}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {group.cheapest && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              group.cheapest === "medsgo"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {group.cheapest === "medsgo"
                              ? "💊 MedsGo"
                              : "🏪 Watsons"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-zinc-600 dark:text-zinc-400">
                        {group.marketAverage
                          ? formatPrice(group.marketAverage)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Alerts & Actions */}
        {activeTab === "alerts" && (
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-zinc-500">
                  No significant alerts. Prices are stable.
                </p>
              </div>
            ) : (
              alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-sm border-l-4 ${
                    alert.severity === "success"
                      ? "border-l-green-500"
                      : alert.severity === "warning"
                      ? "border-l-amber-500"
                      : "border-l-blue-500"
                  } border border-zinc-200 dark:border-zinc-800`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">
                      {alert.type === "discount"
                        ? "🏷️"
                        : alert.type === "cheapest"
                        ? "💰"
                        : "🔔"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        {alert.message}
                      </p>
                      {alert.action && (
                        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase mb-1">
                            💡 Suggested Action
                          </div>
                          <p className="text-sm text-emerald-800 dark:text-emerald-300">
                            {alert.action}
                          </p>
                        </div>
                      )}
                    </div>
                    {alert.product && (
                      <a
                        href={alert.product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium whitespace-nowrap"
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* All Products Table */}
        {activeTab === "all" && result?.allProducts && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800 text-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Brand
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-zinc-500">
                      Dosage
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-500">
                      Price
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-zinc-500">
                      Stock
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {result.allProducts
                    .sort((a, b) => a.price - b.price)
                    .map((product) => (
                      <tr
                        key={product.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              product.marketplace === "medsgo"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {product.marketplace === "medsgo" ? "💊" : "🏪"}{" "}
                            {product.marketplace}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 max-w-xs truncate">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {product.brand || "—"}
                        </td>
                        <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                          {product.dosage || "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {formatPrice(product.price)}
                          </div>
                          {product.originalPrice &&
                            product.originalPrice > product.price && (
                              <div className="text-xs">
                                <span className="text-zinc-400 line-through">
                                  {formatPrice(product.originalPrice)}
                                </span>
                                <span className="text-emerald-600 ml-1">
                                  -{product.discountPercent}%
                                </span>
                              </div>
                            )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {product.inStock ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-500">✗</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 text-sm"
                          >
                            View →
                          </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Ready to Compare Prices
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Click &quot;Run Price Scan&quot; to fetch and compare competitor
              pricing
            </p>
            <ul className="text-sm text-zinc-500 space-y-1">
              <li>• Side-by-side price comparison</li>
              <li>• Identify cheapest competitor per product</li>
              <li>• Alerts for discounts and price differences</li>
              <li>• Suggested actions for GoRocky</li>
            </ul>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="animate-spin h-12 w-12 text-emerald-600"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Scanning Competitor Prices...
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400">
              Fetching data from MedsGo and Watsons. This may take 30-60
              seconds.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
