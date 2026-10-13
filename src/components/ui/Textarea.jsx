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
        <label htmlFor={id} className="block text-sm font-bold text-content-primary">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-3 text-brand-accent pointer-events-none">
            <Icon fontSize="small" />
          </div>
        )}
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full py-2.5 rounded-xl border transition-all duration-200 outline-none min-h-[120px]
            bg-surface text-content-primary placeholder:text-content-secondary/50
            ${Icon ? 'pl-10 pr-4' : 'px-4'}
            ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-background-tertiary focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20'
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-bold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea;
