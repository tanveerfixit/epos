import React from 'react';
import { User, UserPlus, Search, X, Plus } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  customerSearch: string;
  setCustomerSearch: (query: string) => void;
  customerResults: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onClearCustomer: () => void;
  onOpenNewCustomerModal: () => void;
  onOpenDepositModal?: () => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  customerSearch,
  setCustomerSearch,
  customerResults,
  onSelectCustomer,
  onClearCustomer,
  onOpenNewCustomerModal,
  onOpenDepositModal
}) => {
  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-[var(--text-muted)]" />
          <h3 className="font-bold text-[var(--text-main)] text-sm">Customer</h3>
        </div>
        {!selectedCustomer && (
          <button 
            onClick={onOpenNewCustomerModal}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider"
          >
            <UserPlus size={12} />
            New
          </button>
        )}
      </div>

      {selectedCustomer ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/40 rounded-md p-3 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {selectedCustomer.first_name?.[0] || selectedCustomer.name?.[0] || '?'}
            </div>
            <div>
              <p className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                {selectedCustomer.first_name ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : selectedCustomer.name}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{selectedCustomer.phone}</p>
                {selectedCustomer.wallet_balance !== undefined && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40">
                    Wallet: €{selectedCustomer.wallet_balance.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCustomer.name !== 'Walk-in Customer' && onOpenDepositModal && (
              <button 
                onClick={onOpenDepositModal}
                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                title="Deposit to Wallet"
              >
                <Plus size={16} />
              </button>
            )}
            <button 
              onClick={onClearCustomer}
              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-[var(--text-muted-more)]" />
          </div>
          <input 
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-app)] border border-[var(--border-base)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-[var(--bg-card)] transition-all text-[var(--text-main)] placeholder:text-[var(--text-muted-more)]"
            placeholder="Search customer by phone or name..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          
          {customerSearch && customerResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-[var(--bg-card)] rounded-md shadow-xl border border-[var(--border-base)] max-h-[200px] overflow-y-auto">
              {customerResults.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full text-left p-3 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 border-b border-[var(--border-base)] last:border-0"
                >
                  <div className="w-8 h-8 bg-[var(--bg-app)] rounded-full flex items-center justify-center text-[var(--text-muted)] text-xs font-bold">
                    {customer.first_name?.[0] || customer.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-main)]">
                      {customer.first_name ? `${customer.first_name} ${customer.last_name}` : customer.name}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] font-mono">{customer.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
