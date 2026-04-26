import React, { useState, useEffect } from 'react';
import { X, Save, Info } from 'lucide-react';
import { CartItem } from './types';

interface UpdateCartModalProps {
  item: CartItem;
  onClose: () => void;
  onSave: (updatedItem: Partial<CartItem>) => void;
}

export const UpdateCartModal: React.FC<UpdateCartModalProps> = ({
  item,
  onClose,
  onSave
}) => {
  // Use string states to allow empty inputs during typing (Senior UX approach)
  const [unitPrice, setUnitPrice] = useState<string>(String(item.customPrice ?? item.selling_price));
  const [quantity, setQuantity] = useState<string>(String(item.quantity));
  const [discount, setDiscount] = useState<string>(String(item.discount || 0));
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(item.discountType || 'percentage');
  const [notes, setNotes] = useState<string>(item.notes || '');

  const [subtotal, setSubtotal] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const p = parseFloat(unitPrice) || 0;
    const q = parseInt(quantity) || 0;
    const d = parseFloat(discount) || 0;

    const calculatedSubtotal = p * q;
    let calculatedTotal = calculatedSubtotal;

    if (discountType === 'percentage') {
      calculatedTotal = calculatedSubtotal * (1 - d / 100);
    } else {
      calculatedTotal = calculatedSubtotal - d;
    }

    setSubtotal(calculatedSubtotal);
    setTotal(Math.max(0, calculatedTotal));
  }, [unitPrice, quantity, discount, discountType]);

  const handleSave = () => {
    const q = parseInt(quantity);
    if (isNaN(q) || q <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    
    onSave({
      customPrice: parseFloat(unitPrice) || 0,
      quantity: q,
      discount: parseFloat(discount) || 0,
      discountType,
      notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] rounded-md shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-[var(--border-base)]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border-base)] flex justify-between items-center bg-[var(--bg-header)]">
          <h3 className="text-sm font-black text-[var(--text-main)] uppercase tracking-widest">Update POS Cart</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-muted-more)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-start gap-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-400">{item.product_name}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-500 font-mono uppercase mt-0.5">{item.sku_code || 'No SKU'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Unit Price (€)</label>
              <input 
                type="text" // Using text to avoid browser-specific number input quirks with empty values
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value.replace(/[^0-9.]/g, ''))}
                onFocus={(e) => e.target.select()}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Quantity (Required)</label>
              <input 
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ''))}
                onFocus={(e) => e.target.select()}
                className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="1"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Discount</label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={discount}
                onChange={(e) => setDiscount(e.target.value.replace(/[^0-9.]/g, ''))}
                onFocus={(e) => e.target.select()}
                className="flex-1 bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="0"
              />
              <select 
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                className="bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="percentage">%</option>
                <option value="fixed">€</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all min-h-[80px]"
              placeholder="Add any internal notes about this item..."
            />
          </div>

          <div className="pt-2 grid grid-cols-2 gap-4 border-t border-[var(--border-base)] mt-2">
            <div>
              <p className="text-[10px] font-bold text-[var(--text-muted-more)] uppercase tracking-wider">Subtotal</p>
              <p className="text-lg font-mono text-[var(--text-main)]">€{subtotal.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Total</p>
              <p className="text-lg font-mono font-black text-blue-600">€{total.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[var(--bg-app)] border-t border-[var(--border-base)] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 rounded font-bold text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-all border border-[var(--border-base)] uppercase text-xs tracking-widest"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-2.5 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            <Save size={16} />
            Update Item
          </button>
        </div>
      </div>
    </div>
  );
};
