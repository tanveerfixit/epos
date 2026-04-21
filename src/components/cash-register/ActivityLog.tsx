import React, { useState } from 'react';
import { History, Tag, UserPlus, Package, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Activity } from './types';

interface ActivityLogProps {
  activities: Activity[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'sale': return <Tag size={12} className="text-emerald-600 dark:text-emerald-400" />;
      case 'customer': return <UserPlus size={12} className="text-blue-600 dark:text-blue-400" />;
      case 'stock': return <Package size={12} className="text-amber-600 dark:text-amber-400" />;
      default: return <Settings size={12} className="text-[var(--text-muted)]" />;
    }
  };

  const getActivityBg = (type: Activity['type']) => {
    switch (type) {
      case 'sale': return 'bg-emerald-100 dark:bg-emerald-950/20';
      case 'customer': return 'bg-blue-100 dark:bg-blue-950/20';
      case 'stock': return 'bg-amber-100 dark:bg-amber-950/20';
      default: return 'bg-[var(--bg-app)]';
    }
  };

  return (
    <div className={`bg-[var(--bg-card)] rounded-none shadow-sm border border-[var(--border-base)] overflow-hidden flex flex-col transition-all duration-300 ${isCollapsed ? 'h-[44px]' : 'h-[200px]'}`}>
      <div 
        className="p-3 border-b border-[var(--border-base)] bg-[var(--bg-header)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-header)]/80 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <History size={16} className="text-[var(--text-muted)]" />
          <h2 className="font-bold text-black dark:text-black text-sm">Recent Activity</h2>
          {activities.length > 0 && (
            <span className="bg-[var(--bg-card)] text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-[var(--border-base)]">
              {activities.length}
            </span>
          )}
        </div>
        {isCollapsed ? <ChevronDown size={16} className="text-[var(--text-muted-more)]" /> : <ChevronUp size={16} className="text-[var(--text-muted-more)]" />}
      </div>
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
          {activities.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[var(--text-muted-more)] text-xs italic">
              No recent activity
            </div>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-3 p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group">
                <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${getActivityBg(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-[var(--text-main)] truncate">{activity.action}</p>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium whitespace-nowrap">{activity.time}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted-more)] truncate leading-tight mt-0.5">{activity.details}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
