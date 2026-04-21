import React, { useState } from 'react';
import { X, Printer, FileText, Check } from 'lucide-react';
import { PaymentEntry } from './types';

interface ReviewCheckoutModalProps {
  grandTotal: number;
  payments: PaymentEntry[];
  onCancel: () => void;
  onConfirm: (printPreference: 'Thermal' | 'A4' | null) => void;
}

export const ReviewCheckoutModal: React.FC<ReviewCheckoutModalProps> = ({
  grandTotal,
  payments,
  onCancel,
  onConfirm
}) => {
  const [printPreference, setPrintPreference] = useState<'Thermal' | 'A4' | null>(null);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const changeDue = Math.max(0, totalPaid - grandTotal);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Review Sale</h2>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          
          {/* Totals Box */}
          <div className="bg-slate-50 border border-slate-200 p-6 flex flex-col items-center justify-center space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
            <span className="text-5xl font-black text-slate-900 tracking-tighter">€{grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Payments</h3>
            {payments.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm font-medium text-slate-700">
                <span>{p.method}</span>
                <span>€{p.amount.toFixed(2)}</span>
              </div>
            ))}
            
            {changeDue > 0.01 && (
              <div className="flex justify-between items-center text-lg font-bold text-blue-600 pt-3 border-t border-slate-100 mt-3 relative">
                <span className="uppercase tracking-tight">Change Due</span>
                <span>€{changeDue.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Print Preferences Toggle */}
          <div className="space-y-3 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt Options</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPrintPreference(printPreference === 'Thermal' ? null : 'Thermal')}
                className={`py-3 flex items-center justify-center gap-2 border font-bold text-sm uppercase tracking-tight transition-all ${
                  printPreference === 'Thermal' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Printer size={16} />
                Thermal
              </button>
              <button
                onClick={() => setPrintPreference(printPreference === 'A4' ? null : 'A4')}
                className={`py-3 flex items-center justify-center gap-2 border font-bold text-sm uppercase tracking-tight transition-all ${
                  printPreference === 'A4' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <FileText size={16} />
                A4
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex mt-8">
          <button 
            onClick={onCancel}
            className="flex-1 py-5 font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest text-sm transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(printPreference)}
            className="flex-[2] py-5 font-black text-white bg-emerald-600 hover:bg-emerald-700 uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Check size={18} />
            Finalize Transaction
          </button>
        </div>

      </div>
    </div>
  );
};
