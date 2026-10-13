import React from 'react';

// Plain section heading: title, optional one-line lede and actions.
const SectionHeader = ({ id, title, lede, actions, className = '' }) => (
  <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className="min-w-0">
      <h2 id={id} className="section-title">{title}</h2>
      {lede && <p className="section-lede">{lede}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

export default SectionHeader;
