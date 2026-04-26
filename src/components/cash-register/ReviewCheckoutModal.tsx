import React, { useState } from 'react';
import { X, Printer, FileText, Check, Loader2 } from 'lucide-react';
import { PaymentEntry } from './types';

interface ReviewCheckoutModalProps {
  grandTotal: number;
  payments: PaymentEntry[];
  isFinalizing?: boolean;
  onCancel: () => void;
  onConfirm: (printPreference: 'Thermal' | 'A4' | null) => void;
}

export const ReviewCheckoutModal: React.FC<ReviewCheckoutModalProps> = ({
  grandTotal,
  payments,
  isFinalizing = false,
  onCancel,
  onConfirm
}) => {
  const [printPreference, setPrintPreference] = useState<'Thermal' | 'A4' | null>(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const changeDue = Math.max(0, totalPaid - grandTotal);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div className="bg-[var(--bg-card)] w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 border border-[var(--border-base)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[var(--border-base)] bg-[var(--bg-app)]">
          <h2 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">Review Sale</h2>
          <button 
            onClick={onCancel}
            disabled={isFinalizing}
            className="text-[var(--text-muted-more)] hover:text-[var(--text-main)] transition-colors disabled:opacity-30"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Totals Box */}
          <div className="bg-[var(--bg-app)] border-2 border-[var(--brand-primary)]/20 p-8 flex flex-col items-center justify-center space-y-2 rounded-sm shadow-inner">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Total Amount</span>
            <span className="text-6xl font-black text-[var(--text-main)] tracking-tighter">€{grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment Summary */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[var(--text-muted-more)] uppercase tracking-[0.15em] border-b border-[var(--border-base)] pb-2">Payment Details</h3>
            <div className="space-y-2">
              {payments.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm font-bold text-[var(--text-main)]">
                  <span className="opacity-70">{p.method}</span>
                  <span className="font-mono">€{p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            {changeDue > 0.005 && (
              <div className="flex justify-between items-center text-2xl font-black text-red-600 pt-4 border-t-2 border-dashed border-[var(--border-base)] mt-4 animate-pulse">
                <span className="uppercase tracking-tight text-sm">Change Due</span>
                <span className="font-mono">€{changeDue.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Receipt Options */}
          <div className="space-y-4 pt-6 border-t border-[var(--border-base)]">
            <h3 className="text-[10px] font-black text-[var(--text-muted-more)] uppercase tracking-[0.15em]">Receipt Style</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPrintPreference(printPreference === 'Thermal' ? null : 'Thermal')}
                disabled={isFinalizing}
                className={`py-4 flex items-center justify-center gap-3 border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                  printPreference === 'Thermal' 
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-lg' 
                    : 'border-[var(--border-base)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--text-muted-more)]'
                }`}
              >
                <Printer size={16} />
                Thermal
              </button>
              <button
                onClick={() => setPrintPreference(printPreference === 'A4' ? null : 'A4')}
                disabled={isFinalizing}
                className={`py-4 flex items-center justify-center gap-3 border-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                  printPreference === 'A4' 
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white shadow-lg' 
                    : 'border-[var(--border-base)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:border-[var(--text-muted-more)]'
                }`}
              >
                <FileText size={16} />
                A4
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex">
          <button 
            onClick={onCancel}
            disabled={isFinalizing}
            className="flex-1 py-6 font-black text-[var(--text-muted)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] uppercase tracking-widest text-[10px] transition-colors border-t border-r border-[var(--border-base)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(printPreference)}
            disabled={isFinalizing}
            className={`flex-[2] py-6 font-black text-white uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              isFinalizing 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-[#22c55e] hover:bg-[#16a34a] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
            }`}
          >
            {isFinalizing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={18} strokeWidth={3} />
                Finalize Transaction
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
