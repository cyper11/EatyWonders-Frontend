import React from 'react';

const Input = ({
  label,
  error,
  hint,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  rightElement,
  className = '',
  ...props
}) => {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-content-primary">
          {label}
          {props.required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative w-full">
        {Icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex text-content-muted">
            <Icon style={{ fontSize: 20 }} aria-hidden="true" />
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`
            w-full rounded-xl border outline-none transition-[border-color,box-shadow,background-color] duration-200
            min-h-[48px] py-2.5 px-4 text-base
            ${Icon ? 'pl-11' : ''}
            ${rightElement ? 'pr-12' : ''}
            bg-[var(--input-bg)] text-content-primary placeholder:text-content-muted
            disabled:opacity-60 disabled:cursor-not-allowed
            ${error
              ? 'border-danger focus:ring-4 focus:ring-danger/15'
              : 'border-[var(--input-border)] hover:border-strong focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15'}
          `}
          {...props}
        />
        {rightElement && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex">{rightElement}</span>
        )}
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-content-secondary">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
