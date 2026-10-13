import React, { useState, useMemo, useEffect } from 'react';
import { API_BASE_URL } from '../api/backend';

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return null;
  return `PHP ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function mediaUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}

/**
 * ResponsiveMenu component
 * - Mobile (< 768px): Food delivery app style with sticky category tabs and vertical cards.
 * - Desktop (>= 768px): Physical restaurant menu book style with multi-column CSS grid, dotted leaders, and elegant typography.
 */
export default function ResponsiveMenu({ items = [], restaurantName = '', onManageMenu = null }) {
  // Phase 1: Group items by category with 'Featured Offerings' fallback
  const groupedMenu = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return {};
    return items.reduce((acc, item) => {
      const rawCat = (item?.category || '').trim();
      const category = rawCat || 'Featured Offerings';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [items]);

  const categories = useMemo(() => {
    const keys = Object.keys(groupedMenu);
    if (keys.length === 0) return [];
    return ['All', ...keys];
  }, [groupedMenu]);

  // State Management for Mobile filtering
  const [activeCategory, setActiveCategory] = useState('All');

  // Reset activeCategory if filtered out
  useEffect(() => {
    if (activeCategory !== 'All' && !groupedMenu[activeCategory]) {
      setActiveCategory('All');
    }
  }, [groupedMenu, activeCategory]);

  const filteredMobileItems = useMemo(() => {
    if (activeCategory === 'All') {
      return items || [];
    }
    return groupedMenu[activeCategory] || [];
  }, [activeCategory, items, groupedMenu]);

  // Phase 4: Empty State
  if (!items || items.length === 0) {
    return (
      <div className="w-full text-center py-16 px-6 bg-[var(--surface)] rounded-2xl border border-dashed border-[var(--border-subtle)] shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--brand-accent-soft)] flex items-center justify-center text-3xl">
          🍽️
        </div>
        <h4 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Digital Menu Coming Soon
        </h4>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
          {onManageMenu
            ? 'Want to update your menu? Create a new post showcasing your dish!'
            : 'This establishment is curating their digital menu. Check back soon!'}
        </p>
        {onManageMenu && (
          <button
            onClick={onManageMenu}
            className="mt-5 px-5 py-2.5 bg-[var(--brand-accent)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-sm cursor-pointer border-0"
          >
            📸 Create a Post to Add Items
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ========================================================================= */}
      {/* 📱 Phase 2: Mobile "Delivery App" Layout (< 768px)                       */}
      {/* ========================================================================= */}
      <div className="block md:hidden w-full">
        {/* Sticky Horizontal Category Tab Bar */}
        <div className="sticky top-16 z-20 -mx-4 px-4 py-2.5 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] shadow-xs mb-4">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide py-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const count = cat === 'All' ? items.length : (groupedMenu[cat]?.length || 0);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex-shrink-0 cursor-pointer border-0 ${
                    isActive
                      ? 'bg-[var(--brand-accent)] text-white shadow-xs'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Vertical Stacked Cards */}
        <div className="space-y-3">
          {filteredMobileItems.map((item, idx) => {
            const itemImg = mediaUrl(item?.image_url || item?.imageUrl || item?.display_image_url);
            const isVegan = Number(item?.is_vegan) === 1 || item?.is_vegan === true || item?.isVegan;
            const priceStr = formatPrice(item?.price);

            return (
              <div
                key={item?.id || `${item?.name || 'item'}-${idx}`}
                className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-xs flex gap-3.5 items-center transition-all hover:border-[var(--brand-accent)]"
              >
                {/* Food Image / Placeholder */}
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] flex items-center justify-center">
                  {itemImg ? (
                    <img
                      src={itemImg}
                      alt={item?.name || 'Menu item'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full items-center justify-center text-2xl text-[var(--text-secondary)] ${
                      itemImg ? 'hidden' : 'flex'
                    }`}
                  >
                    🥗
                  </div>
                </div>

                {/* Right Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h5 className="font-bold text-[var(--text-primary)] text-base truncate m-0">
                      {item?.name}
                    </h5>
                    {isVegan && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ml-2">
                        🌱 Vegan
                      </span>
                    )}
                  </div>
                  {item?.description && (
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-snug m-0">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[var(--brand-accent)]">
                      {priceStr || 'Price upon inquiry'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                      {(item?.category || '').trim() || 'Featured'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📖 Phase 3: Desktop "Physical Menu" Layout (>= 768px)                     */}
      {/* ========================================================================= */}
      <div className="hidden md:block w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto p-8 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-sm">
          {Object.entries(groupedMenu).map(([categoryName, categoryItems]) => (
            <div key={categoryName} className="space-y-6">
              {/* Stylized Category Header */}
              <div className="border-b-2 border-[var(--brand-accent)] pb-2 mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold tracking-widest text-[var(--text-primary)] uppercase font-serif m-0">
                  {categoryName}
                </h3>
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                  {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Elegant Text-Heavy Rows */}
              <div className="space-y-5">
                {categoryItems.map((item, idx) => {
                  const isVegan = Number(item?.is_vegan) === 1 || item?.is_vegan === true || item?.isVegan;
                  const priceStr = formatPrice(item?.price);

                  return (
                    <div key={item?.id || `${item?.name || 'item'}-${idx}`} className="group">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="font-semibold text-[var(--text-primary)] text-base flex items-center gap-2 group-hover:text-[var(--brand-accent)] transition-colors">
                          <span>{item?.name}</span>
                          {isVegan && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ml-2">
                              🌱 Vegan
                            </span>
                          )}
                        </div>
                        <span className="flex-grow border-b border-dotted border-[var(--border-subtle)] mx-2 self-center min-w-[24px]" />
                        <span className="font-bold text-[var(--text-primary)] text-base whitespace-nowrap">
                          {priceStr || '—'}
                        </span>
                      </div>
                      {item?.description && (
                        <p className="text-sm text-[var(--text-secondary)] italic mt-1 leading-snug max-w-lg m-0">
                          {item.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
