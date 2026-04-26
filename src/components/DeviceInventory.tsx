import { useState, useEffect } from 'react';
import { Search, ExternalLink } from 'lucide-react';

interface Device {
  id: number;
  sku_id: number;
  product_name: string;
  color?: string;
  gb?: string;
  condition?: string;
  imei: string;
  po_number?: string;
  created_at: string;
  invoice_number?: string;
  status: string;
}

interface Props {
  onSelectPO: (poNumber: string) => void;
  onSelectProduct: (skuId: number) => void;
  onSelectDevice: (id: number) => void;
}

export default function DeviceInventory({ onSelectPO, onSelectProduct, onSelectDevice }: Props) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [statusFilter, setStatusFilter] = useState('in_stock');

  useEffect(() => {
    fetch(`/api/devices?status=${statusFilter}`).then(res => res.json()).then(setDevices);
  }, [statusFilter]);

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9]">
      {/* Header */}
      <div className="p-4 bg-white border-b border-slate-200">
        <h2 className="text-xl font-medium text-slate-700 mb-4">Devices Inventory</h2>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48"
          >
            <option value="in_stock">Devices in Inventory</option>
            <option value="sold">Sold Devices</option>
            <option value="repair">In Repair</option>
          </select>
          <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48">
            <option>All Device Models</option>
          </select>
          <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-40">
            <option>All Colors</option>
          </select>
          <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-40">
            <option>All Cond</option>
          </select>
          
          <div className="relative flex-1 max-w-md ml-auto flex">
            <input
              type="text"
              placeholder="Search IMEI"
              className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded-l text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
            />
            <button className="px-3 bg-slate-100 border border-l-0 border-slate-300 rounded-r hover:bg-slate-200">
              <Search size={16} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-slate-300 rounded shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e9ecef] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-300 w-1/4">Model</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center w-24">Color</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center w-20">GB</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center w-20">Cond</th>
                <th className="px-4 py-2 border-r border-slate-300 w-1/6">IMEI Number</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center w-24">PO #</th>
                <th className="px-4 py-2 border-r border-slate-300 w-1/6">Date Entered</th>
                <th className="px-4 py-2 text-center w-1/6">Invoice #</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device, idx) => (
                <tr key={device.id} className={`border-b border-slate-200 text-sm hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-[#f8f9fa]' : ''}`}>
                  <td className="px-4 py-2 border-r border-slate-200">
                    <button 
                      onClick={() => onSelectDevice(device.id)}
                      className="text-[#3498db] hover:underline text-left font-medium"
                    >
                      {device.product_name}
                    </button>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">{device.color || ''}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">{device.gb || ''}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">{device.condition || ''}</td>
                  <td className="px-4 py-2 border-r border-slate-200">
                    <button 
                      onClick={() => onSelectDevice(device.id)}
                      className="text-[#3498db] hover:underline font-mono text-xs"
                    >
                      {device.imei}
                    </button>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center">
                    {device.po_number && (
                      <button 
                        onClick={() => onSelectPO(device.po_number!)}
                        className="text-[#3498db] hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <span>{device.po_number}</span>
                        <ExternalLink size={12} />
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-500">
                    {device.created_at}
                  </td>
                  <td className="px-4 py-2 text-center text-slate-600">
                    {device.invoice_number || 'In Inventory'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <select className="bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none">
            <option>auto</option>
          </select>
          <span className="font-bold">1-21/146</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50">«</button>
          <button className="px-3 py-1 bg-[#3498db] text-white rounded font-bold">1</button>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">2</button>
          <span className="px-2">..</span>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">6</button>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">7</button>
          <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50">»</button>
        </div>
      </div>
    </div>
  );
}
