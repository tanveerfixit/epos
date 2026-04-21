import React from 'react';
import { 
  FolderOpen, 
  Banknote, 
  Truck, 
  LineChart, 
  CalendarPlus, 
  Users, 
  Globe, 
  PieChart, 
  ArrowLeftRight, 
  Settings, 
  LayoutGrid 
} from 'lucide-react';

interface HomeMenuProps {
  onNavigate: (view: any) => void;
}

const HomeMenu: React.FC<HomeMenuProps> = ({ onNavigate }) => {
  const menuTiles = [
    { id: 'stock-take', label: 'Stock Take', icon: FolderOpen },
    { id: 'expenses', label: 'Expenses', icon: Banknote },
    { id: 'inventory-transfer', label: 'Inventory Transfer', icon: Truck },
    { id: 'dashboard', label: 'Dashboard', icon: LineChart },
    { id: 'end-of-day', label: 'End of Day', icon: Banknote },
    { id: 'appointment-calendar', label: 'Appointment Calendar', icon: CalendarPlus },
    { id: 'staff-employee', label: 'Staff Employee', icon: Users },
    { id: 'website', label: 'Website', icon: Globe },
    { id: 'sales-reports', label: 'Sales Reports', icon: PieChart },
    { id: 'repairs-reports', label: 'Repairs Reports', icon: PieChart },
    { id: 'inventory-reports', label: 'Inventory Reports', icon: PieChart },
    { id: 'activity-log', label: 'Activity Log', icon: ArrowLeftRight },
    { id: 'getting-started', label: 'Getting Started', icon: Settings },
    { id: 'manage-data', label: 'Manage Data', icon: Settings },
    { id: 'setup', label: 'Setup', icon: Settings },
    { id: 'integrations', label: 'Integrations', icon: LayoutGrid },
  ];

  return (
    <div className="p-4 bg-[var(--bg-app)] h-full overflow-auto transition-colors duration-300">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14 gap-3 max-w-[1600px]">
        {menuTiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => onNavigate(tile.id)}
            className="flex flex-col items-center justify-center bg-[#0081a7] dark:bg-blue-600/80 hover:bg-[#007091] dark:hover:bg-blue-600 text-white p-2 rounded shadow-sm transition-all aspect-square group w-full border border-white/5"
          >
            <div className="mb-1 group-hover:scale-110 transition-transform">
              <tile.icon size={22} strokeWidth={1.5} />
            </div>
            <span className="text-[9px] font-bold text-center leading-tight uppercase tracking-tight px-0.5">
              {tile.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeMenu;
