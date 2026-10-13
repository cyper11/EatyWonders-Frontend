import React from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const Select = ({ 
  label, 
  error, 
  id, 
  icon: Icon,
  children, 
  value, 
  onChange, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold text-content-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-accent pointer-events-none">
            <Icon fontSize="small" />
          </div>
        )}
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`
            w-full py-2.5 rounded-xl border transition-all duration-200 outline-none appearance-none
            bg-surface text-content-primary
            ${Icon ? 'pl-10 pr-10' : 'px-4 pr-10'}
            ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-background-tertiary focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20'
            }
          `}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-content-secondary pointer-events-none">
          <KeyboardArrowDownIcon fontSize="small" />
        </div>
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
