import React from 'react';

// Friendly empty / error / permission state with an optional action.
const EmptyState = ({ icon, title, description, action, tone = 'neutral', className = '' }) => (
  <div
    role={tone === 'error' ? 'alert' : undefined}
    className={`flex flex-col items-center text-center gap-3 px-6 py-12 rounded-panel border border-dashed ${
      tone === 'error' ? 'border-danger/40 bg-danger/5' : 'border-strong bg-surface/60'
    } ${className}`}
  >
    {icon && (
      <span
        className={`w-12 h-12 rounded-full grid place-items-center ${
          tone === 'error' ? 'bg-danger/10 text-danger' : 'bg-brand-accent/10 text-brand-accent'
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
    )}
    <p className="font-display text-xl font-semibold text-content-primary m-0">{title}</p>
    {description && <p className="text-content-secondary max-w-md m-0">{description}</p>}
    {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>
);

export default EmptyState;
