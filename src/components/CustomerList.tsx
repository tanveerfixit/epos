import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Phone, Mail, User, X } from 'lucide-react';
import { Customer } from '../types';

interface CustomerListProps {
  onSelectCustomer: (id: number) => void;
}

import CustomerFormModal from './CustomerFormModal';

export default function CustomerList({ onSelectCustomer }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/customers').then(res => res.json()).then(setCustomers);
  }, []);

  const handleAddCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });
      if (response.ok) {
        const addedCustomer = await response.json();
        setCustomers([...customers, addedCustomer]);
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-[#f4f7f9] h-full overflow-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-slate-700">Customers</h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
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

      <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="px-4 py-2 border-r border-slate-200">Name</th>
              <th className="px-4 py-2 border-r border-slate-200">Phone</th>
              <th className="px-4 py-2 border-r border-slate-200">Email</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Wallet</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm">
                <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800">
                  <button 
                    onClick={() => onSelectCustomer(customer.id)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {customer.name}
                  </button>
                </td>
                <td className="px-4 py-2 border-r border-slate-200">{customer.phone}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-500">{customer.email || 'N/A'}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-emerald-600">
                  €{Number(customer.wallet_balance || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-center">
                  <button 
                    onClick={() => onSelectCustomer(customer.id)}
                    className="text-[#3498db] hover:underline font-medium"
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
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
