'use client';

import { MarketplaceType } from '@/lib/scrapers/types';
import { SUPPORTED_MARKETPLACES } from '@/lib/scrapers/marketplaces';
import { Card } from '../ui';

interface MarketplaceSelectorProps {
  selected?: MarketplaceType;
  onSelect: (marketplace: MarketplaceType) => void;
}

export function MarketplaceSelector({ selected, onSelect }: MarketplaceSelectorProps) {
  const enabledMarketplaces = SUPPORTED_MARKETPLACES.filter(m => m.enabled);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Select Marketplace
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Choose the marketplace where your competitor sells their products
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {enabledMarketplaces.map((marketplace) => (
          <button
            key={marketplace.id}
            onClick={() => onSelect(marketplace.id)}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200
              hover:scale-[1.02] hover:shadow-md
              ${selected === marketplace.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
              }
            `}
          >
            {selected === marketplace.id && (
              <div className="absolute top-2 right-2">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="text-3xl mb-2">{marketplace.icon}</div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {marketplace.name}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate">
              {marketplace.baseUrl}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
