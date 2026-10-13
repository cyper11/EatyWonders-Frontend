import React from 'react';
import VeganBadge from './VeganBadge';

function formatPrice(value) {
  const price = Number(value);
  if (value === null || value === undefined || value === '' || !Number.isFinite(price)) return null;
  return `PHP ${price.toFixed(2)}`;
}

/**
 * Menu items as clean rows: name + tags on the left, price on the right,
 * description underneath. Used by posts, the feed and the owner dashboard.
 */
export default function MenuItemList({ items = [], title = 'Menu', titleAs: TitleTag = 'h3', className = '' }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section className={className}>
      {title && (
        <TitleTag className="m-0 mb-2 text-sm font-bold text-content-primary" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>
          {title}
        </TitleTag>
      )}
      <ul className="list-none m-0 p-0 rounded-card border border-subtle divide-y divide-[var(--border-subtle)] bg-surface overflow-hidden">
        {items.map((item, i) => {
          const price = formatPrice(item?.price);
          return (
            <li key={item?.id || `${item?.name}-${item?.price}-${i}`} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-content-primary">{item?.name}</span>
                  {(item?.is_vegan || item?.isVegan) && <VeganBadge label="Vegan" />}
                </div>
                {price && (
                  <span className="shrink-0 font-bold text-brand-accent tabular-nums whitespace-nowrap">{price}</span>
                )}
              </div>
              {item?.description && (
                <p className="m-0 mt-1 text-sm text-content-secondary leading-relaxed">{item.description}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
