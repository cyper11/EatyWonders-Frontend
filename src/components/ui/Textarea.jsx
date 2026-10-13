import React from 'react';

const Textarea = ({ 
  label, 
  error, 
  id, 
  icon: Icon,
  placeholder, 
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
          <div className="absolute left-3 top-3 text-content-muted pointer-events-none flex">
            <Icon fontSize="small" />
          </div>
        )}
        <textarea
          id={id}
          aria-invalid={error ? true : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full py-3 rounded-xl border transition-[border-color,box-shadow] duration-200 outline-none min-h-[120px] text-base
            bg-[var(--input-bg)] text-content-primary placeholder:text-content-muted
            ${Icon ? 'pl-10 pr-4' : 'px-4'}
            ${error 
              ? 'border-danger focus:ring-4 focus:ring-danger/15' 
              : 'border-[var(--input-border)] hover:border-strong focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15'
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
