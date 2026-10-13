import React, { useEffect, useState, useCallback, useRef } from 'react';
import api, { API_BASE_URL } from '../api/backend';
import { isAdmin } from '../utils/auth';
import { useAuth } from '../context/AuthContext';
import { Box, Card, CardHeader, CardMedia, CardContent, CardActions, Avatar, IconButton, Typography, Button, Rating, Chip, Menu, MenuItem, ListItemIcon, ListItemText, Skeleton, CircularProgress, TextField, Collapse } from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import InstagramIcon from '@mui/icons-material/Instagram';
import PhotoCameraBackIcon from '@mui/icons-material/PhotoCameraBack';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import VeganBadge from '../components/VeganBadge';

/**
 * FeedCreatePost — compact inline post creation widget at top of feed.
 * Tourist role: simple caption + photo upload (Facebook-style).
 * Owner role: caption + photo + address + menu items.
 */
const FeedCreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);

  const isOwnerRole = user?.role === 'owner';
  const avatarSrc = user?.profile_url
    ? (user.profile_url.startsWith('http') ? user.profile_url : `${API_BASE_URL}${user.profile_url}`)
    : undefined;
  const avatarFallback = (user?.name || user?.email || 'U').toString().slice(0, 1).toUpperCase();

  useEffect(() => {
    if (isOwnerRole) {
      api.get('/api/uploads/my-branches')
        .then((res) => {
          const list = Array.isArray(res.data?.branches) ? res.data.branches : [];
          setBranches(list);
          if (list.length >= 1) {
            setSelectedBranchId(String(list[0].id));
          }
        })
        .catch((err) => console.warn('Could not fetch branches in FeedCreatePost:', err));
    }
  }, [isOwnerRole]);

  const onFile = (e) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length) {
      setFiles(selected);
      setExpanded(true);
    }
  };

  const clearForm = () => {
    setCaption('');
    setFiles([]);
    setError('');
    setSuccess('');
    setExpanded(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submit = async () => {
    setError('');
    setSuccess('');
    if (!files.length) {
      setError('Please attach at least one photo or video.');
      return;
    }
    setPosting(true);
    try {
      const form = new FormData();
      for (const f of files) form.append('file', f);
      if (caption.trim()) form.append('caption', caption.trim());
      if (isOwnerRole && selectedBranchId) form.append('branch_id', selectedBranchId);
      // Tourists don't send location or menu items — backend accepts nulls
      await api.post('/api/uploads/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Posted!');
      clearForm();
      if (onPostCreated) onPostCreated();
    } catch (e) {
      setError(e?.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  if (!user) return null;

  return (
    <Card
      elevation={0}
      sx={{
        maxWidth: 720,
        width: '100%',
        mx: 'auto',
        mb: 2,
        borderRadius: 3,
        border: '1px solid var(--bg-tertiary)',
        bgcolor: 'var(--surface)',
        overflow: 'visible',
      }}
    >
      {/* Collapsed: avatar + prompt row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 2,
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(true)}
      >
        <Avatar src={avatarSrc} sx={{ width: 40, height: 40, bgcolor: 'var(--accent)', color: '#fff', fontWeight: 700, border: '2px solid var(--border-brand)' }}>
          {avatarFallback}
        </Avatar>
        <Box
          sx={{
            flex: 1,
            py: 1.25,
            px: 2,
            borderRadius: 99,
            bgcolor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            transition: 'background 150ms',
            '&:hover': { bgcolor: 'var(--bg-secondary)' },
          }}
        >
          {isOwnerRole ? "Share a new menu, promo, or update…" : "What's on your mind?"}
        </Box>
        <input type="file" ref={fileInputRef} accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={onFile} />
        <IconButton
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          sx={{ color: 'var(--accent)' }}
          aria-label="attach photo"
        >
          <PhotoCameraBackIcon />
        </IconButton>
      </Box>

      {/* Expanded: full form */}
      <Collapse in={expanded} timeout={250}>
        <Box sx={{ px: 2, pb: 2, display: 'grid', gap: 1.5 }}>
          {isOwnerRole && branches.length > 1 && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
                Which branch is this post for? <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                required
                className="w-full bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/40 transition-all cursor-pointer font-medium"
              >
                <option value="" disabled>Select branch...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} — {b.address || 'Cavite Branch'}
                  </option>
                ))}
              </select>
            </Box>
          )}

          <TextField
            placeholder={isOwnerRole ? "Describe your dish, promo, or update..." : "Share your food experience..."}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            multiline
            minRows={2}
            maxRows={6}
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'var(--bg-tertiary)',
              },
            }}
          />

          {/* File preview */}
          {files.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {files.map((f, i) => (
                <Chip
                  key={i}
                  label={f.name}
                  size="small"
                  onDelete={() => {
                    const next = files.filter((_, idx) => idx !== i);
                    setFiles(next);
                    if (!next.length && !caption.trim()) setExpanded(false);
                  }}
                  sx={{ maxWidth: 200, bgcolor: 'var(--bg-secondary)' }}
                />
              ))}
            </Box>
          )}

          {isOwnerRole && (
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>
              💡 For full post creation with location pin and menu items, use{' '}
              <Typography
                component="span"
                variant="caption"
                sx={{ color: 'var(--accent)', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => window.location.href = '/owner'}
              >
                My Posts page
              </Typography>.
            </Typography>
          )}

          {/* Actions row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                startIcon={<PhotoCameraBackIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'var(--accent)' }}
              >
                {files.length ? 'Add more' : 'Photo/Video'}
              </Button>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={clearForm}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'var(--text-secondary)' }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={posting || (!files.length && !caption.trim())}
                onClick={submit}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: 99,
                  px: 3,
                  bgcolor: 'var(--accent)',
                  '&:hover': { bgcolor: 'var(--accent)', filter: 'brightness(1.1)' },
                }}
              >
                {posting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Post'}
              </Button>
            </Box>
          </Box>

          {error && <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>{error}</Typography>}
          {success && <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>{success}</Typography>}
        </Box>
      </Collapse>
    </Card>
  );
};

const API_BASE = API_BASE_URL;

const menuCardSx = {
  p: 1.35,
  borderRadius: 1.5,
  bgcolor: 'var(--surface)',
  border: '1px solid var(--bg-tertiary)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
};

const PostCard = ({ post, onDeleted }) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [avg, setAvg] = useState(post.rating_avg || null);
  const [count, setCount] = useState(post.rating_count || 0);
  const navigate = useNavigate();
  const repUploadId = (post.media && post.media[0] && post.media[0].id) ? post.media[0].id : post.id;
  const [shareAnchor, setShareAnchor] = useState(null);
  const isOwner = user?.id === post.user_id;

  const getImageUrl = (url) => {
    if (!url) return '';
    const value = String(url).trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (/^(https?)(\/\/.+)$/i.test(value)) return value.replace(/^(https?)(\/\/.+)$/i, '$1:$2');
    if (value.startsWith('//')) return `https:${value}`;
    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    return `${API_BASE}${normalizedPath}`;
  };


  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        if (!user) return; // not logged in — skip fetching like/rating state
        const repUploadId = (post.media && post.media[0] && post.media[0].id) ? post.media[0].id : post.id;
        const { data } = await api.get(`/api/uploads/${repUploadId}/ratings/me`);
        if (!ignore) setMyRating(data?.rating ?? null);
        try {
          const m = await api.get(`/api/uploads/${repUploadId}/likes/me`);
          if (!ignore) setLiked(!!m.data?.liked);
        } catch { }
      } catch (e) { /* ignore */ }
    })();
    return () => { ignore = true; };
  }, [post.id, post.media, user]);

  const onRate = async (e, value) => {
    try { e?.stopPropagation(); } catch { }
    if (!user) return alert('Please login to rate');
    if (!value) return; // ignore clears
    const repUploadId = (post.media && post.media[0] && post.media[0].id) ? post.media[0].id : post.id;
    const { data } = await api.post(`/api/uploads/${repUploadId}/ratings`, { rating: value });
    setMyRating(value);
    setAvg(data?.average ?? value);
    setCount(data?.count ?? count + (myRating ? 0 : 1));
  };
  const authorName = post.author_name || (post.author_email ? String(post.author_email).split('@')[0] : 'User');
  const authorAvatar = post.author_profile_url ? getImageUrl(post.author_profile_url) : undefined;
  const authorFallback = (authorName || 'U').slice(0, 1).toUpperCase();
  const postTitle = post.restaurant_name || post.caption || 'Food post';
  const postUrl = `${window.location.origin}/post/${repUploadId}`;
  const openShareWindow = (url) => window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
  const closeShare = () => setShareAnchor(null);
  const doNativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Eaty Wonders', text: post.caption || 'Check this out!', url: postUrl });
      } else {
        await navigator.clipboard.writeText(postUrl);
        alert('Link copied to clipboard');
      }
    } catch { }
    closeShare();
  };
  const shareFacebook = () => { openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`); closeShare(); };
  const shareTwitter = () => { openShareWindow(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post.caption || 'Check this out!')}`); closeShare(); };
  const shareWhatsApp = () => { openShareWindow(`https://wa.me/?text=${encodeURIComponent((post.caption || 'Check this out!') + ' ' + postUrl)}`); closeShare(); };
  const shareMessenger = () => {
    const deeplink = `fb-messenger://share?link=${encodeURIComponent(postUrl)}`;
    try { openShareWindow(deeplink); } catch { }
    closeShare();
  };
  const shareInstagram = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      openShareWindow('https://www.instagram.com/');
      alert('Link copied. Paste into Instagram DM/bio.');
    } catch { }
    closeShare();
  };
  const copyLink = async () => { try { await navigator.clipboard.writeText(postUrl); alert('Link copied to clipboard'); } catch { } closeShare(); };

  const authorRole = post.author_role || post.role || post.user?.role;
  const authorId = post.author_id || post.user_id || post.user?.id;
  const isFoodOwner = authorRole === 'food_owner' || authorRole === 'owner';
  const isEndUser = authorRole === 'end_user' || authorRole === 'user';
  const authorProfileLink = isFoodOwner
    ? `/restaurant/${post.owner_place_id || authorId}`
    : isEndUser
      ? `/profile/${authorId}`
      : null;

  return (
    <Card onClick={() => navigate(`/post/${repUploadId}`)} sx={{ maxWidth: 720, width: '100%', margin: '0 auto', borderRadius: 2, boxShadow: 3, position: 'relative', cursor: 'pointer' }}>
      <CardHeader
        avatar={
          <Avatar
            src={authorAvatar}
            sx={{ cursor: authorProfileLink ? 'pointer' : 'default' }}
            onClick={(e) => {
              if (authorProfileLink) {
                e.stopPropagation();
                navigate(authorProfileLink);
              }
            }}
          >
            {authorFallback}
          </Avatar>
        }
        title={
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              cursor: authorProfileLink ? 'pointer' : 'default',
              '&:hover': authorProfileLink ? { textDecoration: 'underline' } : {}
            }}
            onClick={(e) => {
              if (authorProfileLink) {
                e.stopPropagation();
                navigate(authorProfileLink);
              }
            }}
          >
            {authorName}
          </Typography>
        }
        subheader={new Date(post.created_at).toLocaleString()}
      />
      <CardContent sx={{ pb: ((post.caption || post.address || (Array.isArray(post.menu_items) && post.menu_items.length > 0)) ? 1 : 2) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {postTitle}
          </Typography>
          {post.has_vegan_items && <VeganBadge />}
        </Box>
        {post.address && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            {post.address}
          </Typography>
        )}
      </CardContent>
      {((post.media && post.media[0] && post.media[0].url) || post.url) && (
        <CardMedia
          component="img"
          image={getImageUrl((post.media && post.media[0] && post.media[0].url) ? post.media[0].url : post.url)}
          alt={(post.media && post.media[0] && post.media[0].filename) || post.filename}
          sx={{ maxHeight: 600, objectFit: 'cover' }}
        />
      )}
      <Box sx={{ px: 2, pt: 1, display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
        <Rating name={`avg-${post.id}`} value={avg ? Number(avg) : 0} precision={0.5} readOnly />
        <Chip
          size="small"
          label={`${count} rating${count === 1 ? '' : 's'}`}
          sx={{
            bgcolor: '#FFF3CD',
            color: '#5f4b00',
            fontWeight: 700,
            borderRadius: '12px',
            '& .MuiChip-label': { px: 1.25, color: '#5f4b00 !important', fontWeight: 700 }
          }}
        />
      </Box>
      <Box sx={{ px: 2, pt: 1 }} onClick={(e) => e.stopPropagation()}>
        <Typography variant="caption" color="text.secondary">Your rating:</Typography>
        <Rating name={`mine-${post.id}`} value={myRating || 0} onChange={onRate} disabled={(!!myRating && myRating > 0) || isOwner} />
        {!!myRating && <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>(You rated {myRating}/5)</Typography>}
      </Box>
      {post.caption && (
        <CardContent>
          <Typography variant="body1">{post.caption}</Typography>
        </CardContent>
      )}
      {Array.isArray(post.menu_items) && post.menu_items.length > 0 && (
        <CardContent sx={{ pt: post.caption ? 0 : 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Menu
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            {post.menu_items.map((item) => (
              <Box key={item.id || `${item.name}-${item.price}`} sx={menuCardSx}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#1f1a17' }}>
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
        </CardContent>
      )}
      <CardActions disableSpacing>
        <IconButton
          disabled={isOwner}
          onClick={async (e) => {
            e.stopPropagation();
            if (!user) { alert('Please login to like'); return; }
            if (isOwner) return;
            const repId = (post.media && post.media[0] && post.media[0].id) ? post.media[0].id : post.id;
            try { const { data } = await api.post(`/api/uploads/${repId}/likes`); setLiked(!!data?.liked); }
            catch { }
          }}>{liked ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}</IconButton>
        {/* Removed comment icon to declutter actions */}
        <IconButton sx={{ ml: 'auto' }} onClick={(e) => { e.stopPropagation(); setShareAnchor(e.currentTarget); }}><ShareIcon /></IconButton>
        <Menu anchorEl={shareAnchor} open={Boolean(shareAnchor)} onClose={closeShare} onClick={(e) => e.stopPropagation()}>
          <MenuItem onClick={doNativeShare}>
            <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Share...</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareFacebook}>
            <ListItemIcon><FacebookIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Facebook</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareMessenger}>
            <ListItemIcon><SendIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Messenger</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareTwitter}>
            <ListItemIcon><TwitterIcon fontSize="small" /></ListItemIcon>
            <ListItemText>X (Twitter)</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareWhatsApp}>
            <ListItemIcon><WhatsAppIcon fontSize="small" /></ListItemIcon>
            <ListItemText>WhatsApp</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareInstagram}>
            <ListItemIcon><InstagramIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Instagram (copy link)</ListItemText>
          </MenuItem>
          <MenuItem onClick={copyLink}>
            <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Copy Link</ListItemText>
          </MenuItem>
        </Menu>
        {isAdmin() && (
          <Button color="error" size="small" onClick={async (e) => {
            e.stopPropagation();
            if (!window.confirm('Delete this post? This action cannot be undone.')) return;
            try {
              await api.delete(`/api/uploads/posts/${post.id}`);
              onDeleted && onDeleted(post.id);
            } catch (err) {
              try {
                await api.post(`/api/uploads/posts/${post.id}/delete`);
                onDeleted && onDeleted(post.id);
              } catch (e2) {
                alert(e2?.response?.data?.error || 'Delete failed');
              }
            }
          }}>Delete</Button>
        )}
      </CardActions>
      {Array.isArray(post.recent_comments) && post.recent_comments.length > 0 && (
        <Box sx={{ px: 2, pb: 1, display: 'grid', gap: 0.5 }}>
          {post.recent_comments.map((comment) => {
            const name = comment.author_name || (comment.author_email ? comment.author_email.split('@')[0] : 'User');
            return (
              <Box key={comment.id} sx={{ display: 'flex', gap: 0.5, alignItems: 'baseline' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.825rem' }}>
                  {name}:
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.825rem' }}>
                  {comment.text}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography
          variant="caption"
          color="primary"
          sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
          onClick={() => navigate(`/post/${(post.media && post.media[0] && post.media[0].id) ? post.media[0].id : post.id}`)}
        >
          View all {post.comments_count || 0} comments
        </Typography>
      </Box>
    </Card>
  );
};

const FEED_PAGE_SIZE = 10;

const UserFeed = () => {
  const { user } = useAuth();
  const [uploads, setUploads] = useState([]);
  const [application, setApplication] = useState(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const load = useCallback(async (offsetVal = 0, append = false) => {
    try {
      const { data } = await api.get(`/api/uploads/posts?limit=${FEED_PAGE_SIZE}&offset=${offsetVal}`);
      // New paginated shape: { posts, hasMore }
      if (data?.posts && Array.isArray(data.posts)) {
        setUploads(prev => append ? [...prev, ...data.posts] : data.posts);
        setHasMore(data.hasMore ?? false);
        setOffset(offsetVal + data.posts.length);
        return;
      }
      // Old flat-array shape — no pagination available
      if (Array.isArray(data) && data.length) {
        setUploads(append ? prev => [...prev, ...data] : data);
        setHasMore(false);
        return;
      }
    } catch { /* fallback to uploads */ }
    try {
      const { data } = await api.get('/api/uploads');
      setUploads(Array.isArray(data) ? data : []);
      setHasMore(false);
    } catch { setUploads([]); }
  }, []);

  useEffect(() => {
    setFeedLoading(true);
    load(0, false).finally(() => setFeedLoading(false));
  }, [load]);

  // Fetch owner application status (only when user is logged in)
  useEffect(() => {
    if (!user) return;
    let ignore = false;
    (async () => {
      try {
        const { data } = await api.get('/api/owner/application/me');
        if (!ignore) setApplication(data?.application || null);
      } catch {
        if (!ignore) setApplication(null);
      }
    })();
    return () => { ignore = true; };
  }, [user]);

  const loadMore = async () => {
    setLoadingMore(true);
    await load(offset, true);
    setLoadingMore(false);
  };

  const handleDeleted = (id) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  return (
    <>
      <Header />
      <Box sx={{ pt: 12, pb: 3 }}>
        {application?.approval_status === 'pending' && (
          <Box sx={{ maxWidth: 720, mx: 'auto', mb: 2, p: 2, borderRadius: 2, bgcolor: 'var(--bg-tertiary)', border: '1px solid var(--accent)' }}>
            <Typography sx={{ fontWeight: 700 }}>Your food owner application is pending admin approval.</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Restaurant: {application.name}
            </Typography>
          </Box>
        )}
        {application?.approval_status === 'rejected' && (
          <Box sx={{ maxWidth: 720, mx: 'auto', mb: 2, p: 2, borderRadius: 2, bgcolor: '#FDECEC', border: '1px solid #E7A4A4' }}>
            <Typography sx={{ fontWeight: 700 }}>Your latest food owner application was rejected.</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Update your documents and register again if you need to re-apply.
            </Typography>
          </Box>
        )}
        {/* <Typography variant="h4" align="center" sx={{ mb: 2, fontWeight: 700 }}>User Page</Typography> */}
        {/* <Typography align="center" sx={{ mb: 3, color: 'text.secondary' }}>Expectation vs Reality — scroll the feed, like, and comment.</Typography> */}
        <Box sx={{ display: 'grid', gap: 2 }}>
          {/* Inline Create Post */}
          <FeedCreatePost onPostCreated={() => { setFeedLoading(true); load(0, false).finally(() => setFeedLoading(false)); }} />

          {/* Feed loading skeleton */}
          {feedLoading && [...Array(3)].map((_, i) => (
            <Card key={i} sx={{ maxWidth: 720, width: '100%', margin: '0 auto', borderRadius: 2, boxShadow: 3 }}>
              <CardHeader
                avatar={<Skeleton variant="circular" width={40} height={40} />}
                title={<Skeleton width="40%" height={20} />}
                subheader={<Skeleton width="25%" height={16} />}
              />
              <Skeleton variant="rectangular" height={300} />
              <CardContent>
                <Skeleton width="60%" height={24} />
                <Skeleton width="40%" height={18} sx={{ mt: 0.5 }} />
              </CardContent>
            </Card>
          ))}

          {/* Posts */}
          {!feedLoading && uploads?.map(u => (<PostCard key={u.id} post={u} onDeleted={handleDeleted} />))}

          {/* Empty state */}
          {!feedLoading && uploads.length === 0 && (
            <Typography align="center" sx={{ color: 'text.secondary', mt: 4 }}>
              No posts yet. Ask an owner to upload from their page.
            </Typography>
          )}
        </Box>

        {/* Load More button */}
        {hasMore && !feedLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={loadMore}
              disabled={loadingMore}
              startIcon={loadingMore ? <CircularProgress size={16} /> : null}
              sx={{ minWidth: 160, borderRadius: 99 }}
            >
              {loadingMore ? 'Loading…' : 'Load more posts'}
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
};

export default UserFeed;
