import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Typography,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import FacebookIcon from '@mui/icons-material/Facebook';
import LocalPhoneOutlinedIcon from '@mui/icons-material/LocalPhoneOutlined';
import RoomIcon from '@mui/icons-material/Room';
import VerifiedIcon from '@mui/icons-material/Verified';
import Header from '../components/Header';
import VeganBadge from '../components/VeganBadge';
import ResponsiveMenu from '../components/ResponsiveMenu';
import api, { API_BASE_URL } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import useDocumentTitle from '../hooks/useDocumentTitle';

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

function contactPills(place) {
  if (!place) return [];
  return [
    place?.phone && { key: 'phone', icon: <LocalPhoneOutlinedIcon fontSize="small" />, label: place.phone },
    place?.facebook_url && { key: 'facebook', icon: <FacebookIcon fontSize="small" />, label: 'Facebook' },
    place?.email && { key: 'email', icon: <EmailOutlinedIcon fontSize="small" />, label: place.email },
  ].filter(Boolean);
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
  const pills = contactPills(place);
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

  if (loading) {
    return (
      <>
        <Header />
        <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (error || !place) {
    return (
      <>
        <Header />
        <Container sx={{ pt: 14, pb: 4 }}>
          <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
            Back
          </Button>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {error || 'Restaurant not found.'}
          </Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <Container sx={{ pt: 14, pb: 5 }}>
        <Button startIcon={<ArrowBackIosNewIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>

        <Box sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'var(--surface-paper)', border: '1px solid var(--surface-border)', boxShadow: '0 18px 50px rgba(0,0,0,0.12)', mb: 4 }}>
          <Box
            component="img"
            src={coverImage}
            alt={place?.name || 'Restaurant cover'}
            sx={{ width: '100%', height: { xs: 192, md: 256 }, objectFit: 'cover', display: 'block' }}
          />
          <Box sx={{ px: { xs: 2, md: 3 }, pb: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr' }, gap: { xs: 1.5, md: 2 }, alignItems: 'end' }}>
              <Box
                component="img"
                src={coverImage}
                alt={`${place?.name || 'Restaurant'} avatar`}
                sx={{
                  width: 112,
                  height: 112,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  mt: -7,
                  ml: { xs: 0.5, md: 1 },
                  border: '4px solid var(--surface-paper)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.16)',
                  bgcolor: 'var(--surface-paper)',
                }}
              />
              <Box sx={{ display: 'grid', gap: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.05, color: 'var(--surface-text)', fontSize: { xs: '2rem', md: '3rem' } }}>
                    {place?.name}
                  </Typography>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: 999, bgcolor: '#eaf7ef', color: '#17603a', border: '1px solid #b7dfc3', fontWeight: 800, fontSize: '0.78rem' }}>
                    <VerifiedIcon sx={{ fontSize: 17 }} />
                    Verified
                  </Box>
                  <Box sx={{ px: 1.25, py: 0.5, borderRadius: 999, bgcolor: rankInfo.bg, color: rankInfo.color, border: `1px solid ${rankInfo.border}`, fontWeight: 800, fontSize: '0.78rem' }}>
                    {rankInfo.rank}
                  </Box>
                  {hasVeganOptions && <VeganBadge />}
                </Box>
                {place?.address && (
                  <Typography variant="body1" sx={{ color: 'var(--surface-secondary)', maxWidth: 820 }}>
                    {place.address}
                  </Typography>
                )}
              </Box>
            </Box>
            {place?.description && (
              <Typography variant="body1" sx={{ mt: 2, color: 'var(--surface-secondary)', maxWidth: 860 }}>
                {place.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              {[...pills, { key: 'posts', label: `${posts.length} owner upload${posts.length === 1 ? '' : 's'}` }, { key: 'menu', label: `${menuItems.length} menu item${menuItems.length === 1 ? '' : 's'}` }].map((pill) => (
                <Typography
                  key={pill.key}
                  component="span"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.75, borderRadius: 999, bgcolor: 'var(--bg-tertiary)', color: 'var(--surface-text)', border: '1px solid var(--surface-border)', fontWeight: 700 }}
                >
                  {pill.icon}
                  {pill.label}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>

        {canShowOnMap && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 4 }}>
            <Button
              variant="contained"
              startIcon={<RoomIcon />}
              onClick={showOnMap}
            >
              Show on Map
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'grid', gap: 5 }}>
          <Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                Menu & Dishes
              </Typography>
              {hasVeganOptions && <VeganBadge label="Vegan Choices Available" />}
            </Box>
            <ResponsiveMenu items={menuItems} restaurantName={place?.name} />
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
              Latest Uploads
            </Typography>
            {posts.length > 0 ? (
              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' } }}>
                {posts?.map((post) => {
                  const media = firstPostMedia(post);
                  const postId = media?.id;
                  return (
                    <Card key={post.id} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                      <CardActionArea onClick={() => postId && navigate(`/post/${postId}`)} disabled={!postId}>
                        {media?.url ? (
                          isVideo(media.url) ? (
                            <Box sx={{ bgcolor: '#000' }}>
                              <video controls style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}>
                                <source src={mediaUrl(media.url)} />
                              </video>
                            </Box>
                          ) : (
                            <CardMedia
                              component="img"
                              height="220"
                              image={mediaUrl(media.url)}
                              alt={post?.caption || place?.name || 'Post'}
                            />
                          )
                        ) : null}
                        <CardContent>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {post?.caption || place?.name}
                            </Typography>
                            {post?.has_vegan_items && <VeganBadge />}
                          </Box>
                          {post?.address && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {post.address}
                            </Typography>
                          )}
                          {Array.isArray(post?.menu_items) && post.menu_items.length > 0 && (
                            <Typography variant="body2" sx={{ color: '#6E5C49' }}>
                              {post.menu_items?.slice(0, 3).map((item) => {
                                const price = formatPrice(item?.price);
                                return price ? `${item?.name} (${price})` : item?.name;
                              }).join(' • ')}
                            </Typography>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Typography color="text.secondary">This restaurant does not have uploaded posts yet.</Typography>
            )}
          </Box>
        </Box>
      </Container>
    </>
  );
}
