import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Repair } from '../types';
import RepairIntakeForm from './RepairIntakeForm';
import RepairUpdateModal from './RepairUpdateModal';

interface RepairListProps {
  preSelectedCustomerId?: number | null;
}

export default function RepairList({ preSelectedCustomerId }: RepairListProps) {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<any | null>(null);

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
      case 'new':        return 'bg-[var(--bg-zebra)] text-[var(--text-main)] border-[var(--border-header)]';
      case 'diagnosed':  return 'bg-[var(--bg-hover)] text-[var(--brand-primary)] border-[var(--brand-primary)]';
      case 'repairing':  return 'bg-[var(--bg-hover)] text-purple-700 border-purple-300';
      case 'completed':  return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'collected':  return 'bg-[var(--bg-accent-subtle)] text-[var(--text-muted)] border-[var(--border-header)]';
      default:           return 'bg-[var(--bg-zebra)] text-[var(--text-muted-more)] border-[var(--border-header)]';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-hidden transition-colors duration-300">
      {/* Header bar */}
      <div className="flex justify-between items-center px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-base)] shrink-0">
        <h2 className="text-xl font-medium text-[var(--text-main)]">Repair Jobs</h2>
        <div className="flex gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-more)]" size={16} />
            <input
              type="text"
              placeholder="Search ID, model, customer..."
              className="w-full pl-10 pr-4 py-1.5 bg-[var(--bg-card)] border border-[var(--border-base)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-[var(--text-main)]"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white font-medium py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all"
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
            <tr className="bg-[var(--bg-app)] border-b border-[var(--border-base)] text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
              <th className="px-4 py-2 border-r border-[var(--border-base)]">Job #</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)]">Customer</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)]">Device Model</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)]">Issue</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)] text-right">Quote</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)] text-right">Deposit</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)] text-right">Balance</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)]">Method</th>
              <th className="px-4 py-2 border-r border-[var(--border-base)]">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(repair => (
              <tr key={repair.id} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-hover)] transition-colors text-sm bg-[var(--bg-card)]">
                <td className="px-4 py-2 border-r border-[var(--border-base)] font-mono text-[var(--text-muted)] text-xs font-bold">
                  #{repair.id}
                </td>
                <td className="px-4 py-2 border-r border-[var(--border-base)] font-bold text-[var(--text-main)]">
                  {repair.customer_name || '—'}
                </td>
                <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-main)]">{repair.device_model}</td>
                <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted)] max-w-[200px] truncate">
                  {repair.issue}
                </td>
                <td className="px-4 py-2 border-r border-[var(--border-base)] text-right text-[var(--text-main)] font-mono">
                  €{Number(repair.total_quote || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 border-r border-[var(--border-base)] text-right text-[var(--text-muted)] font-mono">
                  €{Number(repair.deposit_paid || 0).toFixed(2)}
                </td>
                <td className="px-4 py-2 border-r border-[var(--border-base)] text-right font-bold font-mono">
                  <span className={(repair.remaining_balance || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>
                    €{Number(repair.remaining_balance || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted-more)] text-xs">
                  {repair.payment_method || '—'}
                </td>
                <td className="px-4 py-2 border-r border-[var(--border-base)]">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${getStatusColor(repair.status)}`}>
                    {repair.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <button 
                    onClick={() => setSelectedRepair(repair)}
                    className="text-[var(--brand-primary)] hover:underline font-medium text-xs"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center text-[var(--text-muted-more)] bg-[var(--bg-card)]">
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

      {selectedRepair && (
        <RepairUpdateModal
          repair={selectedRepair}
          onClose={() => setSelectedRepair(null)}
          onSaved={() => {
            setSelectedRepair(null);
            fetchRepairs();
          }}
        />
      )}
    </div>
  );
}
