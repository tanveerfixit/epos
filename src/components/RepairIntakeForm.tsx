import React, { useState, useEffect } from 'react';
import { X, Plus, Smartphone, User, CreditCard, Banknote, Wallet, MoreHorizontal } from 'lucide-react';
import { Customer } from '../types';

interface RepairIntakeFormProps {
  onClose: () => void;
  onSuccess: (jobId: number) => void;
  initialCustomerId?: number | null;
}

export default function RepairIntakeForm({ onClose, onSuccess, initialCustomerId }: RepairIntakeFormProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [formData, setFormData] = useState({
    customer_id: initialCustomerId || null,
    first_name: '',
    last_name: '',
    phone: '',
    country_code: '+353',
    device_model: '',
    issue: '',
    total_quote: 0,
    deposit_paid: 0,
    payment_method: 'Cash'
  });

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched customers:', data?.length);
        setCustomers(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error('Failed to fetch customers:', err));
  }, []);

  // Handle phone search and auto-fill
  useEffect(() => {
    const cleanSearch = searchPhone.replace(/[\s\-\(\)]/g, '');
    const targetLength = cleanSearch.startsWith('0') ? 10 : 9;
    
    if (cleanSearch.length >= targetLength) {
      const match = customers.find(c => {
        const cleanPhone = (c.phone || '').replace(/[\s\-\(\)]/g, '');
        // Must have a phone number to match — prevents Walk-in/empty-phone false positives
        if (!cleanPhone) return false;
        return cleanPhone === cleanSearch || cleanPhone.endsWith(cleanSearch) || cleanSearch.endsWith(cleanPhone);
      });
      
      if (match) {
        setSelectedCustomer(match);
        setFormData(prev => ({ 
          ...prev, 
          customer_id: match.id, 
          first_name: match.first_name || match.name.split(' ')[0] || '',
          last_name: match.last_name || match.name.split(' ').slice(1).join(' ') || '',
          phone: match.phone 
        }));
      } else {
        setSelectedCustomer(null);
        setFormData(prev => ({ ...prev, customer_id: null, phone: searchPhone }));
      }
    } else {
      setSelectedCustomer(null);
      setFormData(prev => ({ ...prev, customer_id: null, phone: searchPhone }));
    }
  }, [searchPhone, customers]);

  const remainingBalance = Math.max(0, formData.total_quote - formData.deposit_paid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        phone: formData.phone.startsWith('+') ? formData.phone : `${formData.country_code}${formData.phone}`,
        remaining_balance: remainingBalance,
        status: 'new'
      };

      const response = await fetch('/api/repairs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to create repair job');
      
      const data = await response.json();
      onSuccess(data.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col h-full max-h-[85vh]">
        {/* Header */}
        <div className="bg-[#e9ecef] px-4 py-3 flex justify-between items-center border-b border-slate-300 shrink-0">
          <h3 className="text-[#333] font-bold text-lg">New Repair Job</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Headers (Stylistic Match) */}
        <div className="px-4 pt-4 flex gap-1 bg-white border-b border-slate-200 shrink-0">
          <div className="px-8 py-2 text-sm font-bold border border-slate-300 border-b-0 rounded-t bg-white text-slate-800 -mb-px relative z-10">
            Job Intake Details
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-4">
          
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-1">
            Customer Information
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">Phone No.<span className="text-red-500">*</span></label>
            <div className="w-2/3 flex gap-2">
              <select 
                className="w-24 border border-[#ced4da] rounded px-2 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none"
                value={formData.country_code}
                onChange={e => setFormData({ ...formData, country_code: e.target.value })}
              >
                <option value="+353">IE +353</option>
                <option value="+44">UK +44</option>
                <option value="+1">US +1</option>
                <option value="+91">IN +91</option>
              </select>
              <input
                required
                type="text"
                className="flex-1 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                placeholder="08X XXX XXXX"
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
              />
            </div>
          </div>

          {selectedCustomer && (
            <div className="flex items-center">
              <div className="w-1/3"></div>
              <div className="w-2/3 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded text-[11px] text-emerald-700 font-bold">
                Existing Customer: {selectedCustomer.name}
              </div>
            </div>
          )}

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">First Name<span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              placeholder="First Name"
              value={formData.first_name}
              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              disabled={!!selectedCustomer}
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">Last Name</label>
            <input
              type="text"
              className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-50"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              disabled={!!selectedCustomer}
            />
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-4 border-b border-slate-100 pb-1">
            Device Details
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">Device Model<span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder="e.g. iPhone 15 Pro"
              value={formData.device_model}
              onChange={e => setFormData({ ...formData, device_model: e.target.value })}
            />
          </div>

          <div className="flex items-start">
            <label className="w-1/3 text-sm font-bold text-slate-700 pt-1">Problem Description<span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
              placeholder="Describe the issue..."
              value={formData.issue}
              onChange={e => setFormData({ ...formData, issue: e.target.value })}
            />
          </div>

          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-4 border-b border-slate-100 pb-1">
            Quote & Payment
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">Total Quote</label>
            <div className="w-2/3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              <input
                type="number"
                step="0.01"
                className="w-full border border-[#ced4da] rounded pl-7 pr-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.total_quote || ''}
                onChange={e => setFormData({ ...formData, total_quote: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">Deposit Paid</label>
            <div className="w-2/3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
              <input
                type="number"
                step="0.01"
                className="w-full border border-[#ced4da] rounded pl-7 pr-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.deposit_paid || ''}
                onChange={e => setFormData({ ...formData, deposit_paid: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">Remaining Balance</label>
            <div className="w-2/3 bg-red-50 border border-red-100 rounded px-3 py-1.5 text-sm font-bold text-red-600">
              €{remainingBalance.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-slate-700">Payment Method</label>
            <select
              className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              value={formData.payment_method}
              onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Wallet">Wallet</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-auto px-4 py-3 border-t border-slate-200 flex justify-end gap-2 bg-[#f8f9fa] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-1.5 bg-[#007bff] hover:bg-[#0069d9] text-white rounded text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Create Repair Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
