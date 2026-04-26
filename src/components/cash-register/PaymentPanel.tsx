import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { PaymentEntry } from './types';

interface PaymentPanelProps {
  addedPayments: PaymentEntry[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  onAddPayment: () => void;
  onRemovePayment: (index: number) => void;
  remainingAmount: number;
  customerBalance?: number;
  availableMethods: string[];
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  addedPayments,
  paymentMethod,
  setPaymentMethod,
  paymentAmount,
  setPaymentAmount,
  onAddPayment,
  onRemovePayment,
  remainingAmount,
  customerBalance = 0,
  availableMethods = ['Cash', 'Card']
}) => {
  const paymentMethods = [...availableMethods];
  if (customerBalance > 0 && !paymentMethods.includes('Wallet')) {
    paymentMethods.push('Wallet');
  }

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={18} className="text-[var(--text-main)]" />
        <h3 className="font-bold text-[var(--text-main)] text-sm">Payment</h3>
        {customerBalance > 0 && (
          <span className="ml-auto text-[10px] font-bold text-[var(--brand-success)] bg-[var(--bg-zebra)] px-2 py-0.5 rounded border border-[var(--brand-success)]">
            Wallet: €{customerBalance.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative bg-[var(--bg-card)] rounded-full flex items-center w-full h-10 border border-[var(--border-base)] select-none overflow-hidden">
          {/* Sliding Indicator */}
          <div 
            className="absolute top-0 bottom-0 left-0 bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)] rounded-full shadow-sm transition-all duration-300 ease-out z-0"
            style={{
              width: `calc(100% / ${paymentMethods.length})`,
              transform: `translateX(calc(${paymentMethods.indexOf(paymentMethod) !== -1 ? paymentMethods.indexOf(paymentMethod) : 0} * 100%))`
            }}
          />

          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`
                flex-1 relative z-10 h-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 rounded-full
                ${paymentMethod === method 
                  ? 'text-[var(--brand-primary)]' 
                  : 'text-[var(--text-muted-more)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'}
              `}
            >
              {method}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-more)] font-bold">€</span>
            <input 
              type="number"
              className="w-full pl-7 pr-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-base)] rounded-md text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted-more)]"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <button 
            onClick={onAddPayment}
            className="bg-emerald-600 text-white px-4 rounded-md hover:bg-emerald-700 active:scale-95 transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center"
            title="Take Payment"
          >
            <Plus size={20} strokeWidth={3} />
          </button>
        </div>

        {addedPayments.length > 0 && (
          <div className="space-y-2 pt-2">
            {addedPayments.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[var(--bg-app)] p-2 rounded-md border border-[var(--border-base)] animate-in fade-in slide-in-from-right-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-[var(--bg-card)] px-1.5 py-0.5 rounded shadow-sm text-[var(--text-muted)] uppercase">{p.method}</span>
                  <span className="font-mono font-bold text-[var(--text-main)] text-sm">€{p.amount.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => onRemovePayment(idx)}
                  className="text-[var(--text-muted-more)] hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="flex justify-between items-center px-2 pt-1">
              <span className="text-[10px] font-bold text-[var(--text-muted-more)] uppercase tracking-wider">Remaining</span>
              <span className={`font-mono font-bold text-sm ${remainingAmount > 0 ? 'text-[var(--brand-warning)]' : 'text-[var(--brand-success)]'}`}>
                €{Math.max(0, remainingAmount).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
