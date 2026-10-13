import React from 'react';
import './admin-theme.css';

const Icons = {
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Posts: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Applications: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Health: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Warning: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Error: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ArrowUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  ArrowDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
};

const KPICard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: IconProp,
  status = null,
  subtitle = null,
  onClick 
}) => {
  // Determine icon and color based on status
  const getStatusConfig = () => {
    switch (status) {
      case 'healthy':
        return { icon: Icons.Health, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
      case 'warning':
        return { icon: Icons.Warning, color: 'text-amber-500', bgColor: 'bg-amber-500/10' };
      case 'critical':
        return { icon: Icons.Error, color: 'text-red-500', bgColor: 'bg-red-500/10' };
      default:
        return { icon: IconProp || Icons.Users, color: 'text-brand-accent', bgColor: 'bg-brand-accent/10' };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div 
      className={`flex flex-col p-6 rounded-2xl bg-surface border border-border-subtle shadow-sm hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold tracking-wider text-secondary uppercase mb-2 truncate">{title}</p>
          <p className="text-3xl font-extrabold text-primary tracking-tight truncate">{formatValue(value)}</p>
          
          {/* Change indicator */}
          {change && (
            <div className={`admin-kpi-change ${changeType} flex items-center gap-1 mt-2 text-xs font-bold`}>
              {changeType === 'positive' && <Icons.ArrowUp />}
              {changeType === 'negative' && <Icons.ArrowDown />}
              <span>{change}</span>
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && !onClick && (
            <p className="text-xs text-secondary mt-2 opacity-80">{subtitle}</p>
          )}

          {/* Action indicator if clickable */}
          {onClick && (
            <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-brand-accent group-hover:translate-x-1 transition-transform duration-200">
              <span>Manage {title.split(' ').pop()}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center ${config.color} flex-shrink-0`}>
          <Icon />
        </div>
      </div>
    </div>
  );
};

// KPI Grid Component for layout
export const KPIGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {children}
    </div>
  );
};

export default KPICard;
