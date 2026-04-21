import { useState, useEffect } from 'react';
import { Search, List, X } from 'lucide-react';
import { Invoice } from '../types';

interface Props {
  onSelectInvoice: (id: number) => void;
  onSelectCustomer?: (id: number) => void;
}

export default function InvoiceList({ onSelectInvoice, onSelectCustomer }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering states
  const getLocalDateString = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'weekly' | 'monthly' | 'custom'>('today');
  const [customStart, setCustomStart] = useState(getLocalDateString());
  const [customEnd, setCustomEnd] = useState(getLocalDateString());
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let start = '';
      let end = '';
      const today = new Date();
      
      if (dateRange === 'today') {
        const str = getLocalDateString(today);
        start = str;
        end = str;
      } else if (dateRange === 'yesterday') {
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        const str = getLocalDateString(yest);
        start = str;
        end = str;
      } else if (dateRange === 'weekly') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        start = getLocalDateString(sevenDaysAgo);
        end = getLocalDateString(today);
      } else if (dateRange === 'monthly') {
        start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        end = getLocalDateString(today);
      } else if (dateRange === 'custom') {
        start = customStart;
        end = customEnd;
      }

      const res = await fetch(`/api/invoices?startDate=${start}&endDate=${end}`);
      const data = await res.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [dateRange, customStart, customEnd]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(lowerSearch) ||
      (inv.customer_name || '').toLowerCase().includes(lowerSearch)
    );
  });

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)] select-none transition-colors duration-300">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-[var(--bg-card)] border-b border-[var(--border-base)] shrink-0">
        <h2 className="text-xl font-medium text-[var(--text-main)]">Sales Invoices</h2>
        <button className="bg-[var(--bg-card)] border border-[var(--border-base)] hover:bg-[var(--bg-app)] text-[var(--text-main)] font-medium py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all shadow-sm">
          <List size={16} />
          Cash Register
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 flex flex-wrap gap-2 items-center bg-[var(--bg-card)] border-b border-[var(--border-base)] shrink-0">
        <div className="flex items-center gap-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48 h-9"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="weekly">Weekly (Last 7 Days)</option>
            <option value="monthly">Monthly (This Month)</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-2 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[#3498db] h-9"
              />
              <span className="text-[var(--text-muted)] text-sm">to</span>
              <input 
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-2 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[#3498db] h-9"
              />
            </div>
          )}
        </div>

        <select className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48 h-9 opacity-50 cursor-not-allowed">
          <option>All Types</option>
        </select>
        
        <div className="relative flex-1 max-w-md ml-auto">
          <input
            type="text"
            placeholder="Search Customer or Invoice"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-1.5 bg-[var(--bg-card)] border border-[var(--border-base)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db] h-9 text-[var(--text-main)]"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2">
            <Search size={16} className="text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse bg-[var(--bg-card)]">
            <thead>
              <tr className="bg-[var(--bg-app)] border-b border-[var(--border-base)] text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-24">Date</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-24">Time</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-32">Invoice#</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)]">Customer Name</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-40">Sales Person</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-right w-28">Taxable</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-right w-28">Taxes</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-right w-28">Non Taxable</th>
                <th className="px-4 py-2 text-right w-28">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-slate-400">Loading invoices...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-slate-400 italic text-sm">No invoices found for the selected period.</td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, idx) => (
                  <tr 
                    key={invoice.id} 
                    className={`border-b border-[var(--border-base)] text-sm hover:bg-[var(--bg-hover)] transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-[var(--bg-app)]/30' : ''}`}
                    onClick={() => onSelectInvoice(invoice.id)}
                  >
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted)]">{formatDate(invoice.created_at)}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted)]">{formatTime(invoice.created_at)}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] font-mono text-[var(--text-muted-more)]">{invoice.invoice_number}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-main)]">
                      {invoice.customer_id ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomer?.(invoice.customer_id!);
                          }}
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        >
                          {invoice.customer_name}
                        </button>
                      ) : (
                        <span className="text-[var(--text-muted)] italic text-xs uppercase tracking-tight font-bold opacity-60">Walk-in</span>
                      )}
                    </td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted)]">Phone Lab</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-right text-[var(--text-main)] font-mono">€{invoice.subtotal.toFixed(2)}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-right text-[var(--text-main)] font-mono">€{invoice.tax_total.toFixed(2)}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-right text-[var(--text-main)] font-mono">€0.00</td>
                    <td className="px-4 py-2 text-right font-bold text-[var(--text-main)] font-mono">€{invoice.grand_total.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-base)] flex justify-between items-center text-xs text-[var(--text-muted)] shrink-0">
        <div className="flex items-center gap-4">
          <select className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-2 py-1 focus:outline-none text-[var(--text-main)]">
            <option>auto</option>
          </select>
          <span className="font-bold">1-{filteredInvoices.length}/{invoices.length}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-app)]">«</button>
          <button className="px-3 py-1 bg-[#3498db] text-white rounded font-bold">1</button>
          <button className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-app)]">»</button>
        </div>
      </div>
    </div>
  );
}
