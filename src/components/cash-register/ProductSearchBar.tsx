import React from 'react';
import { Search, X, Camera } from 'lucide-react';

interface ProductSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClear: () => void;
}

export const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  onClear
}) => {
  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-12 pr-28 py-3.5 border border-[var(--border-base)] rounded-none bg-[var(--bg-card)] transition-all text-lg hover:shadow-md focus:shadow-md focus:outline-none placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
        placeholder="Search products by name, SKU or scan barcode..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
      />
      <div className="absolute inset-y-0 right-0 pr-5 flex items-center gap-3">
        {searchQuery && (
          <button
            onClick={onClear}
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] border-r border-[var(--border-base)] pr-3 mr-1"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        <button className="text-blue-500 hover:text-blue-600 transition-colors" title="Search by Lens">
          <Camera className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
