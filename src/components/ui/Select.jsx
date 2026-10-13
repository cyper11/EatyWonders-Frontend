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
        <label htmlFor={id} className="block text-sm font-semibold text-content-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted pointer-events-none flex">
            <Icon fontSize="small" />
          </div>
        )}
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          value={value}
          onChange={onChange}
          className={`
            w-full min-h-[48px] py-2.5 rounded-xl border transition-[border-color,box-shadow] duration-200 outline-none appearance-none text-base
            bg-[var(--input-bg)] text-content-primary
            ${Icon ? 'pl-10 pr-10' : 'px-4 pr-10'}
            ${error 
              ? 'border-danger focus:ring-4 focus:ring-danger/15' 
              : 'border-[var(--input-border)] hover:border-strong focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15'
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
        <p className="text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
