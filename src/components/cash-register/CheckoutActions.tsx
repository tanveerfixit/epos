import React from 'react';
import { Check, Trash2 } from 'lucide-react';

interface CheckoutActionsProps {
  onCheckout: () => void;
  onClearCart: () => void;
  isCartEmpty: boolean;
  isPaymentComplete: boolean;
}

export const CheckoutActions: React.FC<CheckoutActionsProps> = ({
  onCheckout,
  onClearCart,
  isCartEmpty,
  isPaymentComplete
}) => {
  return (
    <div className="space-y-2.5">
      <button 
        onClick={onCheckout}
        disabled={isCartEmpty || !isPaymentComplete}
        className={`w-full py-3 rounded-md font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 transition-all ${
          isCartEmpty || !isPaymentComplete
            ? 'bg-[var(--bg-app)] text-[var(--text-muted-more)] cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-md shadow-blue-500/10'
        }`}
      >
        <Check size={16} strokeWidth={3} />
        Complete Checkout
      </button>
      
      <button 
        onClick={onClearCart}
        disabled={isCartEmpty}
        className={`w-full py-2.5 rounded-md font-bold text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${
          isCartEmpty
            ? 'text-[var(--text-muted-more)] opacity-30 cursor-not-allowed'
            : 'text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10'
        }`}
      >
        <Trash2 size={13} />
        Discard Transaction
      </button>
    </div>
  );
};
