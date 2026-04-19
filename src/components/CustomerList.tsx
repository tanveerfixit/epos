import React, { useState, useEffect } from 'react';
import { UserPlus, Search } from 'lucide-react';
import { Customer } from '../types';
import CustomerFormModal from './CustomerFormModal';

interface CustomerListProps {
  onSelectCustomer: (id: number) => void;
}

export default function CustomerList({ onSelectCustomer }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch customers:', err));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (response.ok) {
        fetchCustomers();
        setIsModalOpen(false);
      } else {
        const err = await response.json();
        alert('Failed to add customer: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  const filtered = customers.filter(c => {
    const q = searchQuery.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="h-full flex flex-col bg-[#f4f7f9] overflow-hidden">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-xl font-medium text-slate-700">Customers</h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search name, phone or email..."
              className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white font-medium py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all"
          >
            <UserPlus size={16} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Table — full width, no container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#f8f9fa] border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="px-4 py-2 border-r border-slate-200">Name</th>
              <th className="px-4 py-2 border-r border-slate-200">Phone</th>
              <th className="px-4 py-2 border-r border-slate-200">Email</th>
              <th className="px-4 py-2 border-r border-slate-200">Company</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Wallet</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(customer => (
              <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm bg-white">
                <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800">
                  <button
                    onClick={() => onSelectCustomer(customer.id)}
                    className="hover:text-blue-600 transition-colors text-left"
                  >
                    {customer.name}
                  </button>
                </td>
                <td className="px-4 py-2 border-r border-slate-200">{customer.phone || '—'}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-500">{customer.email || '—'}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-500">{customer.company || '—'}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-emerald-600">
                  €{Number(customer.wallet_balance || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => onSelectCustomer(customer.id)}
                    className="text-[#3498db] hover:underline font-medium text-xs"
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-slate-400 bg-white">
                  {searchQuery ? `No customers found for "${searchQuery}"` : 'No customers yet. Add your first customer.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <CustomerFormModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddCustomer}
        />
      )}
    </div>
  );
}
