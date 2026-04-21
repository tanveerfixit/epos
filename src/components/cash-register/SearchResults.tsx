import React from 'react';
import { Product } from '../../types';

interface SearchResultsProps {
  results: Product[];
  searchQuery: string;
  onAddProduct: (product: Product) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchQuery,
  onAddProduct
}) => {
  if (results.length === 0) return null;

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} className="text-teal-500 font-bold">{part}</span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="absolute top-full left-0 right-0 z-[60] bg-[var(--bg-card)] border-x border-b border-[var(--border-base)] rounded-b-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-1 duration-200">
      <div className="pt-2">
        {results.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddProduct(product)}
            className="w-full text-left px-5 py-2.5 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 text-sm font-normal text-[var(--text-main)] group"
          >
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className="truncate font-medium group-hover:text-[var(--text-main)]">
                {highlightText(product.product_name, searchQuery)}
              </p>
              <span className="text-slate-300">|</span>
              <p className="text-[11px] text-[var(--text-main)] font-mono uppercase tracking-tighter">
                {product.sku_code || 'N/A'} • {product.total_stock || 0} STOCK
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <span className="text-[var(--text-main)] font-bold">€{product.selling_price.toFixed(2)}</span>
              <span className="text-blue-600 font-black text-xl leading-none opacity-0 group-hover:opacity-100 transition-opacity">+</span>
            </div>
          </button>
        ))}
      </div>
      <div className="bg-[var(--bg-app)] px-5 py-2 border-t border-[var(--border-base)] text-[10px] text-[var(--text-muted)] italic">
        Press enter to add the first result or click an item
      </div>
    </div>
  );
};
