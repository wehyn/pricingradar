'use client';

import { useState } from 'react';
import { MarketplaceType } from '@/lib/scrapers/types';
import { validateMarketplaceUrl, getMarketplaceConfig } from '@/lib/scrapers/marketplaces';
import { Button, Input } from '../ui';

interface UrlInputProps {
  marketplace: MarketplaceType;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  maxUrls?: number;
}

export function UrlInput({ marketplace, urls, onUrlsChange, maxUrls = 5 }: UrlInputProps) {
  const [newUrl, setNewUrl] = useState('');
  const [error, setError] = useState('');
  
  const marketplaceConfig = getMarketplaceConfig(marketplace);

  const handleAddUrl = () => {
    if (!newUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(newUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    // Marketplace-specific validation
    if (marketplace !== 'custom' && !validateMarketplaceUrl(newUrl, marketplace)) {
      setError(`This doesn't look like a ${marketplaceConfig?.name} URL`);
      return;
    }

    // Check for duplicates
    if (urls.includes(newUrl)) {
      setError('This URL has already been added');
      return;
    }

    // Check max limit
    if (urls.length >= maxUrls) {
      setError(`Maximum ${maxUrls} URLs allowed`);
      return;
    }

    onUrlsChange([...urls, newUrl]);
    setNewUrl('');
    setError('');
  };

  const handleRemoveUrl = (index: number) => {
    onUrlsChange(urls.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddUrl();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Competitor Product URLs
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Add {marketplaceConfig?.name} product URLs to track (2-5 recommended)
        </p>
      </div>

      {/* URL List */}
      {urls.length > 0 && (
        <div className="space-y-2">
          {urls.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg group"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {index + 1}
                </span>
              </div>
              <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300 truncate">
                {url}
              </span>
              <button
                onClick={() => handleRemoveUrl(index)}
                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add URL Input */}
      {urls.length < maxUrls && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Paste ${marketplaceConfig?.name} product URL...`}
              error={error}
            />
          </div>
          <Button onClick={handleAddUrl} variant="secondary" className="flex-shrink-0">
            Add
          </Button>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-500 dark:text-zinc-400">
          {urls.length} of {maxUrls} URLs added
        </span>
        {urls.length >= 2 && (
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Good to go!
          </span>
        )}
      </div>
    </div>
  );
}

