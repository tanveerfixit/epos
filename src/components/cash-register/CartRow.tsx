import React from 'react';
import { Minus, Plus, Trash2, Smartphone } from 'lucide-react';
import { CartItem } from './types';

interface CartRowProps {
  item: CartItem;
  onUpdateQuantity: (id: number, delta: number, deviceId?: number) => void;
  onUpdatePrice: (id: number, newPrice: number, deviceId?: number) => void;
  onRemove: (id: number, deviceId?: number) => void;
  onOpenImeiSelector: (product: any) => void;
}

export const CartRow: React.FC<CartRowProps> = ({
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  onOpenImeiSelector
}) => {
  const price = item.customPrice ?? item.selling_price;
  const total = price * item.quantity;

  return (
    <tr className="group hover:bg-[var(--bg-hover)] transition-colors">
      <td className="py-4 pl-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <p className="font-bold text-[var(--text-main)]">{item.product_name}</p>
            <span className="text-[var(--text-muted-more)]">|</span>
            <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-tighter">
              {item.sku_code || 'N/A'}
            </span>
            {item.product_type === 'serialized' && (
              <>
                <span className="text-[var(--text-muted-more)]">|</span>
                <button 
                  onClick={() => onOpenImeiSelector(item)}
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter transition-colors ${
                    item.imei 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                  }`}
                >
                  {item.imei || 'Select IMEI'}
                </button>
              </>
            )}
          </div>
        </div>
      </td>
      <td className="py-4 text-right">
        <div className="flex items-center justify-end">
          <span className="text-[var(--text-muted-more)] mr-1">€</span>
          <input 
            type="number"
            value={price}
            onChange={(e) => onUpdatePrice(item.id, parseFloat(e.target.value) || 0, item.device_id)}
            onFocus={(e) => e.target.select()}
            className="w-20 text-right font-mono font-bold text-[var(--text-main)] bg-transparent border-b border-transparent hover:border-[var(--border-base)] focus:border-blue-500 focus:outline-none transition-all"
            step="0.01"
          />
        </div>
      </td>
      <td className="py-4">
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => onUpdateQuantity(item.id, -1, item.device_id)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-card)] hover:shadow-sm text-[var(--text-muted-more)] hover:text-[var(--text-main)] transition-all border border-transparent hover:border-[var(--border-base)]"
          >
            <Minus size={14} />
          </button>
          <div className="w-10 text-center font-mono font-bold text-[var(--text-main)] text-sm bg-[var(--bg-app)] py-1 rounded-md border border-[var(--border-base)]">
            {item.quantity}
          </div>
          <button 
            onClick={() => onUpdateQuantity(item.id, 1, item.device_id)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-card)] hover:shadow-sm text-[var(--text-muted-more)] hover:text-[var(--text-main)] transition-all border border-transparent hover:border-[var(--border-base)]"
          >
            <Plus size={14} />
          </button>
        </div>
      </td>
      <td className="py-4 text-right">
        <span className="font-mono font-bold text-blue-600">€{total.toFixed(2)}</span>
      </td>
      <td className="py-4 pr-4 text-right">
        <button 
          onClick={() => onRemove(item.id, item.device_id)}
          className="p-2 text-[var(--text-muted-more)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};
