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
        className={`w-full py-4 rounded-md font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
          isCartEmpty || !isPaymentComplete
            ? 'bg-[var(--bg-app)] text-[var(--text-muted-more)] cursor-not-allowed border border-[var(--border-base)]'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] shadow-xl shadow-blue-500/20 animate-pulse-subtle'
        }`}
      >
        <Check size={18} strokeWidth={3} className={!isCartEmpty && isPaymentComplete ? 'animate-bounce-short' : ''} />
        Complete Checkout
        {!isCartEmpty && isPaymentComplete && (
          <div className="absolute inset-0 bg-white/10 animate-shine" />
        )}
      </button>
      
      <button 
        onClick={onClearCart}
        disabled={isCartEmpty}
        className={`w-full py-2.5 rounded-md font-bold text-[10px] uppercase tracking-[0.15em] flex items-center justify-center gap-2 transition-all ${
          isCartEmpty
            ? 'text-[var(--text-muted-more)] opacity-30 cursor-not-allowed'
            : 'text-[var(--text-muted)] hover:text-[var(--brand-danger)] hover:bg-[var(--brand-danger)]/10'
        }`}
      >
        <Trash2 size={13} />
        Discard Transaction
      </button>
    </div>
  );
};
