import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  List, 
  Save, 
  ChevronDown, 
  FileText, 
  Euro,
  Calculator,
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  X,
  ExternalLink
} from 'lucide-react';
import { Payment, ClosingReport, ClosingReportPayment } from '../types';

interface CashCounterProps {
  onClose: () => void;
  onConfirm: (total: number) => void;
  initialTotal?: number;
}

const CashCounter: React.FC<CashCounterProps> = ({ onClose, onConfirm }) => {
  const denominations = [
    { label: '€500', value: 500 },
    { label: '€200', value: 200 },
    { label: '€100', value: 100 },
    { label: '€50', value: 50 },
    { label: '€20', value: 20 },
    { label: '€10', value: 10 },
    { label: '€5', value: 5 },
    { label: '€2', value: 2 },
    { label: '€1', value: 1 },
    { label: '€0.50', value: 0.5 },
    { label: '€0.20', value: 0.2 },
    { label: '€0.10', value: 0.1 },
    { label: '€0.05', value: 0.05 },
    { label: '€0.02', value: 0.02 },
    { label: '€0.01', value: 0.01 },
  ];

  const [counts, setCounts] = useState<Record<number, number>>(
    denominations.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {})
  );

  const total = Object.entries(counts).reduce((sum, [val, count]) => sum + (Number(val) * count), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calculator size={20} className="text-blue-500" />
            Cash Drawer Counter
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {denominations.map((d) => (
            <div key={d.value} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100">
              <span className="text-sm font-bold text-slate-700 w-16">{d.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">x</span>
                <input 
                  type="number" 
                  min="0"
                  value={counts[d.value] || ''}
                  onChange={(e) => setCounts(prev => ({ ...prev, [d.value]: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <span className="text-sm font-mono font-bold text-slate-600 w-24 text-right">
                  €{(counts[d.value] * d.value).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Counted</p>
            <p className="text-2xl font-black">€{total.toFixed(2)}</p>
          </div>
          <button 
            onClick={() => onConfirm(total)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition-all shadow-lg shadow-blue-900/20"
          >
            Apply Total
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EndOfDay() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [otherMovements, setOtherMovements] = useState<Payment[]>([]);
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [comments, setComments] = useState('');

  // Cash Counter Modal State
  const [showCashCounter, setShowCashCounter] = useState<'counted' | 'starting' | null>(null);

  // Counted values state
  const [countedValues, setCountedValues] = useState<Record<string, number>>({
    'Cash': 0,
    'Debit Card': 0,
    'Credit Card': 0,
    'Customer Deposit': 0,
    'Refunds': 0
  });

  useEffect(() => {
    fetchEodData();
  }, [reportDate]);

  const fetchEodData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/eod-data?date=${reportDate}`);
      const data = await response.json();
      setInvoicePayments(data.invoicePayments || []);
      setOtherMovements(data.otherMovements || []);
    } catch (error) {
      console.error('Error fetching EOD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (paymentId: number, newMethod: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: newMethod })
      });
      if (res.ok) {
        fetchEodData();
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };

  // Calculation Logic
  const getCalculatedAmount = (type: string) => {
    if (type === 'Cash') {
      return invoicePayments
        .filter(p => p.method.toLowerCase() === 'cash')
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Debit Card') {
      return invoicePayments
        .filter(p => p.method.toLowerCase().includes('debit'))
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Credit Card') {
      return invoicePayments
        .filter(p => p.method.toLowerCase().includes('credit'))
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Customer Deposit') {
      return otherMovements
        .filter(p => p.type === 'deposit')
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Refunds') {
      return invoicePayments
        .filter(p => p.amount < 0)
        .reduce((sum, p) => sum + p.amount, 0);
    }
    return 0;
  };

  const paymentTypes = ['Cash', 'Debit Card', 'Credit Card', 'Customer Deposit', 'Refunds'];
  
  const summaries = paymentTypes.map(type => {
    const calculated = getCalculatedAmount(type);
    const counted = countedValues[type] || 0;
    return {
      payment_type: type,
      calculated,
      counted,
      difference: counted - calculated
    };
  });

  const totalSales = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDeposits = otherMovements.filter(p => p.type === 'deposit').reduce((sum, p) => sum + p.amount, 0);
  
  const cashSales = getCalculatedAmount('Cash');
  const calculatedCashTotal = cashSales + totalDeposits + startingBalance;
  const cashCounted = countedValues['Cash'] || 0;
  const cashDifference = cashCounted - calculatedCashTotal;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    const report: ClosingReport = {
      branch_id: 1,
      user_id: 1,
      report_date: reportDate,
      starting_balance: startingBalance,
      cash_counted: cashCounted,
      calculated_cash: calculatedCashTotal,
      difference: cashDifference,
      total_sales: totalSales,
      total_deposits: totalDeposits,
      total_cash_in_drawer: cashCounted,
      comments,
      payment_summaries: summaries
    };

    try {
      const response = await fetch('/api/reports/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'End of Day report saved successfully!' });
      } else {
        throw new Error('Failed to save report');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving report: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium tracking-wide">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white select-none">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-tighter">End of Day Report</h1>
            <div className="flex items-center gap-2 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
              <span className="text-xs font-bold text-slate-600">
                {reportDate.split('-').reverse().join('-')}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
              <List size={14} />
              REPORT HISTORY
            </button>
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 text-white rounded text-[11px] font-bold hover:bg-cyan-600 transition-colors">
                <Printer size={14} />
                PRINT REPORT
                <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={() => window.print()} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">Full Page Printer</button>
                <button onClick={() => window.print()} className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50">Thermal Printer</button>
              </div>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1" />
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1 bg-emerald-500 text-white rounded text-[11px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={14} />
                  SAVE CLOSING
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="flex items-center gap-6 px-4 py-1.5 bg-slate-50 border-t border-slate-200 text-[10px] font-bold">
          <span>
            <span className="text-slate-400 uppercase tracking-widest mr-2">Calculated :</span>
            <span className="text-slate-700">€{calculatedCashTotal.toFixed(2)}</span>
          </span>
          <span>
            <span className="text-slate-400 uppercase tracking-widest mr-2">Counted :</span>
            <span className="text-slate-700">€{cashCounted.toFixed(2)}</span>
          </span>
          <span>
            <span className="text-slate-400 uppercase tracking-widest mr-2">Draft Difference :</span>
            <span className={cashDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {cashDifference >= 0 ? '+' : ''}€{cashDifference.toFixed(2)}
            </span>
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {message && (
          <div className={`p-3 m-4 rounded flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-xs font-bold">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto underline text-[10px]">Dismiss</button>
          </div>
        )}

        {/* Reconciliation Section */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left: Input Panel */}
          <div className="lg:w-1/2 p-6 space-y-6">
            <div>
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Reconciliation Inputs</h2>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-bold text-slate-700">Cash Counted</label>
                    <p className="text-[10px] text-slate-400">Total in drawer</p>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                      <input 
                        type="number" 
                        value={countedValues['Cash']}
                        onChange={(e) => setCountedValues(prev => ({ ...prev, 'Cash': parseFloat(e.target.value) || 0 }))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded font-bold text-slate-700 focus:border-[#80bdff] focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <button 
                      onClick={() => setShowCashCounter('counted')}
                      className="px-3 bg-white border border-slate-300 rounded text-slate-500 hover:text-blue-600 transition-colors"
                      title="Cash Drawer Counter"
                    >
                      <Calculator size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-1/3">
                    <label className="text-xs font-bold text-slate-700">Starting Balance</label>
                    <p className="text-[10px] text-slate-400">Opening float</p>
                  </div>
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                      <input 
                        type="number" 
                        value={startingBalance}
                        onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded font-bold text-slate-700 focus:border-[#80bdff] focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <button 
                      onClick={() => setShowCashCounter('starting')}
                      className="px-3 bg-white border border-slate-300 rounded text-slate-500 hover:text-blue-600 transition-colors"
                      title="Opening Drawer Counter"
                    >
                      <Calculator size={18} />
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Closing Comments</label>
                  <textarea 
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-[#80bdff] focus:outline-none transition-all resize-none"
                    placeholder="Note any discrepancies or events..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Summaries */}
          <div className="lg:w-1/2">
             <table className="w-full text-left border-collapse border-b border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Type</th>
                  <th className="py-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">system</th>
                  <th className="py-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">counted</th>
                  <th className="py-2 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summaries.map((s, idx) => (
                  <tr key={idx} className={s.payment_type === 'Cash' ? 'bg-slate-50/50' : ''}>
                    <td className="py-2.5 px-4 text-xs font-bold text-slate-700">{s.payment_type}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-500">€{s.calculated.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right">
                      {s.payment_type === 'Cash' ? (
                        <span className="font-mono font-bold text-xs">€{s.counted.toFixed(2)}</span>
                      ) : (
                        <input 
                          type="number" 
                          value={s.counted || ''}
                          onChange={(e) => setCountedValues(prev => ({ ...prev, [s.payment_type]: parseFloat(e.target.value) || 0 }))}
                          className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono font-bold text-xs focus:outline-none"
                          placeholder="0.00"
                        />
                      )}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold text-xs ${
                      s.difference === 0 ? 'text-slate-400' : 
                      s.difference > 0 ? 'text-emerald-600' : 
                      'text-red-600'
                    }`}>
                      {s.difference !== 0 && (s.difference >= 0 ? '+' : '')}€{s.difference.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-bold">
                  <td className="py-3 px-4 text-xs uppercase tracking-widest">Closing Total</td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-slate-400">€{(summaries.reduce((sum, s) => sum + s.calculated, 0)).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-xs">€{(summaries.reduce((sum, s) => sum + s.counted, 0)).toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-mono text-xs ${(summaries.reduce((sum, s) => sum + s.difference, 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    €{(summaries.reduce((sum, s) => sum + s.difference, 0)).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Transaction Detail Section (Invoice Information) */}
        <div className="bg-white">
          <div className="px-6 py-4">
            <h2 className="text-[10px] font-black text-black uppercase tracking-widest leading-none">Transaction & Payment Details (All Invoices)</h2>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-300 border-b border-slate-400 text-[10px] font-black text-black uppercase tracking-widest">
                <th className="py-3 px-6">User</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-6 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoicePayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs italic font-medium">No invoice-linked payments recorded for this date.</td>
                </tr>
              ) : (
                invoicePayments.map((payment, idx) => (
                  <tr 
                    key={idx} 
                    className={`transition-colors group hover:bg-slate-200/50 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
                  >
                    <td className="py-3 px-6 text-xs font-bold text-slate-600">{payment.user_name || 'Staff'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 font-medium">
                      {payment.paid_at ? new Date(payment.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() : '--:--'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-blue-600 font-bold text-xs hover:underline cursor-pointer transition-all">
                          {payment.invoice_number}
                        </span>
                        <ExternalLink size={10} className="text-blue-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-bold text-slate-500 italic">
                      {payment.customer_name || 'Walk-in Customer'}
                    </td>
                    <td className="py-3 px-4">
                      <select 
                        value={payment.method}
                        onChange={(e) => updatePaymentMethod(payment.id, e.target.value)}
                        className="bg-transparent text-[11px] font-black text-slate-600 border-none p-0 focus:ring-0 outline-none cursor-pointer hover:text-blue-600 transition-colors uppercase tracking-tight"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Wallet">Wallet</option>
                        <option value="Other">Other</option>
                      </select>
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-black text-xs text-slate-900">
                      €{payment.amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Counter Modal */}
      {showCashCounter && (
        <CashCounter 
          onClose={() => setShowCashCounter(null)}
          onConfirm={(total) => {
            if (showCashCounter === 'counted') {
              setCountedValues(prev => ({ ...prev, 'Cash': total }));
            } else {
              setStartingBalance(total);
            }
            setShowCashCounter(null);
          }}
        />
      )}
    </div>
  );
}
