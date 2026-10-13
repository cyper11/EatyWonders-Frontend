import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useParams, useNavigate, Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Container, Box, Typography, CircularProgress, IconButton, Button, Avatar, Chip, useMediaQuery } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DirectionsIcon from '@mui/icons-material/Directions';
import ShareIcon from '@mui/icons-material/Share';
import api, { API_BASE_URL, MAPBOX_TOKEN } from '../api/backend';
import VeganBadge from '../components/VeganBadge';
import useDocumentTitle from '../hooks/useDocumentTitle';
import CommentThread from '../components/CommentThread';

// Configure Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

const menuCardSx = {
  p: 1.5,
  borderRadius: 1.5,
  bgcolor: '#ffffff',
  border: '1px solid #d9c9b5',
  boxShadow: '0 4px 12px rgba(82, 52, 24, 0.06)',
};

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
      <Container sx={{ py: 3 }}>
        <Typography variant="h6">Post not found.</Typography>
      </Container>
    );
  }

  const address = data.address;
  // determine which media to display: either gallery item or single upload
  const currentMedia = galleryItems && galleryItems.length > 0 ? galleryItems[galleryIndex] : { url: data.url, id: data.id };
  const authorName = data.username || data.author_name;

  /* ── Shared sub-components ── */
  const PostHeader = () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => navigate(-1)}>
        Back
      </Button>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0 }}>{title}</Typography>
        <IconButton size="small" onClick={handleShare} sx={{ color: 'var(--surface-secondary)' }}>
          <ShareIcon fontSize="small" />
        </IconButton>
      </Box>
      {data.has_vegan_items && <VeganBadge />}
    </Box>
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
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--text-primary, #203224)', '&:hover': authorProfileLink ? { textDecoration: 'underline' } : {} }}>
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
          <IconButton aria-label="previous" onClick={() => setGalleryIndex((i) => (i - 1 + galleryItems.length) % galleryItems.length)}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', px: 1 }}>
            {galleryItems?.map((m, idx) => {
              const thumb = m.url && (m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`);
              return (
                <Box key={m.id || idx} onClick={() => setGalleryIndex(idx)} sx={{ width: 80, height: 60, cursor: 'pointer', border: idx === galleryIndex ? '2px solid #1976d2' : '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                  {/(mp4|webm|ogg)$/i.test(thumb) ? (
                    <video src={thumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={thumb} alt={`thumb-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </Box>
              );
            })}
          </Box>
          <IconButton aria-label="next" onClick={() => setGalleryIndex((i) => (i + 1) % galleryItems.length)}>
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );

  const PostMenuItems = () => (
    Array.isArray(data.menu_items) && data.menu_items.length > 0 ? (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Menu</Typography>
        <Box sx={{ display: 'grid', gap: 1 }}>
          {data?.menu_items?.map((item) => (
            <Box key={item.id || `${item.name}-${item.price}`} sx={menuCardSx}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body1" sx={{ fontWeight: 800, color: '#1f1a17' }}>
                  {item.name}
                </Typography>
                {item.is_vegan ? <VeganBadge label="Vegan Item" /> : null}
                {item.price !== null && (
                  <Typography variant="body2" sx={{ color: '#2f5d33', fontWeight: 700 }}>
                    PHP {Number(item.price).toFixed(2)}
                  </Typography>
                )}
              </Box>
              {item.description && (
                <Typography variant="body2" sx={{ mt: 0.5, color: '#51453b' }}>
                  {item.description}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    ) : null
  );

  const PostMap = () => (
    <MapWrapper center={center} address={address} />
  );

  /* ── RESPONSIVE GRID LAYOUT WITH STICKY POST CONTEXT ── */
  return (
    <>
      {/* Mobile Sticky Header (Slides in when user scrolls past post content) */}
      <div
        className={`fixed top-16 left-0 right-0 z-[1100] px-4 py-2.5 bg-background-primary/95 backdrop-blur-md border-b border-border-subtle flex items-center gap-3 transition-transform duration-300 ease-out shadow-sm md:hidden ${
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
        <IconButton size="small" onClick={handleShare} className="text-content-secondary">
          <ShareIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </div>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <PostHeader />

        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-8 items-start">
          {/* Left Column: Sticky Post Content */}
          <div ref={postContentRef} className="lg:sticky lg:top-20 space-y-5">
            <PostAuthor />
            <PostMedia />
            
            {/* Title & Description */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'var(--text-primary, #203224)' }}>
                {title}
              </Typography>
              {address && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  📍 {address}
                </Typography>
              )}
              {data.caption && (
                <Typography variant="body1" sx={{ color: 'var(--text-primary, #203224)', lineHeight: 1.6 }}>
                  {data.caption}
                </Typography>
              )}
            </Box>

            <PostMenuItems />
            <PostMap />
          </div>

          {/* Right Column: Comments (scrolls independently with internal scrollbar) */}
          <div className="lg:sticky lg:top-20 min-h-[60vh] lg:pl-2">
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                bgcolor: 'var(--surface, #fff)',
                border: '1px solid var(--border-subtle, rgba(18, 44, 26, 0.08))',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, color: 'var(--text-primary, #203224)' }}>
                Comments
              </Typography>
              <CommentThread uploadId={id} postOwnerId={data.user_id} />
            </Box>
          </div>
        </div>
      </Container>
    </>
  );
}
