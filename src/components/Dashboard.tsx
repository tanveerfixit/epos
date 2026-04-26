import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Wrench, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeRepairs: 0,
    totalCustomers: 0,
    lowStock: 0
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invoices, repairs, customers, products] = await Promise.all([
          fetch('/api/invoices').then(res => res.json()),
          fetch('/api/repairs').then(res => res.json()),
          fetch('/api/customers').then(res => res.json()),
          fetch('/api/products').then(res => res.json())
        ]);

        const totalSales = invoices.reduce((sum: number, inv: any) => sum + inv.grand_total, 0);
        const activeRepairs = repairs.filter((r: any) => r.status !== 'collected').length;

        setStats({
          totalSales,
          activeRepairs,
          totalCustomers: customers.length,
          lowStock: 0 // For now
        });

        setRecentSales(invoices.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Sales', value: `€${stats.totalSales.toLocaleString()}`, icon: TrendingUp, color: 'bg-[var(--brand-primary)]', trend: '+12.5%', trendUp: true },
    { label: 'Active Repairs', value: stats.activeRepairs, icon: Wrench, color: 'bg-[var(--bg-sidebar)]', trend: '+2', trendUp: true },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-[var(--brand-primary)]', trend: '+5%', trendUp: true },
    { label: 'Low Stock Items', value: stats.lowStock, icon: ShoppingBag, color: 'bg-[var(--brand-danger)]', trend: '-1', trendUp: false },
  ];

  return (
    <div className="p-4 space-y-6 bg-[var(--bg-app)] h-full overflow-auto transition-colors duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-normal text-[var(--text-main)]">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 max-w-[1600px]">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-[var(--bg-card)] p-3 rounded border border-[var(--border-base)] shadow-sm space-y-2">
            <div className="flex justify-between items-start">
              <div className={`${card.color} p-1 rounded text-white`}>
                <card.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-normal ${card.trendUp ? 'text-[var(--brand-success)]' : 'text-[var(--brand-danger)]'}`}>
                {card.trend}
                {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-normal text-[var(--text-muted)] uppercase tracking-widest">{card.label}</p>
              <h3 className="text-2xl font-normal text-[var(--text-main)]">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] pl-6 pt-6 pb-6 pr-0 rounded border border-[var(--border-base)] shadow-sm">
          <h3 className="text-sm font-normal text-[var(--text-main)] mb-6 uppercase tracking-wider">Recent Activity</h3>
          <div className="space-y-4">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center gap-4 border-b border-[var(--border-base)] pb-3 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]"></div>
                <div className="flex-1">
                  <p className="text-sm font-normal text-[var(--text-main)]">New Sale Completed</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Invoice #{sale.invoice_number} • {new Date(sale.created_at).toLocaleTimeString()}</p>
                </div>
                <p className="font-normal text-[var(--text-main)] text-sm">€{sale.grand_total.toFixed(2)}</p>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-[var(--text-muted)] text-center py-8 text-sm italic">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] pl-6 pt-6 pb-6 pr-0 rounded border border-[var(--border-base)] shadow-sm">
          <h3 className="text-sm font-normal text-[var(--text-main)] mb-6 uppercase tracking-wider">Top Selling Categories</h3>
          <div className="space-y-5">
            {[
              { label: 'Smartphones', value: 65, color: 'bg-[var(--brand-primary)]' },
              { label: 'Accessories', value: 25, color: 'bg-[var(--bg-sidebar)]' },
              { label: 'Repairs', value: 10, color: 'bg-[var(--brand-primary)]' },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-normal">
                  <span className="text-[var(--text-main)]">{cat.label}</span>
                  <span className="text-[var(--text-muted)]">{cat.value}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-app)] rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color}`} style={{ width: `${cat.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
