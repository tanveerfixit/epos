import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Repair } from '../types';
import RepairIntakeForm from './RepairIntakeForm';

interface RepairListProps {
  preSelectedCustomerId?: number | null;
}

export default function RepairList({ preSelectedCustomerId }: RepairListProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRepairs = async () => {
    try {
      const res = await fetch('/api/repairs');
      const data = await res.json();
      setRepairs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch repairs:', err);
    }
  };

  useEffect(() => {
    fetchRepairs();
    if (preSelectedCustomerId) {
      setIsModalOpen(true);
    }
  }, [preSelectedCustomerId]);

  const filtered = repairs.filter(r =>
    String(r.id).includes(searchTerm) ||
    (r.device_model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.status || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'diagnosed':  return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'repairing':  return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'completed':  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'collected':  return 'bg-slate-100 text-slate-700 border-slate-200';
      default:           return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f4f7f9] overflow-hidden">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-white border-b border-slate-200 shrink-0">
        <h2 className="text-xl font-medium text-slate-700">Repair Jobs</h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search ID, model, customer..."
              className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#3498db] hover:bg-[#2980b9] text-white font-medium py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all"
          >
            <Plus size={16} />
            New Repair Job
          </button>
        </div>
      </div>

      {/* Table — full width, no container box */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#f8f9fa] border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="px-4 py-2 border-r border-slate-200">Job #</th>
              <th className="px-4 py-2 border-r border-slate-200">Customer</th>
              <th className="px-4 py-2 border-r border-slate-200">Device Model</th>
              <th className="px-4 py-2 border-r border-slate-200">Issue</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Quote</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Deposit</th>
              <th className="px-4 py-2 border-r border-slate-200 text-right">Balance</th>
              <th className="px-4 py-2 border-r border-slate-200">Method</th>
              <th className="px-4 py-2 border-r border-slate-200">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(repair => (
              <tr key={repair.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors text-sm bg-white">
                <td className="px-4 py-2 border-r border-slate-200 font-mono text-slate-500 text-xs font-bold">
                  #{repair.id}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 font-bold text-slate-800">
                  {repair.customer_name || '—'}
                </td>
                <td className="px-4 py-2 border-r border-slate-200">{repair.device_model}</td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-500 max-w-[200px] truncate">
                  {repair.issue}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-right">
                  €{Number(repair.total_quote || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-500">
                  €{Number(repair.deposit_paid || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-right font-bold">
                  <span className={(repair.remaining_balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}>
                    €{Number(repair.remaining_balance || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-2 border-r border-slate-200 text-slate-500 text-xs">
                  {repair.payment_method || '—'}
                </td>
                <td className="px-4 py-2 border-r border-slate-200">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${getStatusColor(repair.status)}`}>
                    {repair.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <button className="text-[#3498db] hover:underline font-medium text-xs">
                    Update
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-slate-400 bg-white">
                  {searchTerm ? `No repair jobs found for "${searchTerm}"` : 'No repair jobs yet. Create your first job.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <RepairIntakeForm
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchRepairs();
          }}
          initialCustomerId={preSelectedCustomerId}
        />
      )}
    </div>
  );
}
