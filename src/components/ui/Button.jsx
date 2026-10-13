import React from 'react';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-bold leading-none whitespace-nowrap ' +
  'transition-[background-color,color,border-color,box-shadow,transform] duration-200 ' +
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent/30 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px';

const variants = {
  primary: 'bg-brand-accent text-on-accent hover:bg-brand-strong shadow-card',
  secondary: 'bg-background-secondary text-content-primary border border-strong hover:bg-background-tertiary',
  destructive: 'bg-transparent text-danger border border-danger/40 hover:bg-danger hover:text-white',
  outline: 'bg-transparent border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-on-accent',
  ghost: 'bg-transparent text-content-secondary hover:bg-brand-accent/10 hover:text-content-primary',
};

const sizes = {
  sm: 'min-h-[40px] px-4 text-sm',
  md: 'min-h-[44px] px-5 text-[0.95rem]',
  lg: 'min-h-[52px] px-7 text-base',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    disabled={disabled}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

export default Button;
