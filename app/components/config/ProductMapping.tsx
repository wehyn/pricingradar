"use client";

import { useState } from "react";
import {
  CompetitorProduct,
  InternalProduct,
  ProductMapping as ProductMappingType,
} from "@/lib/scrapers/types";
import { Button, Input, Card } from "../ui";
import { generateId } from "@/lib/scrapers";

interface ProductMappingProps {
  competitorProducts: CompetitorProduct[];
  internalProducts: InternalProduct[];
  mappings: ProductMappingType[];
  onMappingsChange: (mappings: ProductMappingType[]) => void;
  onAddInternalProduct: (product: Omit<InternalProduct, "id">) => void;
}

export function ProductMapping({
  competitorProducts,
  internalProducts,
  mappings,
  onMappingsChange,
  onAddInternalProduct,
}: ProductMappingProps) {
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    currentPrice: "",
    currency: "USD",
  });

  const handleMapProduct = (
    competitorProductId: string,
    internalProductId: string
  ) => {
    // Remove existing mapping for this competitor product
    const filtered = mappings.filter(
      (m) => m.competitorProductId !== competitorProductId
    );

    if (internalProductId) {
      const newMapping: ProductMappingType = {
        id: generateId(),
        competitorProductId,
        internalProductId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onMappingsChange([...filtered, newMapping]);
    } else {
      onMappingsChange(filtered);
    }
  };

  const getMappedInternalProductId = (competitorProductId: string): string => {
    const mapping = mappings.find(
      (m) => m.competitorProductId === competitorProductId
    );
    return mapping?.internalProductId || "";
  };

  const handleAddProduct = () => {
    if (!newProduct.sku || !newProduct.name || !newProduct.currentPrice) return;

    const parsedPrice = parseFloat(newProduct.currentPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return;

    onAddInternalProduct({
      sku: newProduct.sku,
      name: newProduct.name,
      currentPrice: parsedPrice,
      currency: newProduct.currency,
    });

    setNewProduct({ sku: "", name: "", currentPrice: "", currency: "USD" });
    setShowAddProduct(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Product Mappings
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Match competitor products to your internal products for comparison
        </p>
      </div>

      {/* Competitor Products List */}
      <div className="space-y-3">
        {competitorProducts.map((product) => (
          <Card key={product.id} variant="outline" padding="sm">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Competitor Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {product.marketplace === "medsgo"
                      ? "💊"
                      : product.marketplace === "watsons"
                      ? "🏪"
                      : "🔗"}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {product.name || "Product from URL"}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
                  {product.url}
                </p>
              </div>

              {/* Arrow */}
              <div className="hidden md:block text-zinc-400">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>

              {/* Internal Product Selector */}
              <div className="md:w-64">
                <select
                  value={getMappedInternalProductId(product.id)}
                  onChange={(e) => handleMapProduct(product.id, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 
                    bg-white dark:bg-zinc-900 text-sm
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">Select your product...</option>
                  {internalProducts.map((internal) => (
                    <option key={internal.id} value={internal.id}>
                      {internal.sku} - {internal.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Internal Product */}
      {!showAddProduct ? (
        <Button
          variant="outline"
          onClick={() => setShowAddProduct(true)}
          className="w-full"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Your Product
        </Button>
      ) : (
        <Card variant="outline" padding="md">
          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Add Internal Product
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={newProduct.sku}
              onChange={(e) =>
                setNewProduct({ ...newProduct, sku: e.target.value })
              }
              placeholder="e.g., PROD-001"
            />
            <Input
              label="Product Name"
              value={newProduct.name}
              onChange={(e) =>
                setNewProduct({ ...newProduct, name: e.target.value })
              }
              placeholder="e.g., Wireless Mouse"
            />
            <Input
              label="Current Price"
              type="number"
              value={newProduct.currentPrice}
              onChange={(e) =>
                setNewProduct({ ...newProduct, currentPrice: e.target.value })
              }
              placeholder="e.g., 29.99"
            />
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Currency
              </label>
              <select
                value={newProduct.currency}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, currency: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 
                  bg-white dark:bg-zinc-900 text-sm
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="PHP">PHP (₱)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="MYR">MYR (RM)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="THB">THB (฿)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleAddProduct}>Add Product</Button>
            <Button variant="ghost" onClick={() => setShowAddProduct(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Mapping Status */}
      <div className="text-sm text-zinc-500 dark:text-zinc-400">
        {mappings.length} of {competitorProducts.length} products mapped
      </div>
    </div>
  );
}
