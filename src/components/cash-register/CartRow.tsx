import React from 'react';
import { Minus, Plus, Trash2, Pencil, Smartphone } from 'lucide-react';
import { CartItem } from './types';

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

export const CartRow: React.FC<CartRowProps> = ({
  item,
  index,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  onOpenImeiSelector,
  onEdit,
  onSelectProduct
}) => {
  const itemPrice = item.customPrice ?? item.selling_price;
  
  // Calculate total with discount
  let total = itemPrice * item.quantity;
  if (item.discount) {
    if (item.discountType === 'percentage') {
      total = total * (1 - item.discount / 100);
    } else {
      total = total - item.discount;
    }
  }
  total = Math.max(0, total);

  return (
    <tr className="group border-b border-[var(--border-base)] hover:bg-[var(--bg-hover)] transition-colors">
      {/* Index Column */}
      <td className="py-2 pl-3 text-center">
        <span className="text-sm font-bold text-[var(--text-muted-more)]">#{index + 1}</span>
      </td>

      {/* Description Column */}
      <td className="py-2 px-3 min-w-[250px]">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[15px] font-bold text-[var(--text-main)] leading-tight">{item.product_name}</span>
            <button 
              onClick={() => onSelectProduct?.(item.id)}
              className="text-[11px] font-mono font-bold text-blue-600 hover:underline hover:text-blue-700 uppercase"
            >
              {item.sku_code || item.barcode || `SKU-${item.id}`}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {item.device_id && (
              <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                <Smartphone size={10} />
                {item.imei}
              </span>
            )}
            {item.discount && (
              <span className="text-[10px] font-bold text-[var(--brand-success)] bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                -{item.discount}{item.discountType === 'percentage' ? '%' : '€'}
              </span>
            )}
          </div>
          {item.notes && (
            <p className="text-xs text-[var(--text-muted)] italic mt-1 line-clamp-1">"{item.notes}"</p>
          )}
        </div>
      </td>

      {/* Metrics Column (Need/Have/OnPO) */}
      <td className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center" title="Need">
            <span className="text-sm font-mono text-[var(--text-main)]">0</span>
          </div>
          <div className="w-[1px] h-4 bg-[var(--border-base)]" />
          <div className="flex flex-col items-center" title="Have">
            <span className={`text-sm font-mono font-bold ${(item.total_stock || 0) > 0 ? 'text-[var(--brand-success)]' : 'text-[var(--brand-danger)]'}`}>
              {item.total_stock || 0}
            </span>
          </div>
          <div className="w-[1px] h-4 bg-[var(--border-base)]" />
          <div className="flex flex-col items-center" title="OnPO">
            <span className="text-sm font-mono text-[var(--text-main)]">0</span>
          </div>
        </div>
      </td>

      {/* Quantity Column */}
      <td className="py-2 px-3">
        <div className="flex items-center justify-center gap-2">
          <button 
            onClick={() => onUpdateQuantity(item.id, -1, item.device_id)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[var(--border-base)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] transition-all"
          >
            <Minus size={14} />
          </button>
          <span className="w-8 text-center font-mono font-bold text-base text-[var(--text-main)]">{item.quantity}</span>
          <button 
            onClick={() => onUpdateQuantity(item.id, 1, item.device_id)}
            className="w-7 h-7 flex items-center justify-center rounded border border-[var(--border-base)] hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 text-[var(--text-main)] transition-all"
          >
            <Plus size={14} />
          </button>
        </div>
      </td>

      {/* Unit Price Column */}
      <td className="py-2 px-3 text-right">
        <span className="text-[15px] font-mono text-[var(--text-main)]">€{itemPrice.toFixed(2)}</span>
      </td>

      {/* Total Column */}
      <td className="py-2 px-3 text-right">
        <span className="text-[15px] font-mono font-black text-blue-600">€{total.toFixed(2)}</span>
      </td>

      {/* Actions Column */}
      <td className="py-2 pr-3 text-right">
        <div className="flex items-center justify-end gap-1">
          <button 
            onClick={() => onEdit(item)}
            className="p-2 text-[var(--text-main)] hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-all"
            title="Edit Item"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => onRemove(item.id, item.device_id)}
            className="p-2 text-[var(--text-main)] hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
            title="Remove Item"
          >
            <Trash2 size={16} className="text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
};
