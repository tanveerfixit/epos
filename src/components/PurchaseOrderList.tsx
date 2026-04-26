import React, { useState, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PurchaseOrder, Supplier } from '../types';

export default function PurchaseOrderList({ onSelectPO }: { onSelectPO: (id: number) => void }) {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/purchase-orders').then(res => res.json()),
      fetch('/api/suppliers').then(res => res.json())
    ]).then(([poData, supplierData]) => {
      setPos(poData);
      setSuppliers(supplierData);
      setLoading(false);
    });
  }, []);

  const filteredPos = pos.filter(po => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (po.lot_ref_no || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSupplier = supplierFilter === '' || po.supplier_id === Number(supplierFilter);
    const matchesStatus = statusFilter === '' || po.status === statusFilter;
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  if (loading) return <div className="p-8 text-center text-[var(--text-muted)] bg-[var(--bg-app)]">Loading Purchase Orders...</div>;

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)]">
      {/* Header */}
      <div className="px-6 py-4 flex justify-between items-center bg-[var(--bg-card)] border-b border-[var(--border-base)]">
        <h2 className="text-xl font-medium text-[var(--text-main)]">Purchase Order</h2>
        <button className="bg-[var(--brand-warning)] hover:bg-[var(--brand-warning-hover)] text-slate-900 font-bold py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all shadow-sm">
          <Plus size={16} />
          Create Purchase Order
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-[var(--bg-hover)] border-b border-[var(--border-base)] flex flex-wrap gap-4 items-center">
        <select className="bg-[var(--bg-input)] border border-[var(--border-header)] rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-[var(--brand-primary)] outline-none min-w-[150px] text-[var(--text-main)]">
          <option>Date, PO</option>
          <option>Lot Ref. No.</option>
          <option>Supplier Inv. No.</option>
        </select>

        <select 
          className="bg-[var(--bg-input)] border border-[var(--border-header)] rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-[var(--brand-primary)] outline-none min-w-[150px] text-[var(--text-main)]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="draft">Draft</option>
          <option value="received">Received</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select 
          className="bg-[var(--bg-input)] border border-[var(--border-header)] rounded px-3 py-1.5 text-sm focus:ring-1 focus:ring-[var(--brand-primary)] outline-none min-w-[150px] text-[var(--text-main)]"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div className="relative flex-1 max-w-md">
          <input 
            type="text" 
            placeholder="PO / Lot Ref./Suppliers Inv. No." 
            className="w-full bg-[var(--bg-input)] border border-[var(--border-header)] rounded py-1.5 pl-3 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-[var(--text-main)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="absolute right-0 top-0 h-full px-3 bg-[var(--bg-accent-subtle)] border-l border-[var(--border-header)] rounded-r hover:bg-[var(--bg-hover)] transition-colors">
            <Search size={16} className="text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-[var(--bg-card)]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--bg-accent-subtle)] border-b border-[var(--border-base)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <th className="px-4 py-3 border-r border-[var(--border-base)]">Date</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)]">PO</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)]">Lot Ref. No.</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)]">Supplier</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)] text-right">Sales Tax</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)] text-right">Shipping Cost</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)] text-right">Total</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)]">Expected</th>
              <th className="px-4 py-3 border-r border-[var(--border-base)]">Return</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-base)] text-sm">
            {filteredPos.map((po) => (
              <tr key={po.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                <td className="px-4 py-2.5 border-r border-[var(--border-base)]">{new Date(po.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)] text-[var(--brand-primary)] font-medium">
                  <button onClick={() => onSelectPO(po.id)} className="hover:underline">
                    {po.po_number}
                  </button>
                </td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)] text-[var(--text-main)]">{po.lot_ref_no}</td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)] text-[var(--text-main)]">{po.supplier_name}</td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)] text-right text-[var(--text-muted)]">€{po.sales_tax.toFixed(2)}</td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)] text-right text-[var(--text-muted)]">€{po.shipping_cost.toFixed(2)}</td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)] text-right font-medium text-[var(--text-main)]">€{po.total.toFixed(2)}</td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)] text-[var(--text-muted)]">{po.expected_at ? new Date(po.expected_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : ''}</td>
                <td className="px-4 py-2.5 border-r border-[var(--border-base)]"></td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    po.status === 'closed' ? 'bg-slate-100 text-slate-600' : 
                    po.status === 'received' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {po.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredPos.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-12 text-center text-[var(--text-muted-more)] bg-[var(--bg-card)]">
                  No purchase orders found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-[var(--border-base)] bg-[var(--bg-zebra)] flex justify-between items-center text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <select className="bg-[var(--bg-card)] border border-[var(--border-header)] rounded px-2 py-1 outline-none text-[var(--text-main)]">
            <option>auto</option>
            <option>25</option>
            <option>50</option>
            <option>100</option>
          </select>
          <span className="font-bold">1-{filteredPos.length}/{filteredPos.length}</span>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30" disabled><ChevronsLeft size={14} /></button>
          <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded disabled:opacity-30" disabled><ChevronLeft size={14} /></button>
          <button className="w-7 h-7 flex items-center justify-center bg-[var(--brand-primary)] text-white rounded font-bold">1</button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded text-[var(--text-main)]">2</button>
          <button className="w-7 h-7 flex items-center justify-center text-[var(--text-muted)]">...</button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded text-[var(--text-main)]">9</button>
          <button className="w-7 h-7 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded text-[var(--text-main)]">10</button>
          <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded"><ChevronRight size={14} /></button>
          <button className="p-1.5 hover:bg-[var(--bg-hover)] rounded"><ChevronsRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
