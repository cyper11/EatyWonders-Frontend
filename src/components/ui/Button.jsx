import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
  
  const variants = {
    primary: 'bg-brand-accent text-[#0c1b12] hover:opacity-90 shadow-md hover:shadow-lg focus:ring-brand-accent',
    secondary: 'bg-background-secondary text-content-primary border border-background-tertiary hover:bg-background-tertiary focus:ring-background-tertiary',
    destructive: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 focus:ring-red-500',
    outline: 'bg-transparent border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-[#0c1b12] focus:ring-brand-accent',
    ghost: 'bg-transparent text-content-secondary hover:bg-background-tertiary hover:text-content-primary focus:ring-background-tertiary',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
