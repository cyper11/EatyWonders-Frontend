import React from 'react';

const Input = ({ 
  label, 
  error, 
  id, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  icon: Icon,
  className = '', 
  ...props 
}) => {
  return (
    <div className={`w-full box-border space-y-1.5 md:space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-bold md:text-base md:font-extrabold text-content-primary">
          {label}
        </label>
      )}
      <div className="relative w-full box-border">
        {Icon && (
          <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
            <Icon className="w-5 h-5 md:w-6 md:h-6 text-content-secondary/70" aria-hidden="true" />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`
            w-full box-border rounded-xl border transition-all duration-200 outline-none
            min-h-[48px] py-3 px-4 text-base
            md:min-h-[56px] md:py-4 md:text-lg
            ${Icon ? 'pl-11 md:pl-14' : ''}
            bg-surface text-content-primary placeholder:text-content-secondary/50
            ${error 
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20' 
              : 'border-background-tertiary focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20'
            }
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs md:text-sm font-bold text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
