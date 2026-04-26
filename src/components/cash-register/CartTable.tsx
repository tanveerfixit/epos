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
  onEdit: (item: CartItem) => void;
  onSelectProduct?: (id: number) => void;
}

interface CartRowProps {
  item: CartItem;
  index: number;
  onUpdateQuantity: (id: number, delta: number, deviceId?: number) => void;
  onUpdatePrice: (id: number, newPrice: number, deviceId?: number) => void;
  onRemove: (id: number, deviceId?: number) => void;
  onOpenImeiSelector: (product: any) => void;
  onEdit: (item: CartItem) => void;
  onSelectProduct?: (id: number) => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  onOpenImeiSelector,
  onEdit,
  onSelectProduct
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-base)] overflow-hidden flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2 border-b border-[var(--border-base)] bg-[var(--bg-header)] flex justify-between items-center">
        <h2 className="text-[10px] font-black text-[var(--text-main)] uppercase tracking-widest">Current Cart</h2>
        <span className="text-[10px] font-bold text-[var(--text-main)] uppercase tracking-widest">
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
            <thead className="sticky top-0 bg-[var(--bg-app)] border-b border-[var(--border-base)] z-10">
              <tr className="bg-[var(--bg-app)] border-b border-[var(--border-base)] text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                <th className="py-2 pl-3 text-center w-12">#</th>
                <th className="py-2 px-3 text-left">Description</th>
                <th className="py-2 px-3 text-center w-32">Inventory</th>
                <th className="py-2 px-3 text-center w-32">Qty</th>
                <th className="py-2 px-3 text-right w-28">Price</th>
                <th className="py-2 px-3 text-right w-28">Total</th>
                <th className="py-2 pr-3 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-base)]">
              {cart.map((item, idx) => (
                <CartRow 
                  key={`${item.id}-${item.device_id || idx}`}
                  item={item}
                  index={idx}
                  onUpdateQuantity={onUpdateQuantity}
                  onUpdatePrice={onUpdatePrice}
                  onRemove={onRemove}
                  onOpenImeiSelector={onOpenImeiSelector}
                  onEdit={onEdit}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
