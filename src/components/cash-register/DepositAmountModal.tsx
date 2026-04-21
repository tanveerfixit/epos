import React, { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { Customer } from '../../types';

interface DepositAmountModalProps {
  customer: Customer | null;
  onClose: () => void;
  onAddDeposit: (amount: number) => void;
}

export const DepositAmountModal: React.FC<DepositAmountModalProps> = ({
  customer,
  onClose,
  onAddDeposit
}) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      onAddDeposit(val);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-blue-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Deposit to Wallet</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {customer && (
              <div className="px-4 py-3 bg-blue-50/50 border border-blue-100 mb-6">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="text-sm font-bold text-blue-800">{customer.name}</p>
                <p className="text-xs font-semibold text-blue-600 mt-1">Current Balance: €{(customer.wallet_balance || 0).toFixed(2)}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Amount to Deposit</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">€</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 text-2xl font-black text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 uppercase tracking-widest text-xs transition-colors border-r border-slate-100"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-4 font-bold text-white bg-blue-600 hover:bg-blue-700 uppercase tracking-widest text-xs transition-colors"
            >
              Add to Cart
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
