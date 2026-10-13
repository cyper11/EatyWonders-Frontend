import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'p-6',
  hover = false,
  ...props
}) => (
  <div
    className={`
      bg-surface rounded-panel border border-subtle shadow-card overflow-hidden
      ${hover ? 'transition-[box-shadow,transform] duration-300 hover:shadow-lift hover:-translate-y-0.5' : ''}
      ${padding}
      ${className}
    `}
    {...props}
  >
    {children}
  </div>
);

export default Card;
