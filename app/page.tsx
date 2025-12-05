"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, ArrowRight, Search, Menu, X, CheckCircle } from 'lucide-react';

// --- TYPES & INTERFACES ---

interface HistoryData {
  date: string;
  myPrice: number;
  amazonPrice: number;
  bestbuyPrice: number;
}

interface Competitor {
  name: string;
  price: number;
  url: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  myPrice: number;
  competitors: Competitor[];
  history: HistoryData[];
  category: string;
  status: 'Critical' | 'Stable' | 'Winning' | string;
}

interface Alert {
  id: number;
  product: Product;
  variance: number;
  competitor: Competitor;
}

// --- MOCK DATA GENERATORS ---

const GENERATE_HISTORY = (): HistoryData[] => {
  const data: HistoryData[] = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      myPrice: 299,
      amazonPrice: 299 - (Math.random() * 20),
      bestbuyPrice: 305 - (Math.random() * 10),
    });
  }
  // Simulate a recent drop for Amazon
  if (data.length > 0) {
    data[data.length - 1].amazonPrice = 265;
    data[data.length - 2].amazonPrice = 270;
  }
  return data;
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Sony WH-1000XM5 Headphones",
    sku: "SNY-XM5-BLK",
    myPrice: 299.00,
    competitors: [
      { name: "Amazon", price: 265.00, url: "#" },
      { name: "BestBuy", price: 299.99, url: "#" },
      { name: "Walmart", price: 289.00, url: "#" }
    ],
    history: GENERATE_HISTORY(),
    category: "Audio",
    status: "Critical"
  },
  {
    id: 2,
    name: "Logitech MX Master 3S",
    sku: "LOG-MX3S-GRY",
    myPrice: 99.00,
    competitors: [
      { name: "Amazon", price: 99.00, url: "#" },
      { name: "BestBuy", price: 105.00, url: "#" },
      { name: "Walmart", price: 95.00, url: "#" }
    ],
    history: GENERATE_HISTORY().map(d => ({ ...d, myPrice: 99, amazonPrice: 99, bestbuyPrice: 105 })),
    category: "Peripherals",
    status: "Stable"
  },
  {
    id: 3,
    name: "Samsung T7 Shield 2TB SSD",
    sku: "SAM-T7-2TB",
    myPrice: 160.00,
    competitors: [
      { name: "Amazon", price: 175.00, url: "#" },
      { name: "BestBuy", price: 179.00, url: "#" },
      { name: "Walmart", price: 180.00, url: "#" }
    ],
    history: GENERATE_HISTORY().map(d => ({ ...d, myPrice: 160, amazonPrice: 175, bestbuyPrice: 179 })),
    category: "Storage",
    status: "Winning"
  }
];

// --- COMPONENTS ---

interface KpiCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<any>;
  trend: 'positive' | 'negative' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtext, icon: Icon, trend }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p className={`text-xs mt-2 font-medium flex items-center ${trend === 'positive' ? 'text-emerald-600' : trend === 'negative' ? 'text-rose-600' : 'text-slate-400'}`}>
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

const AlertCard: React.FC<AlertCardProps> = ({ product, variance, competitor, onDismiss }) => {
  const suggestedAction = variance < -10 
    ? `Deep undercut detected. Lower price to $${competitor.price + 5} to bridge gap.`
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
            <span className="px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-700 font-bold">{variance.toFixed(1)}% Gap</span>
          </h4>
          <p className="text-sm text-slate-600 mt-1">
            <span className="font-medium">{competitor.name}</span> dropped price to <span className="font-bold text-slate-900">${competitor.price}</span> (You: ${product.myPrice}).
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(str: string) => new Date(str).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => `$${val}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }}/>
          <Line type="monotone" name="My Price" dataKey="myPrice" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          <Line type="monotone" name="Amazon" dataKey="amazonPrice" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
          <Line type="monotone" name="BestBuy" dataKey="bestbuyPrice" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
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

  // Calculate high-level stats
  const totalProducts = products.length;
  const losingProducts = products.filter(p => p.competitors.some(c => c.price < p.myPrice)).length;
  
  const avgMarketPos = totalProducts > 0 
    ? products.reduce((acc, p) => {
        const minComp = Math.min(...p.competitors.map(c => c.price));
        const diff = ((p.myPrice - minComp) / minComp) * 100;
        return acc + diff;
      }, 0) / totalProducts 
    : 0;

  // Initialize alerts based on initial data
  useEffect(() => {
    const newAlerts: Alert[] = [];
    products.forEach(p => {
      const cheapest = p.competitors.reduce((prev, curr) => prev.price < curr.price ? prev : curr);
      const variance = ((cheapest.price - p.myPrice) / p.myPrice) * 100;
      if (variance < -5) {
        newAlerts.push({ product: p, variance, competitor: cheapest, id: p.id });
      }
    });
    setAlerts(newAlerts);
  }, [products]);

  const handleScan = () => {
    setIsScanning(true);
    // Simulate a network request and data update
    setTimeout(() => {
      setProducts(prev => prev.map(p => {
        // Randomly adjust competitor prices to simulate market movement
        const newCompetitors = p.competitors.map(c => ({
          ...c,
          price: c.price + (Math.random() > 0.5 ? -2 : 2)
        }));
        return { ...p, competitors: newCompetitors };
      }));
      setIsScanning(false);
    }, 2000);
  };

  const getStatusColor = (myPrice: number, competitors: Competitor[]) => {
    const minPrice = Math.min(...competitors.map(c => c.price));
    const variance = ((myPrice - minPrice) / minPrice) * 100;
    
    if (variance > 5) return "bg-rose-100 text-rose-700"; // I'm expensive
    if (variance < -5) return "bg-emerald-100 text-emerald-700"; // I'm cheapest
    return "bg-slate-100 text-slate-600"; // Market average
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/GoRadar.png" alt="GoRadar" className="h-24 w-24 object-contain" />
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
              className={`ml-2 inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${isScanning ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
            >
              <RefreshCw className={`${isScanning ? 'animate-spin' : ''} w-5 h-5`} />
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
              <span className="text-xs font-bold text-slate-600">GR</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KpiCard 
            title="Market Position" 
            value={`${avgMarketPos > 0 ? '+' : ''}${avgMarketPos.toFixed(1)}%`}
            subtext={avgMarketPos > 0 ? "Above Market Avg (Expensive)" : "Below Market Avg (Competitive)"}
            icon={Activity}
            trend={avgMarketPos > 2 ? 'negative' : 'positive'}
          />
          <KpiCard 
            title="Competitor Alerts" 
            value={losingProducts}
            subtext="Products where we are losing on price"
            icon={AlertTriangle}
            trend={losingProducts > 0 ? 'negative' : 'positive'}
          />
          <KpiCard 
            title="Monitoring" 
            value={totalProducts}
            subtext="Active SKUs tracked daily"
            icon={CheckCircle}
            trend="neutral"
          />
        </div>

        {/* ALERTS SECTION */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Action Required ({alerts.length})
            </h2>
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <AlertCard 
                  key={idx} 
                  {...alert} 
                  onDismiss={() => setAlerts(prev => prev.filter((_, i) => i !== idx))} 
                />
              ))}
            </div>
          </div>
        )}

        {/* MAIN TABLE SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">Competitive Landscape</h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-1/3">Product Name</th>
                  <th className="px-6 py-4">My Price</th>
                  <th className="px-6 py-4">Market Avg</th>
                  <th className="px-6 py-4">Competitors</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(product => {
                  const marketAvg = product.competitors.reduce((acc, c) => acc + c.price, 0) / product.competitors.length;
                  
                  return (
                    <React.Fragment key={product.id}>
                      <tr 
                        onClick={() => setSelectedProduct(selectedProduct?.id === product.id ? null : product)}
                        className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${selectedProduct?.id === product.id ? 'bg-blue-50/80' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{product.name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-blue-700">{formatCurrency(product.myPrice)}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {formatCurrency(marketAvg)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {product.competitors.map((comp, i) => {
                              const isCheaper = comp.price < product.myPrice;
                              return (
                                <div key={i} className={`flex flex-col px-2 py-1 rounded border ${isCheaper ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                                  <span className="text-[10px] text-slate-500 uppercase font-bold">{comp.name}</span>
                                  <span className={`font-medium ${isCheaper ? 'text-rose-700' : 'text-slate-700'}`}>
                                    {formatCurrency(comp.price)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.myPrice, product.competitors)}`}>
                            {product.status}
                          </span>
                        </td>
                      </tr>
                      {/* EXPANDABLE CHART ROW */}
                      {selectedProduct?.id === product.id && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={5} className="px-6 py-4 border-b border-slate-200">
                            <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-slate-800 text-sm">30-Day Price History</h3>
                                <button className="text-blue-600 text-xs font-medium hover:underline">View Full Analysis</button>
                              </div>
                              <ProductChart product={product} />
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
        </div>
      </main>
    </div>
  );
}