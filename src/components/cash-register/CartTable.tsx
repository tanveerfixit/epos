import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartRow } from './CartRow';
import { CartItem } from './types';

interface CartTableProps {
  cart: CartItem[];
  onUpdateQuantity: (id: number, delta: number, deviceId?: number) => void;
  onUpdatePrice: (id: number, newPrice: number, deviceId?: number) => void;
  onRemove: (id: number, deviceId?: number) => void;
  onOpenImeiSelector: (product: any) => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  onOpenImeiSelector
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-base)] overflow-hidden flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2 border-b border-[var(--border-base)] bg-[var(--bg-header)] flex justify-between items-center">
        <h2 className="text-[10px] font-black text-black dark:text-black uppercase tracking-widest">Current Cart</h2>
        <span className="text-[10px] font-bold text-black dark:text-black uppercase tracking-widest">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-[var(--text-muted-more)]">
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm opacity-60">Search for products to add them here</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[var(--bg-card)] z-10">
              <tr className="text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest border-b border-[var(--border-base)]">
                <th className="py-3 pl-4">Product Details</th>
                <th className="py-3 text-right">Price</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Total</th>
                <th className="py-3 pr-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-base)]">
              {cart.map((item, idx) => (
                <CartRow 
                  key={`${item.id}-${item.device_id || idx}`}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onUpdatePrice={onUpdatePrice}
                  onRemove={onRemove}
                  onOpenImeiSelector={onOpenImeiSelector}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
