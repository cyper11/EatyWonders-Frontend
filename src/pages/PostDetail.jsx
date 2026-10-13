import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate, Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Typography, CircularProgress, IconButton, Button, Avatar, Chip, useMediaQuery } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DirectionsIcon from '@mui/icons-material/Directions';
import ShareIcon from '@mui/icons-material/Share';
import api, { API_BASE_URL, MAPBOX_TOKEN } from '../api/backend';
import VeganBadge from '../components/VeganBadge';
import MenuItemList from '../components/MenuItemList';
import EmptyState from '../components/ui/EmptyState';
import UiButton from '../components/ui/Button';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import useDocumentTitle from '../hooks/useDocumentTitle';
import CommentThread from '../components/CommentThread';
import { cleanAddress } from '../utils/address';

// Configure Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapWrapper = React.memo(({ center, address }) => {
  const [showMap, setShowMap] = useState(false);
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (!center || !showMap || !mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [center.lng, center.lat],
      zoom: 15,
      scrollZoom: false, // Disable zoom for better page scroll experience
      dragPan: false,    // Disable pan for better page scroll experience
      interactive: false // Fully read-only
    });

    new mapboxgl.Marker({ color: '#0f4a2d' })
      .setLngLat([center.lng, center.lat])
      .addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [center, showMap]);

  if (!center) return null;

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Button
        variant="outlined"
        onClick={() => setShowMap(!showMap)}
        sx={{
          mb: 2,
          borderRadius: 999,
          borderColor: 'var(--brand-accent)',
          color: 'var(--brand-accent)',
          textTransform: 'none',
          '&:hover': {
            borderColor: 'var(--accent)',
            bgcolor: 'rgba(121, 187, 43, 0.08)',
          }
        }}
      >
        {showMap ? 'Hide Map' : 'Show on Map 📍'}
      </Button>

      {showMap && (
        <Box sx={{ animation: 'fadeIn 0.3s ease-out' }}>
          <Box
            ref={mapContainer}
            sx={{ height: 300, borderRadius: 1, overflow: 'hidden', border: '1px solid #ddd' }}
          />
          {/* Directions button opens Google Maps directions to the post coordinates */}
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-start' }}>
            <Button
              variant="outlined"
              startIcon={<DirectionsIcon />}
              component="a"
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${center.lat},${center.lng}`)}&travelmode=driving`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get directions
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
});

const Media = ({ url, alt }) => {
  if (!url) return null;
  const full = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  if (/\.(mp4|webm|ogg)$/i.test(full)) {
    return <video src={full} controls className="w-full rounded-2xl aspect-video object-cover" />;
  }
  return <img src={full} alt={alt} className="w-full rounded-2xl aspect-video object-cover" />;
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [galleryItems, setGalleryItems] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [center, setCenter] = useState(null);

  // Mobile sticky header tracking
  const postContentRef = useRef(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const title = data?.restaurant_name || data?.caption || 'Owner Upload';
  useDocumentTitle(title);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  useEffect(() => {
    (async () => {
      try {
        let uploadData = null;
        try {
          const { data } = await api.get(`/api/uploads/${id}`);
          uploadData = data;
        } catch (err) {
          // If direct upload fetch fails, it might be a Post ID
          console.log(`Upload fetch failed for ${id}, checking if it is a Post ID...`);
        }

        // Fallback: If no upload found, or if we suspect this ID might be a Post ID,
        // try to find a post with this ID and use its first media item.
        if (!uploadData || String(uploadData.id) !== String(id)) {
          try {
            const resp = await api.get('/api/uploads/posts');
            const posts = resp.data || [];
            // Try to find by post.id
            const post = posts.find(p => String(p.id) === String(id));
            if (post && Array.isArray(post.media) && post.media.length > 0) {
              // Redirect/Set data to the first media item of this post
              uploadData = { ...post.media[0], post_id: post.id, restaurant_name: post.restaurant_name, address: post.address, menu_items: post.menu_items };
            }
          } catch (postErr) {
            console.error('Post fallback fetch failed', postErr);
          }
        }

        if (uploadData) {
          setData(uploadData);

          // If this upload belongs to a post, fetch the full post gallery
          if (uploadData.post_id) {
            try {
              const resp = await api.get('/api/uploads/posts');
              const posts = resp.data || [];
              const post = posts.find(p => p.id === uploadData.post_id);
              if (post && Array.isArray(post.media)) {
                setGalleryItems(post.media);
                const idx = post.media.findIndex(m => m.id === uploadData.id);
                setGalleryIndex(idx >= 0 ? idx : 0);
              }
            } catch (err) {
              // ignore post fetch errors
            }
          }

          // Geo focus
          if (uploadData.lat || uploadData.lng) {
            const lat = Number(uploadData.lat);
            const lng = Number(uploadData.lng);
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
              setCenter({ lat, lng });
            }
          }
        } else {
          setData(null);
        }
      } catch (e) {
        console.error('Fatal error in PostDetail loading', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);



  // Mobile: track when post content scrolls out of view -> show sticky header
  useEffect(() => {
    if (isDesktop) return; // only for mobile
    const el = postContentRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isDesktop, data]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <div className="py-10">
        <EmptyState
          title="Post not found"
          description="It may have been deleted, or the link is incorrect."
          action={<UiButton onClick={() => navigate('/')}>Go to home</UiButton>}
        />
      </div>
    );
  }

  const address = data.address;
  // determine which media to display: either gallery item or single upload
  const currentMedia = galleryItems && galleryItems.length > 0 ? galleryItems[galleryIndex] : { url: data.url, id: data.id };
  const authorName = data.username || data.author_name;

  /* ── Shared sub-components ── */
  const PostHeader = () => (
    <div className="flex items-center justify-between gap-3 mb-4">
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
        className="inline-flex items-center gap-1.5 min-h-[44px] -ml-2 px-2 rounded-full font-semibold text-content-secondary hover:text-content-primary transition-colors"
      >
        <ArrowBackIosNewIcon sx={{ fontSize: 15 }} aria-hidden="true" />
        Back
      </button>
      <UiButton variant="secondary" size="sm" onClick={handleShare}>
        <ShareIcon sx={{ fontSize: 18 }} aria-hidden="true" />
        Share
      </UiButton>
    </div>
  );

  const authorRole = data.author_role || data.role || data.user?.role;
  const authorId = data.author_id || data.user_id || data.user?.id;
  const isFoodOwner = authorRole === 'food_owner' || authorRole === 'owner';
  const isEndUser = authorRole === 'end_user' || authorRole === 'user';
  const authorProfileLink = isFoodOwner
    ? `/restaurant/${data.owner_place_id || authorId}`
    : isEndUser
      ? `/profile/${authorId}`
      : null;

  const PostAuthor = () => {
    if (!authorName) return null;
    const avatarElem = (
      <Avatar
        src={data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `${API_BASE_URL}${data.avatar}`) : undefined}
        sx={{ width: 40, height: 40 }}
      >
        {(authorName || 'U')[0].toUpperCase()}
      </Avatar>
    );
    const nameElem = (
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', '&:hover': authorProfileLink ? { textDecoration: 'underline' } : {} }}>
        {authorName}
      </Typography>
    );

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        {authorProfileLink ? (
          <Link to={authorProfileLink} style={{ textDecoration: 'none', color: 'inherit' }}>
            {avatarElem}
          </Link>
        ) : (
          avatarElem
        )}
        <Box>
          {authorProfileLink ? (
            <Link to={authorProfileLink} style={{ textDecoration: 'none', color: 'inherit' }}>
              {nameElem}
            </Link>
          ) : (
            nameElem
          )}
          {data.role && (
            <Chip
              label={data.role}
              size="small"
              sx={{
                height: 18,
                fontSize: '0.675rem',
                bgcolor: data.role === 'admin' ? '#FDECEC' : (data.role === 'owner' || data.role === 'food_owner') ? '#EBF9EB' : '#EAEAEA',
                color: data.role === 'admin' ? '#C53030' : (data.role === 'owner' || data.role === 'food_owner') ? '#1C7430' : '#4A4A4A',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            />
          )}
        </Box>
      </Box>
    );
  };

  const PostMedia = () => (
    <Box sx={{ position: 'relative' }}>
      <Media url={currentMedia.url} alt={title} />
      {galleryItems && galleryItems.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1, alignItems: 'center' }}>
          <IconButton aria-label="Previous media" onClick={() => setGalleryIndex((i) => (i - 1 + galleryItems.length) % galleryItems.length)}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', px: 1 }}>
            {galleryItems?.map((m, idx) => {
              const thumb = m.url && (m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`);
              return (
                <Box component="button" type="button" key={m.id || idx} onClick={() => setGalleryIndex(idx)} aria-label={`Show media ${idx + 1} of ${galleryItems.length}`} aria-current={idx === galleryIndex ? 'true' : undefined} sx={{ p: 0, flexShrink: 0, width: 80, height: 60, cursor: 'pointer', border: idx === galleryIndex ? '2px solid var(--accent)' : '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden', bgcolor: 'var(--bg-secondary)' }}>
                  {/(mp4|webm|ogg)$/i.test(thumb) ? (
                    <video src={thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </Box>
              );
            })}
          </Box>
          <IconButton aria-label="Next media" onClick={() => setGalleryIndex((i) => (i + 1) % galleryItems.length)}>
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  const PostMenuItems = () => <MenuItemList items={data.menu_items} title="Menu" titleAs="h2" className="mt-6" />;

  const PostMap = () => (
    <MapWrapper center={center} address={address} />
  );

  /* ── RESPONSIVE GRID LAYOUT WITH STICKY POST CONTEXT ── */
  return (
    <>
      {/* Mobile Sticky Header (Slides in when user scrolls past post content) */}
      <div
        className={`fixed top-[var(--header-h)] left-0 right-0 z-[1000] px-4 py-2.5 bg-background-primary/95 backdrop-blur-md border-b border-border-subtle flex items-center gap-3 transition-transform duration-300 ease-out shadow-sm md:hidden ${
          showStickyHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {authorName && (
          authorProfileLink ? (
            <Link to={authorProfileLink} style={{ textDecoration: 'none' }}>
              <Avatar
                src={data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `${API_BASE_URL}${data.avatar}`) : undefined}
                sx={{ width: 28, height: 28, fontSize: 12 }}
              >
                {(authorName || 'U')[0].toUpperCase()}
              </Avatar>
            </Link>
          ) : (
            <Avatar
              src={data.avatar ? (data.avatar.startsWith('http') ? data.avatar : `${API_BASE_URL}${data.avatar}`) : undefined}
              sx={{ width: 28, height: 28, fontSize: 12 }}
            >
              {(authorName || 'U')[0].toUpperCase()}
            </Avatar>
          )
        )}
        <div className="min-w-0 flex-1">
          {authorProfileLink ? (
            <Link to={authorProfileLink} style={{ textDecoration: 'none' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }} className="truncate text-content-primary leading-tight hover:underline">
                {authorName || 'User'}
              </Typography>
            </Link>
          ) : (
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }} className="truncate text-content-primary leading-tight">
              {authorName || 'User'}
            </Typography>
          )}
          <Typography variant="caption" className="truncate text-content-secondary block leading-tight">
            {title}
          </Typography>
        </div>
        <IconButton size="small" onClick={handleShare} className="text-content-secondary" aria-label="Share post">
          <ShareIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </div>

      <div className="pt-4 pb-12">
        <PostHeader />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-8 items-start">
          {/* Left column: post content */}
          <div ref={postContentRef} className="space-y-5 min-w-0">
            <PostAuthor />
            <PostMedia />
            
            {/* Title & Description */}
            <Box sx={{ mt: 2 }}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="m-0 font-display text-3xl sm:text-4xl font-semibold leading-tight text-content-primary">{title}</h1>
                {data.has_vegan_items && <VeganBadge />}
              </div>
              {address && (
                <p className="m-0 mb-3 flex items-start gap-1 text-sm text-content-secondary">
                  <RoomOutlinedIcon sx={{ fontSize: 18 }} aria-hidden="true" />
                  {cleanAddress(address)}
                </p>
              )}
              {data.caption && (
                <p className="m-0 text-content-primary leading-relaxed whitespace-pre-line">{data.caption}</p>
              )}
            </Box>

            <PostMenuItems />
            <PostMap />
          </div>

          {/* Right Column: Comments (scrolls independently with internal scrollbar) */}
          <aside aria-labelledby="comments-title" className="lg:sticky lg:top-[calc(var(--header-h)+16px)] min-w-0">
            <div className="p-5 rounded-panel bg-surface border border-subtle shadow-card">
              <h2 id="comments-title" className="m-0 mb-4 text-lg font-bold text-content-primary" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>
                Comments
              </h2>
              <CommentThread uploadId={id} postOwnerId={data.user_id} />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
