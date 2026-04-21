import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, FileText, CreditCard, History, Save, ChevronDown, Trash2 } from 'lucide-react';
import { Customer, Invoice, Payment } from '../types';

interface CustomerDetailsProps {
  customerId: number;
  onBack: () => void;
  onSelectInvoice?: (id: number) => void;
  onCreateInvoice?: () => void;
  onCreateRepair?: () => void;
  onDeposit?: () => void;
}

interface CustomerActivity {
  id: number;
  activity: string;
  details: string;
  user_name: string;
  created_at: string;
}

import CustomerFormModal from './CustomerFormModal';
import { X, Plus } from 'lucide-react';

export default function CustomerDetails({ 
  customerId, 
  onBack, 
  onSelectInvoice,
  onCreateInvoice,
  onCreateRepair,
  onDeposit
}: CustomerDetailsProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<(Payment & { invoice_number: string })[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'properties' | 'credits' | 'terms' | 'activity'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const fetchCustomerData = () => {
    fetch(`/api/customers/${customerId}`).then(res => res.json()).then(data => {
      setCustomer(data);
    });
    fetch(`/api/customers/${customerId}/invoices`).then(res => res.json()).then(setInvoices);
    fetch(`/api/customers/${customerId}/payments`).then(res => res.json()).then(setPayments);
    fetch(`/api/customers/${customerId}/activity`).then(res => res.json()).then(setActivities);
  };

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const handleUpdate = async (formData: Partial<Customer>) => {
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setCustomer({ ...customer!, ...formData });
        setIsEditing(false);
        fetch(`/api/customers/${customerId}/activity`).then(res => res.json()).then(setActivities);
      }
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };



  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this customer?')) return;
    
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onBack();
      }
    } catch (error) {
      console.error('Error archiving customer:', error);
    }
  };

  if (!customer) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden text-slate-800">

      {/* Header Tabs */}
      <div className="flex justify-between items-end bg-[#f8f9fa] pt-2 px-2 border-b border-slate-200 shrink-0">
        <div className="flex gap-1 items-end">
          <button 
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 border border-slate-300 border-b-0 text-sm font-medium -mb-px relative transition-colors ${
              activeTab === 'info' ? 'bg-white text-slate-700' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Customer Information
          </button>

          <button 
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 border border-slate-300 border-b-0 text-sm font-medium -mb-px relative transition-colors ${
              activeTab === 'properties' ? 'bg-white text-slate-700' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Customer Properties
          </button>

          <button 
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-2 border border-slate-300 border-b-0 text-sm font-medium -mb-px relative transition-colors ${
              activeTab === 'credits' ? 'bg-white text-slate-700' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Wallet & Ledger
          </button>

          <button 
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2 border border-slate-300 border-b-0 text-sm font-medium -mb-px relative transition-colors ${
              activeTab === 'terms' ? 'bg-white text-slate-700' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Payment Terms
          </button>

          <button 
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 border border-slate-300 border-b-0 text-sm font-medium -mb-px relative transition-colors ${
              activeTab === 'activity' ? 'bg-white text-slate-700' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Activity Log
          </button>
        </div>

        <div className="pb-2 pr-2 flex gap-2">
          <button 
            onClick={handleArchive}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-red-200 text-red-600 text-[11px] font-bold rounded shadow-sm hover:bg-red-50"
          >
            <Trash2 size={12} />
            Archive
          </button>
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-slate-800 text-[11px] font-bold rounded shadow-sm hover:bg-slate-50"
          >
            Customers List
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex">

        {/* Left Panel */}
        <div className="w-[60%] p-6 border-r border-slate-100 flex gap-6 overflow-auto">

          {/* Avatar */}
          <div className="shrink-0 pt-2">
            <div className="w-[120px] h-[120px] rounded-full border-[2px] border-black flex items-center justify-center bg-white overflow-hidden">
              {customer.name ? (
                <span className="text-4xl font-black text-slate-800">{customer.name.charAt(0)}</span>
              ) : (
                <User size={64} className="text-slate-300" />
              )}
            </div>
          </div>

          {/* Customer Info */}
          <div className="flex-1 space-y-4 pt-2">

            <div className="space-y-1">
              <h2 className="text-[#3498db] text-[15px] font-medium uppercase tracking-tight">
                {customer.company || 'No Company'}
              </h2>
              <p className="text-[#3498db] text-[15px] font-medium uppercase tracking-tight">
                {customer.name}
              </p>
            </div>

            <div className="space-y-2 text-[13px] font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                {customer.email || 'No email provided'}
              </div>

              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                {customer.phone || 'No phone provided'}
              </div>
            </div>

            <div className="text-[12px] font-bold text-slate-800 leading-snug pt-2">
              <p className="mb-1">Customer Type : Individual</p>
              {customer.address_line1 ? (
                <>
                  <p>{customer.address_line1}</p>
                  <p>{customer.city}, {customer.state} {customer.zip_code}</p>
                </>
              ) : (
                <p>{customer.address || 'No address provided'}</p>
              )}
              <p>Ireland</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">

              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-[#555] hover:bg-[#444] text-white px-5 py-1.5 text-[11px] font-bold rounded shadow-sm transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>

              <button className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-500 px-3 py-1.5 text-[11px] font-bold rounded shadow-sm transition-colors">
                Merge Customers
              </button>

              <button className="bg-[#2ecc71] hover:bg-[#27ae60] text-white px-4 py-1.5 text-[11px] font-bold rounded shadow-sm transition-colors">
                Trade In
              </button>

              <button 
                onClick={handleArchive}
                className="bg-[#e74c3c] hover:bg-[#c0392b] text-white px-4 py-1.5 text-[11px] font-bold rounded shadow-sm transition-colors"
              >
                Archive
              </button>

              {/* Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="bg-[#2ecc71] text-white px-3 py-1.5 text-[11px] font-bold rounded shadow-sm flex items-center justify-between min-w-[110px] hover:bg-[#27ae60] transition-colors"
                >
                  Create New
                  <ChevronDown size={14} className={`transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
                </button>

                {showCreateMenu && (
                  <div className="absolute top-full left-0 w-full flex flex-col z-10 shadow-xl border border-slate-200 mt-1">
                    <button className="bg-[#3498db] text-white px-3 py-2 text-[11px] text-left hover:bg-blue-600 font-bold border-b border-white/10">
                      Create New
                    </button>

                    <button 
                      onClick={() => {
                        setShowCreateMenu(false);
                        onCreateInvoice?.();
                      }}
                      className="bg-[#2ecc71] text-white px-3 py-2 text-[11px] text-left hover:bg-[#27ae60] font-bold border-b border-white/10"
                    >
                      Cash Register
                    </button>

                    <button 
                      onClick={() => {
                        setShowCreateMenu(false);
                        onCreateRepair?.();
                      }}
                      className="bg-[#2ecc71] text-white px-3 py-2 text-[11px] text-left hover:bg-[#27ae60] font-bold border-b border-white/10"
                    >
                      Repair Ticket
                    </button>

                    <button 
                      onClick={() => {
                        setShowCreateMenu(false);
                      }}
                      className="bg-[#2ecc71] text-white px-3 py-2 text-[11px] text-left hover:bg-[#27ae60] font-bold border-b border-white/10"
                    >
                      Order
                    </button>

                    <button 
                      onClick={() => {
                        setShowCreateMenu(false);
                        onDeposit?.();
                      }}
                      className="bg-[#2ecc71] text-white px-3 py-2 text-[11px] text-left hover:bg-[#27ae60] font-bold"
                    >
                      Deposit
                    </button>
                  </div>
                )}
              </div>

            </div>

      {isEditing && (
        <CustomerFormModal 
          onClose={() => setIsEditing(false)}
          onSave={handleUpdate}
          initialData={customer}
        />
      )}



          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-white overflow-auto p-6">
          {activeTab === 'info' && (
            <div className="space-y-8">
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Spent</p>
                  <p className="text-xl font-black text-slate-800">€{invoices.reduce((sum, inv) => sum + inv.grand_total, 0).toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Outstanding</p>
                  <p className="text-xl font-black text-orange-600">€{invoices.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + inv.grand_total, 0).toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Wallet Balance</p>
                  <p className="text-xl font-black text-emerald-600">€{(customer.wallet_balance || 0).toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Recent Invoices</h3>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-2">Invoice #</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic text-xs">No invoices found.</td>
                        </tr>
                      ) : (
                        invoices.slice(0, 5).map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors text-xs">
                            <td className="px-4 py-3">
                              <button 
                                onClick={() => onSelectInvoice?.(inv.id)}
                                className="font-bold text-blue-600 hover:underline"
                              >
                                {inv.invoice_number}
                              </button>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{new Date(inv.created_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                                inv.status === 'void' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">€{inv.grand_total.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mt-8">Recent Payments</h3>
                <div className="border border-slate-200 rounded overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Method</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic text-xs">No payments found.</td>
                        </tr>
                      ) : (
                        payments.slice(0, 5).map(p => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors text-xs">
                            <td className="px-4 py-3 text-slate-600">{new Date(p.paid_at).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                p.type === 'deposit' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {p.type || 'payment'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700">{p.method}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">€{p.amount.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Customer Properties</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tax ID / VAT Number</label>
                    <p className="text-sm font-medium text-slate-700">{customer.fax || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Website</label>
                    <p className="text-sm font-medium text-blue-600 hover:underline cursor-pointer">{customer.website || 'Not set'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Customer Group</label>
                    <p className="text-sm font-medium text-slate-700">General Customers</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price Level</label>
                    <p className="text-sm font-medium text-slate-700">Retail</p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Alert Message</label>
                <div className="p-3 bg-orange-50 border border-orange-100 rounded text-sm text-orange-800 min-h-[60px]">
                  {customer.alert_message || 'No alert message set for this customer.'}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'credits' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Wallet & Ledger</h3>
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Available Balance</p>
                  <p className="text-3xl font-black text-emerald-700">€{(customer.wallet_balance || 0).toFixed(2)}</p>
                </div>
                <button 
                  onClick={() => onDeposit?.()}
                  className="bg-emerald-600 text-white px-4 py-2 rounded font-bold text-xs hover:bg-emerald-700 transition-colors"
                >
                  Add Deposit
                </button>
              </div>
              
              <h4 className="text-xs font-bold text-slate-500 uppercase mt-8 mb-4">Payment Ledger</h4>
              <div className="border border-slate-200 rounded overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Method</th>
                      <th className="px-4 py-2">Reference</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic text-xs">No transactions found.</td>
                      </tr>
                    ) : (
                      payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors text-xs">
                          <td className="px-4 py-3 text-slate-600">{new Date(p.paid_at).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              p.type === 'deposit' ? 'bg-emerald-100 text-emerald-700' : 
                              p.type === 'wallet_use' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {p.type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.method}</td>
                          <td className="px-4 py-3 text-slate-600">{p.invoice_number || '-'}</td>
                          <td className={`px-4 py-3 text-right font-bold ${p.type === 'wallet_use' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {p.type === 'wallet_use' ? '-' : '+'}€{p.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Payment Terms</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Default Terms</label>
                  <p className="text-sm font-bold text-slate-800">Due on Receipt</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Credit Limit</label>
                  <p className="text-sm font-bold text-slate-800">€0.00</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Internal Notes</label>
                <p className="text-xs text-slate-600 italic">No internal notes for this customer.</p>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Activity Log</h3>
              {activities.length === 0 ? (
                <p className="text-center text-slate-400 italic py-8 text-xs">No activity recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="bg-slate-50 rounded p-3 border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-xs font-bold text-slate-800">{act.activity}</p>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">
                          {new Date(act.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{act.details}</p>
                      <p className="text-[9px] text-slate-400 mt-2 font-medium">Logged by: {act.user_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
