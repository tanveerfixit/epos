import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { Customer } from '../types';

interface CustomerFormModalProps {
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
  initialData?: Partial<Customer>;
}

export default function CustomerFormModal({ onClose, onSave, initialData }: CustomerFormModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'address' | 'alert'>('basic');
  const [formData, setFormData] = useState<Partial<Customer>>({
    first_name: '',
    last_name: '',
    email: '',
    offers_email: false,
    company: '',
    phone: '',
    secondary_phone: '',
    fax: '',
    customer_type: 'Individual',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'Ireland',
    alert_message: '',
    ...initialData
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = `${formData.first_name || ''} ${formData.last_name || ''}`.trim();
    // Build a clean payload — only send known fields with explicit null for empties
    // This prevents mysql2 "undefined bind parameter" errors
    const payload = {
      name,
      first_name:      formData.first_name      || null,
      last_name:       formData.last_name        || null,
      phone:           formData.phone            || null,
      email:           formData.email            || null,
      secondary_phone: formData.secondary_phone  || null,
      fax:             formData.fax              || null,
      offers_email:    formData.offers_email     ? 1 : 0,
      company:         formData.company          || null,
      customer_type:   formData.customer_type    || null,
      address_line1:   formData.address_line1    || null,
      address_line2:   formData.address_line2    || null,
      city:            formData.city             || null,
      state:           formData.state            || null,
      zip_code:        formData.zip_code         || null,
      country:         formData.country          || null,
      website:         formData.website          || null,
      alert_message:   formData.alert_message    || null,
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#e9ecef] px-4 py-3 flex justify-between items-center border-b border-slate-300">
          <h3 className="text-[#333] font-bold text-lg">Customer Information</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-4 flex gap-1 bg-white">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-8 py-2 text-sm font-medium border border-slate-300 border-b-0 rounded-t transition-colors ${
              activeTab === 'basic' ? 'bg-white text-slate-800 -mb-px relative z-10' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab('address')}
            className={`px-8 py-2 text-sm font-medium border border-slate-300 border-b-0 rounded-t transition-colors ${
              activeTab === 'address' ? 'bg-white text-slate-800 -mb-px relative z-10' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Address Info
          </button>
          <button
            onClick={() => setActiveTab('alert')}
            className={`px-8 py-2 text-sm font-medium border border-slate-300 border-b-0 rounded-t transition-colors ${
              activeTab === 'alert' ? 'bg-white text-slate-800 -mb-px relative z-10' : 'bg-[#e9ecef] text-slate-600 hover:bg-slate-200'
            }`}
          >
            Alert message
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8 border-t border-slate-300">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">First Name<span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.first_name}
                  onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Last Name</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.last_name}
                  onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Email Address</label>
                <input
                  type="email"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Offers Email</label>
                <div className="w-2/3">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.offers_email}
                    onChange={e => setFormData({ ...formData, offers_email: e.target.checked })}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Company</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Phone No.<span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Secondary Phone</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.secondary_phone}
                  onChange={e => setFormData({ ...formData, secondary_phone: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Fax</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.fax}
                  onChange={e => setFormData({ ...formData, fax: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Customer Type</label>
                <div className="w-2/3 flex gap-0">
                  <select
                    className="flex-1 border border-[#ced4da] rounded-l px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    value={formData.customer_type}
                    onChange={e => setFormData({ ...formData, customer_type: e.target.value })}
                  >
                    <option value="Individual">Select Customer Type</option>
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                  </select>
                  <button type="button" className="bg-[#dee2e6] border border-[#ced4da] border-l-0 px-3 py-1.5 text-slate-700 hover:bg-slate-200 rounded-r flex items-center gap-1 text-sm font-bold">
                    <Plus size={14} /> New
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'address' && (
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Address Line 1</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.address_line1}
                  onChange={e => setFormData({ ...formData, address_line1: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Address Line 2</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.address_line2}
                  onChange={e => setFormData({ ...formData, address_line2: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">City</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">State</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Zip Code</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.zip_code}
                  onChange={e => setFormData({ ...formData, zip_code: e.target.value })}
                />
              </div>
              <div className="flex items-center">
                <label className="w-1/3 text-sm font-bold text-slate-700">Country</label>
                <input
                  type="text"
                  className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'alert' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Alert Message</label>
                <textarea
                  rows={4}
                  className="w-full border border-[#ced4da] rounded px-3 py-2 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.alert_message}
                  onChange={e => setFormData({ ...formData, alert_message: e.target.value })}
                  placeholder="Enter alert message for this customer..."
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-2 bg-[#f8f9fa] -mx-8 -mb-8 p-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 bg-[#007bff] hover:bg-[#0069d9] text-white rounded text-sm font-bold transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
