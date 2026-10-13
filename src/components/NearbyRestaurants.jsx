import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slider } from '@mui/material';
import RoomIcon from '@mui/icons-material/Room';
import api, { API_BASE_URL } from '../api/backend';

// Helper functions for distance and data merging
function distanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((value) => value === null || Number.isNaN(Number(value)))) return Infinity;
  const toRad = (value) => (Number(value) * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function menuItemKey(item) {
  return [
    String(item?.name || '').trim().toLowerCase(),
    String(item?.description || '').trim().toLowerCase(),
    item?.price ?? '',
    item?.is_vegan || item?.isVegan ? 1 : 0,
  ].join('|');
}

function mergeMenuItems(...groups) {
  const merged = new Map();
  groups
    .flat()
    .filter(Boolean)
    .forEach((item) => {
      const key = menuItemKey(item);
      if (!merged.has(key)) merged.set(key, item);
    });
  return Array.from(merged.values());
}

function normalizedRestaurantKey(entry) {
  const name = String(entry?.name || '').trim().toLowerCase();
  const lat = entry?.lat == null ? '' : Number(entry.lat).toFixed(3);
  const lng = entry?.lng == null ? '' : Number(entry.lng).toFixed(3);
  return `${name}|${lat}|${lng}`;
}

function mediaSource(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}

function openTargetForEntry(entry) {
  if (entry?.primaryUploadId) return `/post/${entry.primaryUploadId}`;
  if (entry?.ownerPlaceId) return `/restaurants/${entry.ownerPlaceId}`;
  return null;
}

const NearbyRestaurants = ({ 
  userCoords, 
  coordinates, 
  ownerPlaces = [], 
  setCoordinates, 
  uploads = [], 
  posts = [],
  searchQuery,
  setSearchQuery
}) => {
  const [radiusKm, setRadiusKm] = useState(10);
  const [debouncedRadiusKm, setDebouncedRadiusKm] = useState(10);
  const navigate = useNavigate();

  const handleSurpriseMe = async () => {
    try {
      const res = await api.get('/api/restaurants/surpriseme');
      if (res.data && res.data.id) {
        navigate(`/restaurants/${res.data.id}`);
      }
    } catch (error) {
      console.error('Error fetching surprise restaurant:', error);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedRadiusKm(radiusKm);
    }, 200);
    return () => clearTimeout(handler);
  }, [radiusKm]);

  const buildPostsFromUploads = useCallback(() => {
    if (!Array.isArray(uploads)) return [];
    const groupedPosts = new Map();
    const singles = [];

    for (const upload of uploads) {
      if (upload.post_id) {
        const key = `post-${upload.post_id}`;
        if (!groupedPosts.has(key)) {
          groupedPosts.set(key, {
            id: upload.post_id,
            media: [],
            caption: upload.caption,
            address: upload.address,
            created_at: upload.created_at,
            rating_avg: null,
            rating_count: 0,
            lat: upload.lat,
            lng: upload.lng,
          });
        }
        const entry = groupedPosts.get(key);
        entry.media.push({
          id: upload.id,
          filename: upload.filename,
          url: upload.url,
          created_at: upload.created_at,
          rating_avg: upload.rating_avg,
          rating_count: upload.rating_count,
          lat: upload.lat,
          lng: upload.lng,
        });
        if (entry.lat == null && upload.lat != null) entry.lat = upload.lat;
        if (entry.lng == null && upload.lng != null) entry.lng = upload.lng;
        if (upload.rating_avg != null && upload.rating_count != null) {
          const previousAverage = entry.rating_avg || 0;
          const previousCount = entry.rating_count || 0;
          const totalScore =
            previousAverage * previousCount + (upload.rating_avg || 0) * (upload.rating_count || 0);
          const totalCount = previousCount + (upload.rating_count || 0);
          entry.rating_avg = totalCount ? totalScore / totalCount : null;
          entry.rating_count = totalCount;
        }
      } else {
        singles.push({
          id: upload.id,
          media: [{ id: upload.id, filename: upload.filename, url: upload.url, created_at: upload.created_at, lat: upload.lat, lng: upload.lng }],
          caption: upload.caption,
          address: upload.address,
          created_at: upload.created_at,
          rating_avg: upload.rating_avg,
          rating_count: upload.rating_count,
          lat: upload.lat,
          lng: upload.lng,
        });
      }
    }

    return [...Array.from(groupedPosts.values()), ...singles];
  }, [uploads]);

  const effectivePosts = Array.isArray(posts) && posts.length > 0 ? posts : buildPostsFromUploads();
  const origin = userCoords || coordinates;
  const hasLocation = origin && origin.lat !== null && origin.lng !== null;

  const nearby = useMemo(() => {
    if (!hasLocation) return [];

    const mergedEntries = new Map();

    const upsertEntry = (entry) => {
      const key = entry.ownerPlaceId ? `owner-${entry.ownerPlaceId}` : normalizedRestaurantKey(entry);
      const existing = mergedEntries.get(key);
      if (!existing) {
        mergedEntries.set(key, entry);
        return;
      }

      const preferred = existing.source === 'place' ? existing : entry.source === 'place' ? entry : existing;
      const fallback = preferred === existing ? entry : existing;
      const primaryUploadId = existing.primaryUploadId || entry.primaryUploadId || null;
      const postAddress = existing.postAddress || entry.postAddress || '';
      const postDescription = existing.postDescription || entry.postDescription || '';
      const postLat = existing.postLat ?? entry.postLat;
      const postLng = existing.postLng ?? entry.postLng;

      mergedEntries.set(key, {
        ...fallback,
        ...preferred,
        source: preferred.source === 'place' || fallback.source === 'place' ? 'place' : preferred.source,
        ownerPlaceId: preferred.ownerPlaceId || fallback.ownerPlaceId || null,
        name: preferred.name || fallback.name,
        address: postAddress || preferred.address || fallback.address || '',
        description: postDescription || preferred.description || fallback.description || '',
        image: preferred.image || fallback.image || null,
        lat: postLat ?? preferred.lat ?? fallback.lat,
        lng: postLng ?? preferred.lng ?? fallback.lng,
        distance: Math.min(existing.distance, entry.distance),
        rating_avg: preferred.rating_avg ?? fallback.rating_avg ?? null,
        rating_count: Math.max(Number(existing.rating_count) || 0, Number(entry.rating_count) || 0),
        has_vegan_items: Boolean(existing.has_vegan_items || entry.has_vegan_items),
        menu_items: mergeMenuItems(existing.menu_items, entry.menu_items),
        primaryUploadId,
        postAddress,
        postDescription,
        postLat,
        postLng,
      });
    };

    ownerPlaces
      ?.filter((place) => place.lat !== null && place.lng !== null)
      ?.forEach((place) => {
        upsertEntry({
          source: 'place',
          id: place.id,
          ownerPlaceId: place.id,
          name: place.name,
          address: place.address || '',
          description: place.description || '',
          lat: place.lat,
          lng: place.lng,
          image: place.display_image_url || place.image_url || null,
          distance: distanceKm(origin.lat, origin.lng, place.lat, place.lng),
          rating_avg: null,
          rating_count: 0,
          has_vegan_items: !!place.has_vegan_items,
          menu_items: Array.isArray(place.menu_items) ? place.menu_items : [],
          primaryUploadId: null,
          postAddress: '',
          postDescription: '',
          postLat: null,
          postLng: null,
        });
      });

    effectivePosts
      ?.filter((post) => post.lat !== null && post.lng !== null)
      ?.forEach((post) => {
        const firstMediaUrl = post?.media?.[0]?.url || null;
        upsertEntry({
          source: post?.owner_place_id ? 'place' : 'post',
          id: post.id,
          ownerPlaceId: post.owner_place_id || null,
          name: post.restaurant_name || post.caption || 'Owner post',
          address: post.address || post.restaurant_address || '',
          description: post.caption || post.restaurant_description || '',
          lat: post.lat,
          lng: post.lng,
          image: post.restaurant_image_url || firstMediaUrl || null,
          distance: distanceKm(origin.lat, origin.lng, post.lat, post.lng),
          rating_avg: post.rating_avg || null,
          rating_count: post.rating_count || 0,
          has_vegan_items: !!post.has_vegan_items,
          menu_items: Array.isArray(post.menu_items) ? post.menu_items : [],
          primaryUploadId: post?.media?.[0]?.id || null,
          postAddress: post.address || '',
          postDescription: post.caption || '',
          postLat: post.lat,
          postLng: post.lng,
        });
      });

    return Array.from(mergedEntries.values())
      .filter((entry) => entry.distance <= debouncedRadiusKm)
      .sort((a, b) => a.distance - b.distance);
  }, [effectivePosts, hasLocation, origin, ownerPlaces, debouncedRadiusKm]);

  const filteredNearby = useMemo(() => {
    if (!searchQuery.trim()) return nearby;
    const query = searchQuery.toLowerCase();
    return nearby.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)) ||
      (item.address && item.address.toLowerCase().includes(query))
    );
  }, [nearby, searchQuery]);

  return (
    <section className="mt-12">
      {/* Top Section Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Nearby Restaurants</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSurpriseMe}
            className="text-xs font-black uppercase tracking-wider text-[var(--brand-accent)] bg-[var(--brand-accent)]/10 px-3 py-1.5 rounded-xl border border-[var(--brand-accent)]/20 hover:bg-[var(--brand-accent)] hover:text-white transition-all flex items-center gap-1"
          >
            🎲 Surprise Me
          </button>
          <button
            className="text-sm font-bold text-[var(--accent)] hover:underline"
            onClick={() => {
              const mapSection = document.getElementById('map');
              if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            View All on Map
          </button>
        </div>
      </div>

      {/* Bounded Scroll Container */}
      <div className="max-h-[70vh] lg:max-h-[600px] overflow-y-auto overscroll-contain pr-2 scrollbar-thin scrollbar-thumb-[var(--border-brand)] scrollbar-track-transparent">

        {/* Sticky Search with Glassmorphism */}
        <div className="sticky top-0 z-20 bg-[var(--surface)]/95 backdrop-blur-md pb-4 pt-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, cuisine, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl pl-11 pr-24 py-3 bg-[var(--bg-secondary)]/50 border border-[var(--border-subtle)] focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] focus:bg-[var(--surface)] transition-all outline-none text-sm font-medium text-[var(--text-primary)]"
            />

            {/* Radius Control inside search for compactness */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <div className="bg-[var(--surface)] shadow-sm border border-[var(--border-subtle)] rounded-xl px-3 py-1 flex items-center gap-2">
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{radiusKm}km</span>
                <Slider
                  value={radiusKm} min={1} max={50}
                  onChange={(_, v) => setRadiusKm(v)}
                  sx={{ width: 60, color: 'var(--accent)', py: 0 }}
                />
              </div>
            </div>
          </div>
        </div>

        {!hasLocation ? (
          <div className="bg-[var(--surface)] p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] text-center">
            <RoomIcon className="text-[var(--text-secondary)] text-5xl mb-3 opacity-50" />
            <p className="text-[var(--text-secondary)] font-bold">Location access required to see nearby spots.</p>
          </div>
        ) : filteredNearby.length === 0 ? (
          <div className="bg-[var(--surface)] p-12 rounded-3xl border border-dashed border-[var(--border-subtle)] text-center">
            <p className="text-[var(--text-secondary)] font-bold">No results matching "{searchQuery}"</p>
            <button onClick={() => setSearchQuery('')} className="mt-3 text-[var(--accent)] font-black uppercase text-xs tracking-widest hover:underline">Clear Search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6 items-stretch">
            {filteredNearby.map((item) => {
              const targetPath = openTargetForEntry(item);
              return (
                <div
                  key={`${item.ownerPlaceId || item.id}-${item.source}`}
                  className="flex flex-col h-full bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => targetPath && navigate(targetPath)}
                >
                  {/* Uniform Image Container */}
                  <div className="w-full h-48 sm:h-52 bg-[var(--bg-secondary)] relative overflow-hidden flex-shrink-0">
                    {item.image ? (
                      /\.(mp4|webm|ogg)$/i.test(item.image) ? (
                        <video className="w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-500" autoPlay muted loop playsInline>
                          <source src={mediaSource(item.image)} />
                        </video>
                      ) : (
                        <img
                          src={mediaSource(item.image)}
                          alt={item.name}
                          className="w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Delicious+Food'; }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-secondary)]">
                        <RoomIcon className="text-[var(--text-secondary)] text-4xl" />
                      </div>
                    )}

                    {/* Badges Overlay Container */}
                    <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 items-center pointer-events-none">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-md border ${item.source === 'place' ? 'bg-green-500/80 text-white border-green-400' : 'bg-blue-500/80 text-white border-blue-400'}`}>
                        {item.source === 'place' ? 'Verified' : 'Community'}
                      </span>
                      
                      {/* 🏆 Top Rated Badge */}
                      {item.rating_avg >= 4.5 && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-md bg-amber-500/80 text-white border border-amber-400 flex items-center gap-0.5">
                          🏆 Top Rated
                        </span>
                      )}

                      {/* 🔥 Trending Badge */}
                      {item.rating_count >= 3 && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-md bg-rose-500/80 text-white border border-rose-400 flex items-center gap-0.5 animate-pulse">
                          🔥 Trending
                        </span>
                      )}

                      {/* DB Custom Badges */}
                      {Array.isArray(item.custom_badges) && item.custom_badges.map((badge, idx) => (
                        <span key={idx} className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg backdrop-blur-md bg-indigo-500/80 text-white border border-indigo-400">
                          🏅 {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex flex-col flex-1 p-4 md:p-5">
                    <h3 className="text-lg font-extrabold text-[var(--text-primary)] leading-tight mb-1 truncate group-hover:text-[var(--accent)] transition-colors">
                      {item.name}
                    </h3>

                    <p className="text-sm text-secondary line-clamp-2 mt-2 mb-4">
                      {item.address || 'Cavite, Philippines'}
                    </p>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-border-subtle/50">
                      <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1.5 rounded-xl border border-amber-500/20">
                        <span className="text-amber-500 text-sm font-bold">★</span>
                        <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                          {item.rating_avg ? Number(item.rating_avg).toFixed(1) : 'New'}
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[11px] font-black text-[var(--text-primary)] tracking-tighter uppercase">{item.distance.toFixed(1)} km</span>
                        <span className="text-[9px] font-bold text-[var(--accent)] uppercase tracking-widest">Nearby</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default NearbyRestaurants;
