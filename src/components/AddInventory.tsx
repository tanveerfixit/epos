import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Package, Smartphone } from 'lucide-react';
import { Product, Branch, Supplier } from '../types';

export default function AddInventory({ 
  productId, 
  onBack, 
  onSuccess 
}: { 
  productId: number; 
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [branchId, setBranchId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [poNumber, setPoNumber] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  
  // Quick Add Supplier State
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({ name: '', phone: '', email: '' });
  const [supplierStatus, setSupplierStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleQuickAddSupplier = async () => {
    if (!newSupplierData.name.trim()) return;
    setSupplierStatus(null);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSupplierData,
          contact_person: newSupplierData.name // Default to name
        })
      });
      if (res.ok) {
        const newSup = await res.json();
        setSuppliers(prev => [...prev, newSup]);
        setSupplierId(newSup.id.toString());
        setNewSupplierData({ name: '', phone: '', email: '' });
        setSupplierStatus({ type: 'success', msg: 'Supplier added successfully!' });
        setTimeout(() => {
          setShowNewSupplierModal(false);
          setSupplierStatus(null);
        }, 1500);
      } else {
        const err = await res.json();
        setSupplierStatus({ type: 'error', msg: err.error || 'Failed to add supplier' });
      }
    } catch (error) {
      console.error('Error adding supplier:', error);
      setSupplierStatus({ type: 'error', msg: 'Connection error' });
    }
  };

  // Serialized Items State
  const [items, setItems] = useState<{ imei: string; color: string; gb: string; condition: string }[]>([
    { imei: '', color: '', gb: '', condition: 'New' }
  ]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}`).then(res => res.json()),
      fetch('/api/branches').then(res => res.json()),
      fetch('/api/suppliers').then(res => res.json())
    ]).then(([prodData, branchData, supplierData]) => {
      setProduct(prodData);
      setBranches(branchData);
      if (branchData.length > 0) {
        setBranchId(branchData[0].id.toString());
      }
      setSuppliers(supplierData);
      setCostPrice(prodData.cost_price?.toString() || '');
      setSellingPrice(prodData.selling_price?.toString() || '');
      setLoading(false);
    });
  }, [productId]);

  const handleAddItem = () => {
    setItems([...items, { imei: '', color: '', gb: '', condition: 'New' }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return alert('Please select a branch');

    const payload = {
      sku_id: productId,
      branch_id: parseInt(branchId),
      quantity: product?.product_type === 'serialized' ? items.length : parseInt(quantity),
      cost_price: parseFloat(costPrice),
      selling_price: parseFloat(sellingPrice),
      supplier_id: supplierId ? parseInt(supplierId) : null,
      po_number: poNumber,
      items: product?.product_type === 'serialized' ? items : []
    };

    try {
      const res = await fetch('/api/inventory/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to add inventory');
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9]">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-medium text-slate-700">Add Inventory</h2>
            <p className="text-xs text-slate-500">
              {product.manufacturer_name && <span className="font-bold text-slate-700">{product.manufacturer_name}</span>} • {product.product_name} • <span className="font-mono">{product.sku_code}</span>
            </p>
          </div>
        </div>
        <button 
          onClick={handleSubmit}
          className="bg-[#2ecc71] hover:bg-[#27ae60] text-white font-bold py-1.5 px-6 rounded text-sm flex items-center gap-2 transition-all shadow-sm"
        >
          <Save size={16} />
          Save Inventory
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Config Card */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-wider">
                <Package size={16} className="text-[#3498db]" />
                Inventory Details
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Branch *</label>
                  <select 
                    required
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#3498db] outline-none"
                  >
                    <option value="">Choose Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Supplier</label>
                    <button 
                      type="button"
                      onClick={() => setShowNewSupplierModal(true)}
                      className="text-[#3498db] hover:underline text-[10px] font-bold flex items-center gap-1"
                    >
                      <Plus size={10} /> Quick Add
                    </button>
                  </div>
                  <select 
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#3498db] outline-none"
                  >
                    <option value="">Choose Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">PO Number / Reference</label>
                  <input 
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-12345"
                    className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#3498db] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cost Price (€)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#3498db] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Selling Price (€)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#3498db] outline-none"
                    />
                  </div>
                </div>
                {product.product_type !== 'serialized' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity to Add</label>
                    <input 
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-[#3498db] outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Serialized Items Table */}
          {product.product_type === 'serialized' && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-wider">
                  <Smartphone size={16} className="text-[#3498db]" />
                  Serialized Items (IMEI/Serial)
                </h3>
                <button 
                  type="button"
                  onClick={handleAddItem}
                  className="text-[#3498db] hover:text-[#2980b9] text-xs font-bold flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add Another Row
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2 w-10">#</th>
                      <th className="px-4 py-2">IMEI / Serial Number</th>
                      <th className="px-4 py-2">Color</th>
                      <th className="px-4 py-2">GB</th>
                      <th className="px-4 py-2">Condition</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-4 py-2">
                          <input 
                            type="text"
                            required
                            value={item.imei}
                            onChange={(e) => handleItemChange(idx, 'imei', e.target.value)}
                            placeholder="Scan IMEI..."
                            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none font-mono"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text"
                            value={item.color}
                            onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                            placeholder="Color"
                            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input 
                            type="text"
                            value={item.gb}
                            onChange={(e) => handleItemChange(idx, 'gb', e.target.value)}
                            placeholder="GB"
                            className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 outline-none"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select 
                            value={item.condition}
                            onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                            className="bg-transparent border-none p-0 text-sm focus:ring-0 outline-none"
                          >
                            <option>New</option>
                            <option>A</option>
                            <option>B</option>
                            <option>C</option>
                            <option>Faulty</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {items.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
                <span className="text-xs font-bold text-slate-500 uppercase mr-4">Total Items:</span>
                <span className="text-sm font-bold text-slate-900">{items.length}</span>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Quick Add Supplier Modal */}
      {showNewSupplierModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-slate-800">Add New Supplier</h3>
            </div>
            <div className="p-6 space-y-4">
              {supplierStatus && (
                <div className={`p-3 rounded text-sm font-bold ${
                  supplierStatus.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {supplierStatus.msg}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Supplier Name *</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                  placeholder="e.g. Apple Wholesale"
                  value={newSupplierData.name}
                  onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                    placeholder="Phone number"
                    value={newSupplierData.phone}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                    placeholder="Email address"
                    value={newSupplierData.email}
                    onChange={(e) => setNewSupplierData({ ...newSupplierData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewSupplierModal(false);
                  setNewSupplierData({ name: '', phone: '', email: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickAddSupplier}
                className="px-4 py-2 text-sm font-medium bg-[#3498db] text-white rounded hover:bg-[#2980b9]"
              >
                Add Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
