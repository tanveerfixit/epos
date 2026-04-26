import React from 'react';
import { Calculator } from 'lucide-react';

interface TotalsPanelProps {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export const TotalsPanel: React.FC<TotalsPanelProps> = ({
  subtotal,
  tax,
  discount,
  total
}) => {
  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Calculator size={18} className="text-[var(--text-main)]" />
        <h3 className="font-bold text-[var(--text-main)] text-sm">Summary</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-main)] font-medium">Subtotal</span>
          <span className="font-mono font-bold text-[var(--text-main)]">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-main)] font-medium">Tax (0%)</span>
          <span className="font-mono font-bold text-[var(--text-main)]">€{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-main)] font-medium">Discount</span>
          <span className="font-mono font-bold text-[var(--text-main)]">-€{discount.toFixed(2)}</span>
        </div>
        <div className="pt-3 border-t border-[var(--border-base)] flex justify-between items-end">
          <span className="font-bold text-[var(--text-main)] uppercase tracking-wider text-xs">Total Amount</span>
          <span className="font-mono text-3xl font-black text-[var(--text-main)] leading-none">€{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
