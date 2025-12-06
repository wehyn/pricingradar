"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  RefreshCw,
  ArrowRight,
  Search,
  Menu,
  X,
  CheckCircle,
} from "lucide-react";

// --- TYPES & INTERFACES ---

interface HistoryData {
  date: string;
  myPrice?: number;
  amazonPrice?: number;
  bestbuyPrice?: number;
}

interface Competitor {
  name: string;
  price: number;
  pricePerUnit?: number;
  quantity?: number;
  url?: string;
  marketplace?: string;
  brand?: string;
  dosage?: string;
}

interface Product {
  id: number | string;
  name: string;
  sku?: string;
  // myPrice kept for compatibility but not shown on main UI
  myPrice?: number;
  competitors: Competitor[];
  history?: HistoryData[];
  category?: string;
  status?: "Critical" | "Stable" | "Winning" | string;
}

interface Alert {
  id: number;
  product: Product;
  variance: number;
  competitor: Competitor;
}

// --- UTILITY FUNCTIONS ---

// Extract quantity (tablet/unit count) from product name
function extractQuantity(productName: string): number {
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
function calculatePricePerUnit(price: number, quantity: number): number {
  if (quantity <= 0) return price;
  return Math.round((price / quantity) * 100) / 100; // Round to 2 decimal places
}

// --- MOCK DATA GENERATORS ---

const GENERATE_HISTORY = (): HistoryData[] => {
  const data: HistoryData[] = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      myPrice: 299,
      amazonPrice: 299 - Math.random() * 20,
      bestbuyPrice: 305 - Math.random() * 10,
    });
  }
  // Simulate a recent drop for Amazon
  if (data.length > 0) {
    data[data.length - 1].amazonPrice = 265;
    data[data.length - 2].amazonPrice = 270;
  }
  return data;
};

// Generate a synthetic 30-day history from current competitor prices
const GENERATE_HISTORY_FROM_COMPETITORS = (
  competitors: Competitor[],
  days = 30
): HistoryData[] => {
  const data: HistoryData[] = [];
  const today = new Date();

  // pick reference prices
  const medsgo = competitors.find(
    (c) => (c.marketplace || c.name || "").toString().toLowerCase() === "medsgo"
  );
  const watsons = competitors.find(
    (c) =>
      (c.marketplace || c.name || "").toString().toLowerCase() === "watsons"
  );
  const baseMed = medsgo ? medsgo.price : competitors[0]?.price ?? 0;
  const baseWat = watsons ? watsons.price : competitors[1]?.price ?? baseMed;
  const marketAvg =
    competitors.length > 0
      ? competitors.reduce((s, c) => s + (c.price || 0), 0) / competitors.length
      : (baseMed + baseWat) / 2;

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // create small random walk around base prices
    const noise = (seed: number) =>
      (Math.sin(date.getTime() / 86400000 + seed) + (Math.random() - 0.5)) *
      0.02;
    const myPrice = Math.round(marketAvg * (1 + noise(1)) * 100) / 100;
    const medsgoPrice = Math.round(baseMed * (1 + noise(2)) * 100) / 100;
    const watsonsPrice = Math.round(baseWat * (1 + noise(3)) * 100) / 100;

    data.push({
      date: date.toISOString().split("T")[0],
      myPrice,
      medsgoPrice,
      watsonsPrice,
    } as unknown as HistoryData);
  }

  return data;
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Sony WH-1000XM5 Headphones",
    sku: "SNY-XM5-BLK",
    myPrice: 299.0,
    competitors: [
      { name: "Amazon", price: 265.0, url: "#" },
      { name: "BestBuy", price: 299.99, url: "#" },
      { name: "Walmart", price: 289.0, url: "#" },
    ],
    history: GENERATE_HISTORY(),
    category: "Audio",
    status: "Critical",
  },
  {
    id: 2,
    name: "Logitech MX Master 3S",
    sku: "LOG-MX3S-GRY",
    myPrice: 99.0,
    competitors: [
      { name: "Amazon", price: 99.0, url: "#" },
      { name: "BestBuy", price: 105.0, url: "#" },
      { name: "Walmart", price: 95.0, url: "#" },
    ],
    history: GENERATE_HISTORY().map((d) => ({
      ...d,
      myPrice: 99,
      amazonPrice: 99,
      bestbuyPrice: 105,
    })),
    category: "Peripherals",
    status: "Stable",
  },
  {
    id: 3,
    name: "Samsung T7 Shield 2TB SSD",
    sku: "SAM-T7-2TB",
    myPrice: 160.0,
    competitors: [
      { name: "Amazon", price: 175.0, url: "#" },
      { name: "BestBuy", price: 179.0, url: "#" },
      { name: "Walmart", price: 180.0, url: "#" },
    ],
    history: GENERATE_HISTORY().map((d) => ({
      ...d,
      myPrice: 160,
      amazonPrice: 175,
      bestbuyPrice: 179,
    })),
    category: "Storage",
    status: "Winning",
  },
];

// Demo side-by-side comparison data (used when no live MedsGo+Watsons intersection)
const SAMPLE_COMPARE: Product[] = [
  {
    id: "demo-1",
    name: "Sildenafil 50mg - 1 Box x 8 Tabs (Erecfil 50)",
    sku: "demo-sild-50-8",
    competitors: [
      {
        name: "medsgo",
        marketplace: "medsgo",
        price: 680,
        quantity: 8,
        pricePerUnit: 85,
      },
      {
        name: "watsons",
        marketplace: "watsons",
        price: 835,
        quantity: 1,
        pricePerUnit: 835,
      },
    ],
    status: "Monitoring",
  },
  {
    id: "demo-2",
    name: "Sildenafil 100mg - 1 Box x 10 Tabs (Spiagra 100)",
    sku: "demo-sild-100-10",
    competitors: [
      {
        name: "medsgo",
        marketplace: "medsgo",
        price: 950,
        quantity: 10,
        pricePerUnit: 95,
      },
      {
        name: "watsons",
        marketplace: "watsons",
        price: 1002.5,
        quantity: 1,
        pricePerUnit: 1002.5,
      },
    ],
    status: "Monitoring",
  },
  {
    id: "demo-3",
    name: "Tadalafil 20mg - 1 Tablet (Dalafil)",
    sku: "demo-tada-20",
    competitors: [
      {
        name: "medsgo",
        marketplace: "medsgo",
        price: 90,
        quantity: 1,
        pricePerUnit: 90,
      },
      {
        name: "watsons",
        marketplace: "watsons",
        price: 985.25,
        quantity: 1,
        pricePerUnit: 985.25,
      },
    ],
    status: "Monitoring",
  },
];

// --- COMPONENTS ---

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<any>;
  trend: "positive" | "negative" | "neutral";
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
}) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p
        className={`text-xs mt-2 font-medium flex items-center ${
          trend === "positive"
            ? "text-emerald-600"
            : trend === "negative"
            ? "text-rose-600"
            : "text-slate-400"
        }`}
      >
        {subtext}
      </p>
    </div>
    <div className="p-3 bg-slate-50 rounded-lg">
      <Icon className="w-5 h-5 text-slate-600" />
    </div>
  </div>
);

interface AlertCardProps {
  product: Product;
  variance: number;
  competitor: Competitor;
  onDismiss: () => void;
}

const AlertCard: React.FC<AlertCardProps> = ({
  product,
  variance,
  competitor,
  onDismiss,
}) => {
  const suggestedAction =
    variance < -10
      ? `Deep undercut detected. Lower price to $${
          competitor.price + 5
        } to bridge gap.`
      : `Match competitor price at $${competitor.price}.`;

  return (
    <div className="bg-white border-l-4 border-rose-500 rounded-lg shadow-sm p-4 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-rose-50 rounded-full shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-800 flex items-center gap-2">
            Price Alert: {product.name}
            <span className="px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-700 font-bold">
              {variance.toFixed(1)}% Gap
            </span>
          </h4>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium">{competitor.name}</span> dropped price
            to{" "}
            <span className="font-bold text-slate-900">
              ${competitor.price}
            </span>{" "}
            (You: ${product.myPrice}).
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end md:self-auto">
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50 rounded transition-colors"
        >
          Dismiss
        </button>
        <div className="ml-4 px-3 py-2 bg-slate-50 border border-slate-100 rounded-md text-sm text-slate-700 max-w-[480px]">
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-slate-500 mt-0.5" />
            <div>
              <div className="text-xs text-slate-500">Suggested Action</div>
              <div className="text-sm font-medium">{suggestedAction}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductChart: React.FC<{ product: Product | null }> = ({ product }) => {
  if (!product) return null;

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={product.history}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(str: string) =>
              new Date(str).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => `$${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          {product.history &&
            product.history.some((d) => typeof d.myPrice === "number") && (
              <Line
                type="monotone"
                name="My Price"
                dataKey="myPrice"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
          <Line
            type="monotone"
            name="Amazon"
            dataKey="amazonPrice"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            name="BestBuy"
            dataKey="bestbuyPrice"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastScanAt, setLastScanAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "alerts">("overview");
  const [expandedView, setExpandedView] = useState<"links" | "history">(
    "links"
  );

  // Calculate high-level stats (using price per unit)
  const totalProducts = products.length;
  const losingProducts = products.filter((p) => {
    const myPricePerUnit =
      p.myPrice ??
      p.competitors.reduce((a, c) => a + (c.pricePerUnit || c.price || 0), 0) /
        Math.max(1, p.competitors.length);
    return p.competitors.some(
      (c) => (c.pricePerUnit || c.price) < myPricePerUnit
    );
  }).length;

  const avgMarketPos =
    totalProducts > 0
      ? products.reduce((acc, p) => {
          const minComp = Math.min(
            ...p.competitors.map((c) => c.pricePerUnit || c.price)
          );
          const myPricePerUnit =
            p.myPrice ??
            p.competitors.reduce(
              (a, c) => a + (c.pricePerUnit || c.price || 0),
              0
            ) / Math.max(1, p.competitors.length);
          const diff = ((myPricePerUnit - minComp) / minComp) * 100;
          return acc + diff;
        }, 0) / totalProducts
      : 0;

  // Initialize alerts based on initial data (using price per unit)
  useEffect(() => {
    const newAlerts: Alert[] = [];
    products.forEach((p) => {
      // Use price per unit for comparison
      const cheapest = p.competitors.reduce((prev, curr) => {
        const prevPrice = prev.pricePerUnit || prev.price;
        const currPrice = curr.pricePerUnit || curr.price;
        return currPrice < prevPrice ? curr : prev;
      });
      const avgPricePerUnit =
        p.competitors.reduce(
          (a, c) => a + (c.pricePerUnit || c.price || 0),
          0
        ) / Math.max(1, p.competitors.length);
      const base = p.myPrice ?? avgPricePerUnit;
      const cheapestPrice = cheapest.pricePerUnit || cheapest.price;
      const variance = ((cheapestPrice - base) / base) * 100;
      if (variance < -5) {
        newAlerts.push({
          product: p,
          variance,
          competitor: cheapest,
          id:
            typeof p.id === "number"
              ? p.id
              : parseInt(String(p.id).replace(/\D/g, "")) || 0,
        });
      }
    });
    setAlerts(newAlerts);
  }, [products]);

  // Fetch live scrape from backend API and map to UI products
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace: "all",
          saveToDb: true,
          includeProducts: true,
        }),
      });
      if (!res.ok) {
        console.error("Scrape API error", await res.text());
        setIsScanning(false);
        return;
      }

      const data = await res.json();
      const all: any[] = data.allProducts || [];

      // Attempt to pair MedsGo and Watsons products by normalized name / token overlap.
      const medsgo = all.filter(
        (p) => (p.marketplace || "").toLowerCase() === "medsgo"
      );
      const watsons = all.filter(
        (p) => (p.marketplace || "").toLowerCase() === "watsons"
      );

      const normalize = (s: string) =>
        (s || "")
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      const tokens = (s: string) =>
        Array.from(new Set(normalize(s).split(" ").filter(Boolean)));

      const usedWatsons = new Set<string>();
      const mapped: Product[] = [];
      let idx = 1;

      for (const m of medsgo) {
        const mName = m.name || m.id || "";
        const mTokens = tokens(mName);
        let best: any = null;
        let bestScore = 0;
        for (const w of watsons) {
          if (usedWatsons.has(w.id)) continue;
          const wTokens = tokens(w.name || w.id || "");
          const common = mTokens.filter((t) => wTokens.includes(t));
          const score = common.length;
          if (score > bestScore) {
            bestScore = score;
            best = w;
          }
        }

        const competitors: Competitor[] = [];
        const mQuantity = m.quantity || extractQuantity(mName);
        const mPricePerUnit =
          m.pricePerUnit || calculatePricePerUnit(m.price, mQuantity);
        competitors.push({
          name: "medsgo",
          price: m.price,
          pricePerUnit: mPricePerUnit,
          quantity: mQuantity,
          url: m.url,
          marketplace: "medsgo",
          brand: m.brand,
          dosage: m.dosage,
        });
        if (best && bestScore >= Math.max(1, Math.floor(mTokens.length / 3))) {
          // accept match if there is at least minimal overlap
          usedWatsons.add(best.id);
          const wQuantity = best.quantity || extractQuantity(best.name || "");
          const wPricePerUnit =
            best.pricePerUnit || calculatePricePerUnit(best.price, wQuantity);
          competitors.push({
            name: "watsons",
            price: best.price,
            pricePerUnit: wPricePerUnit,
            quantity: wQuantity,
            url: best.url,
            marketplace: "watsons",
            brand: best.brand,
            dosage: best.dosage,
          });
        }

        // Use price per unit for market average calculation
        const marketAvg =
          competitors.reduce(
            (s: number, c: Competitor) => s + (c.pricePerUnit || c.price || 0),
            0
          ) / Math.max(1, competitors.length);
        mapped.push({
          id: `g-${idx++}`,
          name: mName,
          sku: m.id || undefined,
          myPrice: Math.round(marketAvg * 100) / 100,
          competitors,
          history: GENERATE_HISTORY_FROM_COMPETITORS(competitors),
          status:
            competitors.length > 1
              ? Math.min(...competitors.map((c) => c.price)) < marketAvg * 0.95
                ? "Critical"
                : "Stable"
              : "Monitoring",
        });
      }

      // Add any remaining Watsons products that were not paired
      for (const w of watsons) {
        if (usedWatsons.has(w.id)) continue;
        const wQuantity = w.quantity || extractQuantity(w.name || "");
        const wPricePerUnit =
          w.pricePerUnit || calculatePricePerUnit(w.price, wQuantity);
        const competitors: Competitor[] = [
          {
            name: "watsons",
            price: w.price,
            pricePerUnit: wPricePerUnit,
            quantity: wQuantity,
            url: w.url,
            marketplace: "watsons",
            brand: w.brand,
            dosage: w.dosage,
          },
        ];
        const marketAvg =
          competitors.reduce(
            (s: number, c: Competitor) => s + (c.pricePerUnit || c.price || 0),
            0
          ) / Math.max(1, competitors.length);
        mapped.push({
          id: `g-${idx++}`,
          name: w.name || w.id || "Unknown",
          sku: w.id || undefined,
          myPrice: Math.round(marketAvg * 100) / 100,
          competitors,
          history: GENERATE_HISTORY_FROM_COMPETITORS(competitors),
          status: "Monitoring",
        });
      }

      setProducts(mapped);
      setLastScanAt(new Date().toISOString());
    } catch (err) {
      console.error("Scan failed", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Run an initial scan on mount to populate the main UI with scraped data
  useEffect(() => {
    handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusColor = (myPrice: number, competitors: Competitor[]) => {
    const minPrice = Math.min(
      ...competitors.map((c) => c.pricePerUnit || c.price)
    );
    const variance = ((myPrice - minPrice) / minPrice) * 100;

    if (variance > 5) return "bg-rose-100 text-rose-700"; // I'm expensive
    if (variance < -5) return "bg-emerald-100 text-emerald-700"; // I'm cheapest
    return "bg-slate-100 text-slate-600"; // Market average
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  const formatCurrencyPHP = (val: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 2,
    }).format(val);

  // Precompute display rows for MedsGo/Watsons comparison to avoid an IIFE inside JSX
  const medsgoWatsonsFiltered = products.filter((p) => {
    const names = (p.competitors || []).map((c) =>
      (c.marketplace || "").toLowerCase()
    );
    return names.includes("medsgo") && names.includes("watsons");
  });
  const tableDisplay =
    medsgoWatsonsFiltered.length > 0 ? medsgoWatsonsFiltered : SAMPLE_COMPARE;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/GoRadar.png"
              alt="GoRadar"
              className="h-24 w-24 object-contain"
            />
            <span className="sr-only">GoRadar</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/configure"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 shadow-sm"
            >
              Configure
            </Link>
            <button
              onClick={handleScan}
              disabled={isScanning}
              title="Refresh now"
              className={`ml-2 inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                isScanning
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <RefreshCw
                className={`${isScanning ? "animate-spin" : ""} w-5 h-5`}
              />
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
              <span className="text-xs font-bold text-slate-600">GR</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TABS */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === "overview"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                activeTab === "alerts"
                  ? "bg-rose-600 text-white"
                  : "bg-slate-50 text-slate-600"
              }`}
            >
              Alerts{" "}
              {alerts.length > 0 && (
                <span className="ml-2 inline-block px-2 py-0.5 rounded-full text-xs bg-white text-rose-600 font-semibold">
                  {alerts.length}
                </span>
              )}
            </button>
          </div>
          <div className="text-sm text-slate-500">
            Last scan:{" "}
            {lastScanAt ? new Date(lastScanAt).toLocaleString() : "never"}
          </div>
        </div>

        {activeTab === "overview" && (
          <>
            {/* KPI SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <KpiCard
                title="Market Position"
                value={`${avgMarketPos > 0 ? "+" : ""}${avgMarketPos.toFixed(
                  1
                )}%`}
                subtext={
                  avgMarketPos > 0
                    ? "Above Market Avg (Expensive)"
                    : "Below Market Avg (Competitive)"
                }
                icon={Activity}
                trend={avgMarketPos > 2 ? "negative" : "positive"}
              />
              <KpiCard
                title="Competitor Alerts"
                value={losingProducts}
                subtext="Products where we are losing on price"
                icon={AlertTriangle}
                trend={losingProducts > 0 ? "negative" : "positive"}
              />
              <KpiCard
                title="Monitoring"
                value={totalProducts}
                subtext="Active SKUs tracked daily"
                icon={CheckCircle}
                trend="neutral"
              />
            </div>

            {/* MAIN TABLE SECTION */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-lg font-bold text-slate-800">
                  Competitive Landscape
                </h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                </div>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 w-2/5">Product</th>
                    <th className="px-6 py-4">
                      MedsGo{" "}
                      <span className="text-[10px] font-normal">
                        (per unit)
                      </span>
                    </th>
                    <th className="px-6 py-4">
                      Watsons{" "}
                      <span className="text-[10px] font-normal">
                        (per unit)
                      </span>
                    </th>
                    <th className="px-6 py-4">Difference</th>
                    <th className="px-6 py-4">Cheapest</th>
                    <th className="px-6 py-4 text-right">Avg/Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {tableDisplay.map((product, idx) => {
                    const medsgo = product.competitors.find(
                      (c) => (c.marketplace || "").toLowerCase() === "medsgo"
                    );
                    const watsons = product.competitors.find(
                      (c) => (c.marketplace || "").toLowerCase() === "watsons"
                    );
                    // Use price per unit for fair comparison across different pack sizes
                    const medsgoUnit =
                      medsgo?.pricePerUnit || medsgo?.price || 0;
                    const watsonsUnit =
                      watsons?.pricePerUnit || watsons?.price || 0;
                    const marketAvg =
                      product.competitors.length > 0
                        ? product.competitors.reduce(
                            (acc, c) => acc + (c.pricePerUnit || c.price),
                            0
                          ) / product.competitors.length
                        : 0;
                    const diff =
                      medsgo && watsons
                        ? Math.round((medsgoUnit - watsonsUnit) * 100) / 100
                        : 0;
                    const diffPct = watsonsUnit
                      ? Math.round((diff / watsonsUnit) * 1000) / 10
                      : 0;
                    const cheapest = product.competitors.reduce(
                      (prev, cur) =>
                        (cur.pricePerUnit || cur.price) <
                        (prev.pricePerUnit || prev.price)
                          ? cur
                          : prev,
                      product.competitors[0]
                    );

                    return (
                      <React.Fragment key={product.id}>
                        <tr
                          onClick={() => {
                            if (selectedProduct?.id === product.id) {
                              setSelectedProduct(null);
                            } else {
                              setSelectedProduct(product);
                              setExpandedView("links");
                            }
                          }}
                          className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                            selectedProduct?.id === product.id
                              ? "bg-blue-50/80"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">
                              {product.name}
                            </div>
                            <div className="text-slate-500 text-xs mt-0.5">
                              {product.sku}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div
                              className={`flex flex-col px-3 py-2 rounded-md border ${
                                medsgo && medsgoUnit < marketAvg
                                  ? "bg-rose-50 border-rose-100"
                                  : "bg-slate-50 border-slate-100"
                              }`}
                            >
                              <div className="text-[10px] text-slate-500 uppercase font-bold">
                                MEDSGO
                              </div>
                              <div
                                className={`font-semibold ${
                                  medsgo && medsgoUnit < marketAvg
                                    ? "text-rose-700"
                                    : "text-emerald-600"
                                }`}
                              >
                                {medsgo ? formatCurrencyPHP(medsgoUnit) : "—"}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {medsgo
                                  ? `${medsgo.quantity || 1} tab${
                                      (medsgo.quantity || 1) > 1 ? "s" : ""
                                    } @ ${formatCurrencyPHP(medsgo.price)}`
                                  : ""}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {medsgo?.brand || medsgo?.dosage || ""}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div
                              className={`flex flex-col px-3 py-2 rounded-md border ${
                                watsons && watsonsUnit < marketAvg
                                  ? "bg-rose-50 border-rose-100"
                                  : "bg-slate-50 border-slate-100"
                              }`}
                            >
                              <div className="text-[10px] text-slate-500 uppercase font-bold">
                                WATSONS
                              </div>
                              <div
                                className={`font-semibold ${
                                  watsons && watsonsUnit < marketAvg
                                    ? "text-rose-700"
                                    : "text-emerald-600"
                                }`}
                              >
                                {watsons ? formatCurrencyPHP(watsonsUnit) : "—"}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {watsons
                                  ? `${watsons.quantity || 1} tab${
                                      (watsons.quantity || 1) > 1 ? "s" : ""
                                    } @ ${formatCurrencyPHP(watsons.price)}`
                                  : ""}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {watsons?.brand || watsons?.dosage || ""}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-right">
                              {typeof diff === "number" ? (
                                <div
                                  className={`font-semibold ${
                                    diff < 0
                                      ? "text-emerald-500"
                                      : "text-rose-600"
                                  }`}
                                >
                                  {diff < 0 ? "" : "+"}
                                  {formatCurrencyPHP(Math.abs(diff))}
                                </div>
                              ) : (
                                "—"
                              )}
                              <div
                                className={`text-xs ${
                                  diffPct < 0
                                    ? "text-emerald-500"
                                    : "text-rose-600"
                                }`}
                              >
                                {diffPct
                                  ? `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(
                                      1
                                    )}%`
                                  : ""}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex justify-start">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  cheapest.marketplace === "medsgo"
                                    ? "bg-purple-700 text-white"
                                    : "bg-sky-700 text-white"
                                }`}
                              >
                                {cheapest.marketplace?.toUpperCase()}
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right text-slate-600">
                            {formatCurrencyPHP(marketAvg)}
                          </td>
                        </tr>

                        {selectedProduct?.id === product.id && (
                          <tr className="bg-slate-50/50">
                            <td
                              colSpan={6}
                              className="px-6 py-4 border-b border-slate-200"
                            >
                              <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setExpandedView("links")}
                                      className={`px-3 py-1 rounded-md text-sm ${
                                        expandedView === "links"
                                          ? "bg-slate-900 text-white"
                                          : "bg-slate-50 text-slate-600"
                                      }`}
                                    >
                                      Links
                                    </button>
                                    <button
                                      onClick={() => setExpandedView("history")}
                                      className={`px-3 py-1 rounded-md text-sm ${
                                        expandedView === "history"
                                          ? "bg-slate-900 text-white"
                                          : "bg-slate-50 text-slate-600"
                                      }`}
                                    >
                                      History
                                    </button>
                                  </div>
                                  <div>
                                    <button
                                      className="text-blue-600 text-xs font-medium hover:underline mr-3"
                                      onClick={() =>
                                        window.open(
                                          product.competitors[0]?.url || "#",
                                          "_blank"
                                        )
                                      }
                                    >
                                      Open Top Result
                                    </button>
                                    <button
                                      className="text-sm text-slate-600"
                                      onClick={() => setSelectedProduct(null)}
                                    >
                                      Close
                                    </button>
                                  </div>
                                </div>

                                {expandedView === "links" ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {product.competitors.map((c, i) => (
                                      <div
                                        key={i}
                                        className="p-3 border rounded-md bg-slate-50"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-sm font-semibold text-slate-800">
                                              {(c.marketplace || c.name || "")
                                                .toString()
                                                .toUpperCase()}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                              {c.brand || c.dosage || ""}
                                            </div>
                                            <div className="text-sm font-medium mt-1">
                                              {formatCurrencyPHP(
                                                c.pricePerUnit || c.price
                                              )}
                                              <span className="text-slate-400 font-normal">
                                                /unit
                                              </span>
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                              {c.quantity || 1} tablet
                                              {(c.quantity || 1) > 1
                                                ? "s"
                                                : ""}{" "}
                                              @ {formatCurrencyPHP(c.price)}{" "}
                                              total
                                            </div>
                                          </div>
                                          <div className="ml-4">
                                            {c.url ? (
                                              <a
                                                href={c.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 text-white text-xs"
                                              >
                                                Open
                                              </a>
                                            ) : (
                                              <span className="text-xs text-slate-400">
                                                No URL
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div>
                                    <ProductChart product={product} />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "alerts" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Action Required
                <span className="text-sm text-slate-500">
                  ({alerts.length})
                </span>
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab("overview");
                  }}
                  className="text-sm text-slate-600 hover:underline"
                >
                  Back to Overview
                </button>
                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className={`ml-2 px-3 py-1.5 rounded text-sm ${
                    isScanning
                      ? "bg-slate-100 text-slate-400"
                      : "bg-white text-slate-700 border border-slate-200"
                  }`}
                >
                  {isScanning ? "Scanning..." : "Run Scan"}
                </button>
              </div>
            </div>

            {alerts.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-md border border-slate-100 text-slate-600">
                No active alerts. Run a scan or configure thresholds to start
                monitoring.
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, idx) => (
                  <AlertCard
                    key={idx}
                    {...alert}
                    onDismiss={() =>
                      setAlerts((prev) => prev.filter((_, i) => i !== idx))
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
