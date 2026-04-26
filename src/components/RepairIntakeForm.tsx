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
        <div className="bg-[var(--bg-accent-subtle)] px-4 py-3 flex justify-between items-center border-b border-[var(--border-header)] shrink-0">
          <h3 className="text-[var(--text-main)] font-bold text-lg">New Repair Job</h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Headers (Stylistic Match) */}
        <div className="px-4 pt-4 flex gap-1 bg-[var(--bg-card)] border-b border-[var(--border-base)] shrink-0">
          <div className="px-8 py-2 text-sm font-bold border border-[var(--border-header)] border-b-0 rounded-t bg-[var(--bg-card)] text-[var(--text-main)] -mb-px relative z-10">
            Job Intake Details
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 space-y-4">
          
          <div className="text-[11px] font-bold text-[var(--text-muted-more)] uppercase tracking-wider mb-4 border-b border-[var(--border-base)] pb-1">
            Customer Information
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">Phone No.<span className="text-red-500">*</span></label>
            <div className="w-2/3 flex gap-2">
              <select 
                className="w-24 border border-[var(--border-input)] rounded px-2 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none"
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
                className="flex-1 border border-[var(--border-input)] rounded px-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
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
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">First Name<span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              className="w-2/3 border border-[var(--border-input)] rounded px-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-[var(--bg-hover)]"
              placeholder="First Name"
              value={formData.first_name}
              onChange={e => setFormData({ ...formData, first_name: e.target.value })}
              disabled={!!selectedCustomer}
            />
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">Last Name</label>
            <input
              type="text"
              className="w-2/3 border border-[var(--border-input)] rounded px-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 disabled:bg-[var(--bg-hover)]"
              placeholder="Last Name"
              value={formData.last_name}
              onChange={e => setFormData({ ...formData, last_name: e.target.value })}
              disabled={!!selectedCustomer}
            />
          </div>

          <div className="text-[11px] font-bold text-[var(--text-muted-more)] uppercase tracking-wider mt-6 mb-4 border-b border-[var(--border-base)] pb-1">
            Device Details
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">Device Model<span className="text-red-500">*</span></label>
            <input
              required
              type="text"
              className="w-2/3 border border-[var(--border-input)] rounded px-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              placeholder="e.g. iPhone 15 Pro"
              value={formData.device_model}
              onChange={e => setFormData({ ...formData, device_model: e.target.value })}
            />
          </div>

          <div className="flex items-start">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)] pt-1">Problem Description<span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              className="w-2/3 border border-[var(--border-input)] rounded px-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10 resize-none"
              placeholder="Describe the issue..."
              value={formData.issue}
              onChange={e => setFormData({ ...formData, issue: e.target.value })}
            />
          </div>

          <div className="text-[11px] font-bold text-[var(--text-muted-more)] uppercase tracking-wider mt-6 mb-4 border-b border-[var(--border-base)] pb-1">
            Quote & Payment
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">Total Quote</label>
            <div className="w-2/3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-more)] text-sm">€</span>
              <input
                type="number"
                step="0.01"
                className="w-full border border-[var(--border-input)] rounded pl-7 pr-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.total_quote || ''}
                onChange={e => setFormData({ ...formData, total_quote: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">Deposit Paid</label>
            <div className="w-2/3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-more)] text-sm">€</span>
              <input
                type="number"
                step="0.01"
                className="w-full border border-[var(--border-input)] rounded pl-7 pr-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.deposit_paid || ''}
                onChange={e => setFormData({ ...formData, deposit_paid: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">Remaining Balance</label>
            <div className="w-2/3 bg-red-50 border border-red-100 rounded px-3 py-1.5 text-sm font-bold text-red-600">
              €{remainingBalance.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center">
            <label className="w-1/3 text-sm font-bold text-[var(--text-main)]">Payment Method</label>
            <select
              className="w-2/3 border border-[var(--border-input)] rounded px-3 py-1.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
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
        <div className="mt-auto px-4 py-3 border-t border-[var(--border-base)] flex justify-end gap-2 bg-[var(--bg-zebra)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border-header)] rounded text-[var(--text-main)] hover:bg-[var(--bg-hover)] text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-1.5 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Create Repair Job'}
          </button>
        </div>
      </div>
    </div>
  );
}
