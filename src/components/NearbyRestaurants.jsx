import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Slider } from '@mui/material';
import { toast } from 'react-toastify';
import RoomIcon from '@mui/icons-material/Room';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import RestaurantRoundedIcon from '@mui/icons-material/RestaurantRounded';
import api, { API_BASE_URL } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import SectionHeader from './ui/SectionHeader';
import EmptyState from './ui/EmptyState';
import Button from './ui/Button';
import { handleImageError } from '../utils/media';
import { cleanAddress, townFromAddress } from '../utils/address';

const INITIAL_VISIBLE = 8;

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
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const navigate = useNavigate();
  const { isLoadingPlaces } = useAuth();

  const handleSurpriseMe = async () => {
    if (surpriseLoading) return;
    setSurpriseLoading(true);
    try {
      const res = await api.get('/api/restaurants/surpriseme');
      if (res.data && res.data.id) {
        navigate(`/restaurants/${res.data.id}`);
      } else {
        toast.info('No approved restaurants to pick from right now.');
      }
    } catch (error) {
      console.error('Error fetching surprise restaurant:', error);
      toast.error("Couldn't pick a surprise spot. Please try again.");
    } finally {
      setSurpriseLoading(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        if (setCoordinates) setCoordinates({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        setLocating(false);
        setLocationError('Location permission was denied. You can allow it in your browser settings, or browse the map instead.');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
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
  // Coordinates start as {} until geolocation resolves, so require real numbers.
  const hasLocation = Boolean(origin) && origin.lat != null && origin.lng != null
    && Number.isFinite(Number(origin.lat)) && Number.isFinite(Number(origin.lng));
  // Distances are only meaningful from the person's real location (not the map center fallback).
  const hasRealLocation = Boolean(userCoords) && Number.isFinite(Number(userCoords.lat)) && Number.isFinite(Number(userCoords.lng));

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


  // Reset pagination when the result set changes
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [searchQuery, debouncedRadiusKm]);

  const visible = filteredNearby.slice(0, visibleCount);
  const remaining = filteredNearby.length - visible.length;
  const showSkeleton = hasLocation && isLoadingPlaces && nearby.length === 0;
  const scrollToMap = () => document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section id="nearby" aria-labelledby="nearby-title" className="scroll-mt-24 py-12 sm:py-16 border-t border-subtle">
      <SectionHeader
        id="nearby-title"
        title="Nearby restaurants"
        lede="Sorted by distance from you."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={handleSurpriseMe} disabled={surpriseLoading} aria-busy={surpriseLoading}>
              <CasinoOutlinedIcon sx={{ fontSize: 18 }} aria-hidden="true" />
              {surpriseLoading ? 'Picking a spot…' : 'Surprise me'}
            </Button>
            <Button variant="ghost" size="sm" onClick={scrollToMap}>
              <MapOutlinedIcon sx={{ fontSize: 18 }} aria-hidden="true" />
              View all on map
            </Button>
          </>
        }
      />

      {/* Filters */}
      <div className="mt-6 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 min-w-0">
          <label htmlFor="nearby-search" className="visually-hidden">Filter nearby restaurants</label>
          <SearchRoundedIcon
            sx={{ fontSize: 20, color: 'var(--text-muted)', position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            aria-hidden="true"
          />
          <input
            id="nearby-search"
            type="search"
            placeholder="Filter by name, cuisine, or town…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full min-h-[48px] rounded-full pl-11 pr-4 bg-surface border border-[var(--input-border)] hover:border-strong focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15 outline-none text-base text-content-primary placeholder:text-content-muted transition-[border-color,box-shadow]"
          />
        </div>
        <div className="flex items-center gap-4 min-h-[48px] px-5 rounded-full bg-surface border border-subtle md:w-[300px]">
          <span id="radius-label" className="text-sm font-semibold text-content-secondary whitespace-nowrap">
            Within <span className="text-content-primary tabular-nums">{radiusKm} km</span>
          </span>
          <Slider
            value={radiusKm}
            min={1}
            max={50}
            onChange={(_, v) => setRadiusKm(v)}
            aria-labelledby="radius-label"
            getAriaValueText={(v) => `${v} kilometers`}
            size="small"
            sx={{ color: 'var(--accent)', flex: 1, py: 1.5 }}
          />
        </div>
      </div>

      <div className="mt-8">
        {!hasLocation ? (
          <EmptyState
            icon={<MyLocationRoundedIcon />}
            title="Location is off"
            description={locationError || 'Allow location access to list restaurants by distance. It is only used in your browser to sort results.'}
            tone={locationError ? 'error' : 'neutral'}
            action={
              <>
                <Button onClick={requestLocation} disabled={locating} aria-busy={locating}>
                  <MyLocationRoundedIcon sx={{ fontSize: 18 }} aria-hidden="true" />
                  {locating ? 'Finding you…' : 'Use my location'}
                </Button>
                <Button variant="secondary" onClick={scrollToMap}>Browse the map</Button>
              </>
            }
          />
        ) : showSkeleton ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" aria-busy="true" aria-label="Loading restaurants">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-card overflow-hidden border border-subtle bg-surface">
                <div className="aspect-[4/3] skeleton" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-3/4 rounded skeleton" />
                  <div className="h-3 w-1/2 rounded skeleton" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNearby.length === 0 ? (
          searchQuery.trim() ? (
            <EmptyState
              icon={<SearchRoundedIcon />}
              title={`No matches for "${searchQuery.trim()}"`}
              description={`Nothing within ${debouncedRadiusKm} km matches that search. Try another word or widen the distance.`}
              action={<Button variant="secondary" onClick={() => setSearchQuery('')}>Clear search</Button>}
            />
          ) : (
            <EmptyState
              icon={<RestaurantRoundedIcon />}
              title={`Nothing within ${debouncedRadiusKm} km`}
              description="Increase the distance, or look around on the map."
              action={
                debouncedRadiusKm < 50 ? (
                  <Button variant="secondary" onClick={() => setRadiusKm(50)}>Show up to 50 km</Button>
                ) : null
              }
            />
          )
        ) : (
          <>
            <p className="text-sm text-content-secondary mb-4" aria-live="polite">
              {filteredNearby.length} {filteredNearby.length === 1 ? 'place' : 'places'} within {debouncedRadiusKm} km
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 list-none p-0 m-0">
              {visible.map((item) => (
                <li key={`${item.ownerPlaceId || item.id}-${item.source}`} className="flex">
                  <NearbyCard item={item} showDistance={hasRealLocation} />
                </li>
              ))}
            </ul>
            {remaining > 0 && (
              <div className="mt-8 flex justify-center">
                <Button variant="secondary" onClick={() => setVisibleCount((c) => c + INITIAL_VISIBLE)}>
                  Show {Math.min(remaining, INITIAL_VISIBLE)} more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

const BADGE_TONE = {
  brand: 'bg-[var(--forest-700)] text-white',
  warm: 'bg-[var(--annatto-600)] text-white',
  neutral: 'bg-white/95 text-[#16261c]',
};

function NearbyCard({ item, showDistance }) {
  const targetPath = openTargetForEntry(item);
  const Wrapper = targetPath ? Link : 'div';
  const wrapperProps = targetPath ? { to: targetPath } : {};
  const badges = [item.source === 'place' ? { label: 'Verified', tone: 'brand' } : { label: 'Community', tone: 'neutral' }];
  if (item.rating_avg >= 4.5) badges.push({ label: 'Top rated', tone: 'warm' });
  if (item.rating_count >= 3) badges.push({ label: 'Trending', tone: 'warm' });
  if (Array.isArray(item.custom_badges)) item.custom_badges.forEach((b) => badges.push({ label: b, tone: 'neutral' }));

  return (
    <Wrapper
      {...wrapperProps}
      className="group flex flex-row sm:flex-col w-full bg-surface border border-subtle rounded-card overflow-hidden no-underline shadow-card hover:shadow-lift transition-shadow duration-300 focus-visible:ring-4 focus-visible:ring-brand-accent/30"
    >
      <div className="relative w-28 shrink-0 self-stretch min-h-[112px] sm:w-auto sm:min-h-0 sm:aspect-[4/3] bg-background-secondary overflow-hidden">
        {item.image ? (
          /\.(mp4|webm|ogg)$/i.test(item.image) ? (
            <video className="w-full h-full object-cover" autoPlay muted loop playsInline aria-hidden="true">
              <source src={mediaSource(item.image)} />
            </video>
          ) : (
            <img
              src={mediaSource(item.image)}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          )
        ) : (
          <div className="w-full h-full grid place-items-center text-content-muted">
            <RoomIcon sx={{ fontSize: 40 }} aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-3 left-3 right-3 hidden sm:flex flex-wrap gap-1.5">
          {badges.map((b, i) => (
            <span key={`${b.label}-${i}`} className={`text-[0.7rem] font-semibold px-1.5 py-0.5 rounded ${BADGE_TONE[b.tone]}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4">
        <span className="sm:hidden mb-1 flex flex-wrap gap-1">
          {badges.slice(0, 2).map((b, i) => (
            <span key={`m-${b.label}-${i}`} className={`text-[0.68rem] font-semibold px-1.5 py-0.5 rounded ${b.tone === 'neutral' ? 'bg-background-secondary text-content-secondary' : BADGE_TONE[b.tone]}`}>
              {b.label}
            </span>
          ))}
        </span>
        <h3 className="text-[1.02rem] sm:text-[1.05rem] font-bold leading-snug text-content-primary m-0 line-clamp-2 group-hover:text-brand-accent transition-colors" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>
          {item.name}
        </h3>
        <p className="text-sm text-content-secondary line-clamp-2 mt-1 sm:mt-1.5 mb-2 sm:mb-3 leading-snug">
          {cleanAddress(item.address) || 'Cavite'}
        </p>
        <div className="mt-auto pt-2 sm:pt-3 flex items-center justify-between sm:border-t border-subtle text-sm">
          <span className="inline-flex items-center gap-1 font-semibold text-content-primary">
            <StarRoundedIcon sx={{ fontSize: 18, color: 'var(--star)' }} aria-hidden="true" />
            {item.rating_avg ? Number(item.rating_avg).toFixed(1) : <span className="font-normal text-content-secondary">New</span>}
            <span className="visually-hidden"> rating</span>
          </span>
          {showDistance ? (
            <span className="inline-flex items-center gap-1 font-semibold text-content-secondary tabular-nums">
              <RoomIcon sx={{ fontSize: 16 }} aria-hidden="true" />
              {item.distance < 0.1 ? '< 0.1' : item.distance.toFixed(1)} km
            </span>
          ) : townFromAddress(item.address) ? (
            <span className="inline-flex items-center gap-1 font-semibold text-content-secondary truncate max-w-[55%]">
              <RoomIcon sx={{ fontSize: 16 }} aria-hidden="true" />
              <span className="truncate">{townFromAddress(item.address)}</span>
            </span>
          ) : null}
        </div>
      </div>
    </Wrapper>
  );
}

export default NearbyRestaurants;
