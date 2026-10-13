import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import FacebookIcon from '@mui/icons-material/Facebook';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import RoomIcon from '@mui/icons-material/Room';
import VerifiedIcon from '@mui/icons-material/Verified';
import EmptyState from '../components/ui/EmptyState';
import UiButton from '../components/ui/Button';
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import { handleImageError } from '../utils/media';
import VeganBadge from '../components/VeganBadge';
import ResponsiveMenu from '../components/ResponsiveMenu';
import api, { API_BASE_URL } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cleanAddress } from '../utils/address';

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return null;
  return `PHP ${price.toFixed(2)}`;
}

function mediaUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}

function isVideo(url) {
  return /\.(mp4|webm|ogg)$/i.test(url || '');
}

function firstPostMedia(post) {
  return post?.media && post.media[0] ? post.media[0] : null;
}

function mapPointFrom(source) {
  const lat = Number(source?.lat);
  const lng = Number(source?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getVendorRank(level) {
  const lvl = Number(level ?? 1);
  if (lvl >= 3) return { rank: "Cavite Taste-Maker", bg: "#fff7db", color: "#7c4d00", border: "#f0c75e" };
  if (lvl === 2) return { rank: "Neighborhood Favorite", bg: "#e7f7ec", color: "#17603a", border: "#9ad5ad" };
  return { rank: "Local Business", bg: "#e8f1ff", color: "#244f86", border: "#a9c6eb" };
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ownerPlaces, fetchOwnerPlaces } = useAuth();
  const [place, setPlace] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(place?.name);

  useEffect(() => {
    let ignore = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        // fetchOwnerPlaces will do nothing if already loaded
        await fetchOwnerPlaces();
        
        const postsResponse = await api.get('/api/uploads/posts');

        const foundPlace = ownerPlaces?.find((entry) => String(entry?.id) === String(id));

        if (!foundPlace) {
          if (!ignore) {
            setPlace(null);
            setPosts([]);
            setError('Restaurant not found.');
          }
          return;
        }

        const allPosts = Array.isArray(postsResponse.data)
          ? postsResponse.data
          : Array.isArray(postsResponse.data?.posts)
            ? postsResponse.data.posts
            : [];
        const ownerPosts = allPosts.filter((post) => Number(post?.owner_place_id) === Number(foundPlace.id));

        if (!ignore) {
          setPlace(foundPlace);
          setPosts(ownerPosts);
        }
      } catch (e) {
        if (!ignore) {
          setError('Failed to load restaurant page.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id, ownerPlaces, fetchOwnerPlaces]);

  const menuItems = useMemo(() => {
    const source = [];

    posts?.forEach?.((post) => {
      if (Array.isArray(post?.menu_items)) source.push(...post.menu_items);
    });

    if (!source.length && Array.isArray(place?.menu_items)) {
      source.push(...place.menu_items);
    }

    const uniqueItems = new Map();
    source.forEach((item, index) => {
      const key = `${item?.name || ''}|${item?.description || ''}|${item?.price ?? ''}|${item?.is_vegan || item?.isVegan ? 1 : 0}`;
      if (!uniqueItems.has(key)) uniqueItems.set(key, { ...item, _index: index });
    });
    return Array.from(uniqueItems.values());
  }, [place, posts]);

  const hasVeganOptions = Boolean(place?.has_vegan_items) || (menuItems || []).some((item) => item?.is_vegan || item?.isVegan);
  const fallbackPostImage = mediaUrl(firstPostMedia(posts?.[0])?.url);
  const coverImage =
    mediaUrl(place?.display_image_url || place?.image_url) ||
    (!isVideo(fallbackPostImage) ? fallbackPostImage : null) ||
    '/GreenSimpleCleanVeganFoodLogo.png';
  const rankInfo = getVendorRank(place?.owner_level ?? place?.owner?.level ?? 1);
  const postMapTarget = useMemo(() => posts?.map(mapPointFrom).find(Boolean) || null, [posts]);
  const placeMapTarget = mapPointFrom(place);
  const mapTarget = postMapTarget || placeMapTarget;
  const mapTargetSource = postMapTarget ? 'post' : 'place';
  const canShowOnMap = Boolean(place?.id && (mapTarget || place?.address));
  const showOnMap = () => {
    const params = new URLSearchParams();
    params.set('focus', 'map');
    params.set('ownerPlaceId', String(place?.id || ''));
    params.set('source', mapTargetSource);
    if (mapTarget) {
      params.set('lat', String(mapTarget.lat));
      params.set('lng', String(mapTarget.lng));
    }
    navigate({
      pathname: '/',
      search: `?${params.toString()}`,
      hash: '#map',
    });
  };

  const BackLink = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
      className="inline-flex items-center gap-1.5 min-h-[44px] -ml-2 px-2 rounded-full font-semibold text-content-secondary hover:text-content-primary transition-colors"
    >
      <ArrowBackIosNewIcon sx={{ fontSize: 15 }} aria-hidden="true" />
      Back
    </button>
  );

  if (loading) {
    return (
      <div className="pt-6 pb-12" aria-busy="true" role="status" aria-label="Loading restaurant">
        <div className="h-6 w-20 rounded skeleton mb-6" />
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-full sm:w-48 aspect-square rounded-panel skeleton" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-9 w-2/3 rounded skeleton" />
            <div className="h-4 w-1/2 rounded skeleton" />
            <div className="h-4 w-5/6 rounded skeleton" />
            <div className="h-4 w-4/6 rounded skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="pt-6 pb-12">
        {BackLink}
        <EmptyState
          className="mt-6"
          icon={<RoomIcon />}
          tone={error && error !== 'Restaurant not found.' ? 'error' : 'neutral'}
          title={error === 'Failed to load restaurant page.' ? "We couldn't load this restaurant" : 'Restaurant not found'}
          description={
            error === 'Failed to load restaurant page.'
              ? 'Check your connection and try again.'
              : 'It may have been removed or is still waiting for approval.'
          }
          action={
            <>
              {error === 'Failed to load restaurant page.' && (
                <UiButton onClick={() => window.location.reload()}>Try again</UiButton>
              )}
              <UiButton variant="secondary" onClick={() => navigate('/')}>Go to home</UiButton>
            </>
          }
        />
      </div>
    );
  }

  const contactLinks = [
    place?.phone && { key: 'phone', href: `tel:${String(place.phone).replace(/\s+/g, '')}`, icon: <LocalPhoneOutlinedIcon fontSize="small" />, label: place.phone },
    place?.facebook_url && { key: 'facebook', href: place.facebook_url, external: true, icon: <FacebookIcon fontSize="small" />, label: 'Facebook page' },
    place?.email && { key: 'email', href: `mailto:${place.email}`, icon: <EmailOutlinedIcon fontSize="small" />, label: place.email },
  ].filter(Boolean);

  return (
    <div className="pt-6 pb-12">
      {BackLink}

      {/* ── Restaurant header ── */}
      <section aria-labelledby="restaurant-name" className="mt-4 bg-surface border border-subtle rounded-panel p-5 sm:p-7 shadow-card">
        <div className="flex flex-col sm:flex-row gap-6">
          <img
            src={coverImage}
            alt={place?.name || 'Restaurant'}
            className="w-full sm:w-44 md:w-52 aspect-[4/3] sm:aspect-square rounded-card object-cover bg-background-secondary shrink-0"
            onError={handleImageError}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold">
                <VerifiedIcon sx={{ fontSize: 15 }} aria-hidden="true" />
                Verified
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-xs font-bold border"
                style={{ background: rankInfo.bg, color: rankInfo.color, borderColor: rankInfo.border }}
              >
                {rankInfo.rank}
              </span>
              {hasVeganOptions && <VeganBadge />}
            </div>
            <h1 id="restaurant-name" className="m-0 font-display text-3xl sm:text-4xl font-semibold leading-tight text-content-primary">
              {place?.name}
            </h1>
            {place?.address && (
              <p className="mt-2 mb-0 flex items-start gap-1.5 text-content-secondary">
                <RoomIcon sx={{ fontSize: 18, mt: '3px' }} aria-hidden="true" />
                {cleanAddress(place.address)}
              </p>
            )}
            {place?.description && (
              <p className="mt-4 mb-0 text-content-primary leading-relaxed max-w-3xl">{place.description}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {canShowOnMap && (
                <UiButton onClick={showOnMap}>
                  <RoomIcon sx={{ fontSize: 18 }} aria-hidden="true" />
                  Show on map
                </UiButton>
              )}
              {contactLinks.map((c) => (
                <a
                  key={c.key}
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-full border border-strong text-content-primary font-semibold text-sm no-underline hover:border-brand-accent hover:text-brand-accent transition-colors max-w-full"
                >
                  {c.icon}
                  <span className="truncate">{c.label}</span>
                  {c.external && <span className="visually-hidden"> (opens in new tab)</span>}
                </a>
              ))}
            </div>

            <p className="mt-4 mb-0 text-sm text-content-secondary">
              {posts.length} owner upload{posts.length === 1 ? '' : 's'} · {menuItems.length} menu item{menuItems.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </section>

      {/* ── Menu ── */}
      <section aria-labelledby="menu-title" className="mt-12">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <h2 id="menu-title" className="section-title">Menu &amp; dishes</h2>
          {hasVeganOptions && <VeganBadge label="Vegan choices available" />}
        </div>
        {menuItems.length > 0 ? (
          <ResponsiveMenu items={menuItems} restaurantName={place?.name} />
        ) : (
          <EmptyState icon={<RestaurantMenuOutlinedIcon />} title="No menu yet" description="The owner hasn't added menu items for this restaurant." />
        )}
      </section>

      {/* ── Uploads ── */}
      <section aria-labelledby="uploads-title" className="mt-12">
        <h2 id="uploads-title" className="section-title mb-5">Latest uploads</h2>
        {posts.length > 0 ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
            {posts?.map((post) => {
              const media = firstPostMedia(post);
              const postId = media?.id;
              const Wrapper = postId ? Link : 'div';
              return (
                <li key={post.id} className="flex">
                  <Wrapper
                    {...(postId ? { to: `/post/${postId}` } : {})}
                    className="group flex flex-col w-full bg-surface border border-subtle rounded-card overflow-hidden no-underline shadow-card hover:shadow-lift transition-shadow"
                  >
                    {media?.url && (
                      <div className="aspect-[4/3] bg-black overflow-hidden">
                        {isVideo(media.url) ? (
                          <video controls className="w-full h-full object-cover" preload="metadata">
                            <source src={mediaUrl(media.url)} />
                          </video>
                        ) : (
                          <img src={mediaUrl(media.url)} alt="" loading="lazy" className="w-full h-full object-cover" onError={handleImageError} />
                        )}
                      </div>
                    )}
                    <div className="p-4 flex flex-col gap-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="m-0 text-base font-bold text-content-primary group-hover:text-brand-accent transition-colors" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>
                          {post?.caption || place?.name}
                        </h3>
                        {post?.has_vegan_items && <VeganBadge />}
                      </div>
                      {post?.address && <p className="m-0 text-sm text-content-secondary">{cleanAddress(post.address)}</p>}
                      {Array.isArray(post?.menu_items) && post.menu_items.length > 0 && (
                        <p className="m-0 text-sm text-content-secondary">
                          {post.menu_items?.slice(0, 3).map((item) => {
                            const price = formatPrice(item?.price);
                            return price ? `${item?.name} (${price})` : item?.name;
                          }).join(' · ')}
                        </p>
                      )}
                    </div>
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<PhotoLibraryOutlinedIcon />} title="No uploads yet" description="This restaurant hasn't shared any photos or videos yet." />
        )}
      </section>
    </div>
  );
}
