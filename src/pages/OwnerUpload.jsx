import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMediaQuery, Box, Card, CardHeader, Avatar, TextField, Button, IconButton, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE_URL, MAPBOX_TOKEN } from '../api/backend';
import { geocodeAddress, reverseGeocode } from '../utils/geocode';
import MediaPicker from '../components/MediaPicker';
import MenuItemList from '../components/MenuItemList';
import VeganBadge from '../components/VeganBadge';
import CommentThread from '../components/CommentThread';
import { getUser } from '../utils/auth';
import { autoDetectTags } from '../utils/autoDetectTags';
import { cleanAddress } from '../utils/address';

// Initialize Mapbox
mapboxgl.accessToken = MAPBOX_TOKEN;

// Cavite Province bounds and center (approximate)
const CAVITE_BOUNDS = {
  north: 14.5,
  south: 13.8,
  west: 120.5,
  east: 121.1,
};

function createEmptyMenuItem() {
  return { name: '', description: '', price: '', isVegan: false, dietaryTags: [] };
}

function toEditableMenuItems(items) {
  if (!Array.isArray(items) || !items.length) return [createEmptyMenuItem()];
  return items.map((item) => ({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price ?? '',
    isVegan: Boolean(item?.is_vegan || item?.isVegan),
    dietaryTags: Array.isArray(item?.dietary_tags) ? item.dietary_tags : (item?.is_vegan ? ['Vegan'] : []),
  }));
}

function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      name: String(item?.name || '').trim(),
      description: String(item?.description || '').trim(),
      price: item?.price,
      isVegan: item?.dietaryTags?.includes('Vegan') || Boolean(item?.isVegan),
      dietaryTags: Array.isArray(item?.dietaryTags) ? item.dietaryTags : [],
    }))
    .filter((item) => item.name)
    .map((item) => ({
      ...item,
      description: item.description || '',
    }));
}

const DIETARY_TAGS = ['Halal', 'Vegan', 'Vegetarian', 'Allergen Warning', 'Keto', 'Gluten-Free'];

const MenuItemsEditor = ({ menuItems, setMenuItems, helperText, sourceText = '' }) => {
  useEffect(() => {
    setMenuItems((current) => {
      let changed = false;
      const next = current.map((item) => {
        const detectedTags = autoDetectTags(`${sourceText} ${item.name || ''} ${item.description || ''}`);
        const currentTags = Array.isArray(item.dietaryTags) ? item.dietaryTags : [];
        const dismissedTags = Array.isArray(item.dismissedAutoTags) ? item.dismissedAutoTags : [];
        const tagsToAdd = detectedTags.filter((tag) => !currentTags.includes(tag) && !dismissedTags.includes(tag));
        if (!tagsToAdd.length) return item;
        changed = true;
        const dietaryTags = [...currentTags, ...tagsToAdd];
        return {
          ...item,
          dietaryTags,
          isVegan: dietaryTags.includes('Vegan') ? 1 : 0,
        };
      });
      return changed ? next : current;
    });
  }, [menuItems, setMenuItems, sourceText]);

  const updateMenuItem = (index, patch) => {
    setMenuItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  const addMenuItem = () => setMenuItems((current) => [...current, createEmptyMenuItem()]);
  const removeMenuItem = (index) => setMenuItems((current) => current.filter((_, itemIndex) => itemIndex !== index));

  return (
    <Box sx={{ border: '1px solid var(--border-subtle)', borderRadius: 2, p: 2, bgcolor: 'var(--bg-secondary)' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.75 }}>
        Menu Items
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {helperText || 'Add the food items shown in this upload so users can see the menu and prices.'}
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {menuItems.map((item, index) => (
          <Box key={index} sx={{ border: '1px solid var(--border-subtle)', borderRadius: 2, p: 1.5, bgcolor: 'var(--surface)' }}>
            <Box sx={{ display: 'grid', gap: 1.25 }}>
              <TextField
                label="Menu item"
                value={item.name}
                onChange={(event) => updateMenuItem(index, { name: event.target.value })}
                fullWidth
              />
              <TextField
                label="Description"
                value={item.description}
                onChange={(event) => updateMenuItem(index, { description: event.target.value })}
                fullWidth
                multiline
                minRows={2}
              />
              <TextField
                label="Price"
                value={item.price}
                onChange={(event) => updateMenuItem(index, { price: event.target.value })}
                placeholder="150"
                fullWidth
              />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>
                  Dietary Tags
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {DIETARY_TAGS.map((tag) => (
                    <Box key={tag} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={Array.isArray(item.dietaryTags) && item.dietaryTags.includes(tag)}
                            onChange={(event) => {
                              const currentTags = Array.isArray(item.dietaryTags) ? item.dietaryTags : [];
                              const dismissedAutoTags = Array.isArray(item.dismissedAutoTags) ? item.dismissedAutoTags : [];
                              const newTags = event.target.checked
                                ? [...currentTags, tag]
                                : currentTags.filter(t => t !== tag);
                              updateMenuItem(index, {
                                dietaryTags: newTags,
                                dismissedAutoTags: event.target.checked
                                  ? dismissedAutoTags.filter((dismissedTag) => dismissedTag !== tag)
                                  : [...dismissedAutoTags, tag],
                                isVegan: newTags.includes('Vegan') ? 1 : 0,
                              });
                            }}
                          />
                        }
                        label={tag}
                      />
                      {tag === 'Halal' && (
                        <Button
                          size="small"
                          variant="text"
                          sx={{
                            p: 0,
                            minWidth: 'auto',
                            fontSize: '0.65rem',
                            textTransform: 'none',
                            color: 'var(--accent)',
                            '&:hover': { background: 'transparent', textDecoration: 'underline' }
                          }}
                          onClick={() => alert('Halal Activation: Please email certification docs to halal@eatywonders.com to activate this tag.')}
                        >
                          Apply for Activation
                        </Button>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            {menuItems.length > 1 && (
              <Button type="button" variant="outlined" color="inherit" sx={{ mt: 1.25 }} onClick={() => removeMenuItem(index)}>
                Remove item
              </Button>
            )}
          </Box>
        ))}
      </Box>
      <Button type="button" variant="outlined" sx={{ mt: 1.5 }} onClick={addMenuItem}>
        Add menu item
      </Button>
    </Box>
  );
};

const MenuItemsPreview = ({ menuItems = [] }) => {
  if (!Array.isArray(menuItems) || !menuItems.length) return null;
  return <MenuItemList items={menuItems} title="Menu in this post" className="px-4 sm:px-5 pt-4" />;
};

const OwnerUpload = () => {
  const navigate = useNavigate();
  const user = getUser();
  const avatarSrc = user?.profile_url ? (user.profile_url.startsWith('http') ? user.profile_url : `${API_BASE_URL}${user.profile_url}`) : undefined;
  const avatarFallback = (user?.name || user?.email || 'U').toString().slice(0, 1).toUpperCase();
  const [files, setFiles] = useState([]);
  const [caption, setCaption] = useState('');
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [menuItems, setMenuItems] = useState([createEmptyMenuItem()]);
  const [showMenuInput, setShowMenuInput] = useState(false);
  const [posting, setPosting] = useState(false);
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [myPosts, setMyPosts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null); // post to delete
  const [deletingId, setDeletingId] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [editPost, setEditPost] = useState(null); // post being edited
  const [editCaption, setEditCaption] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editMenuItems, setEditMenuItems] = useState([createEmptyMenuItem()]);
  const [editCoords, setEditCoords] = useState(null);
  const [editNewFiles, setEditNewFiles] = useState([]);
  const isPhone = useMediaQuery('(max-width:599px)');
  const [removingMediaId, setRemovingMediaId] = useState(null);
  const editMapContainer = useRef(null);
  const editMap = useRef(null);
  const editMarker = useRef(null);
  const inCavite = React.useCallback((lat, lng) => (
    lat >= CAVITE_BOUNDS.south &&
    lat <= CAVITE_BOUNDS.north &&
    lng >= CAVITE_BOUNDS.west &&
    lng <= CAVITE_BOUNDS.east
  ), []);

  // Initialize Edit Map
  useEffect(() => {
    if (!editMapContainer.current || editMap.current || !editPost) return;

    const saved = { lat: Number(editPost.lat), lng: Number(editPost.lng) };
    const hasSaved = editPost.lat != null && editPost.lng != null && Number.isFinite(saved.lat) && Number.isFinite(saved.lng);
    const initialCoords = editCoords || (hasSaved ? saved : { lat: 14.2833, lng: 120.9333 });

    editMap.current = new mapboxgl.Map({
      container: editMapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialCoords.lng, initialCoords.lat],
      zoom: editCoords || hasSaved ? 14 : 10.5
    });

    editMap.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      if (!inCavite(lat, lng)) {
        setErr('Location must be within Cavite.');
        return;
      }
      setEditCoords({ lat, lng });
    });

    return () => {
      if (editMap.current) {
        editMap.current.remove();
        editMap.current = null;
      }
    };
  }, [editPost, inCavite, editCoords]);

  // Update Edit Marker
  useEffect(() => {
    if (!editMap.current) return;
    const coords = editCoords;
    if (coords) {
      if (!editMarker.current) {
        editMarker.current = new mapboxgl.Marker({ color: '#165534' })
          .setLngLat([coords.lng, coords.lat])
          .addTo(editMap.current);
      } else {
        editMarker.current.setLngLat([coords.lng, coords.lat]);
      }
      editMap.current.flyTo({ center: [coords.lng, coords.lat] });
    }
  }, [editCoords]);

  const loadMine = React.useCallback(async () => {
    try {
      const { data } = await api.get('/api/uploads/posts/mine');
      setMyPosts(data || []);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        setErr('Please log in');
        navigate('/login');
        return;
      }
      console.warn('Failed to load your posts:', e?.message || e);
    }
  }, [navigate]);

  const loadBranches = React.useCallback(async () => {
    try {
      const { data } = await api.get('/api/uploads/my-branches');
      const list = Array.isArray(data?.branches) ? data.branches : [];
      setBranches(list);
      if (list.length >= 1) {
        setSelectedBranchId(String(list[0].id));
      }
    } catch (e) {
      console.warn('Failed to load branches:', e?.message || e);
    }
  }, []);

  useEffect(() => {
    loadMine();
    loadBranches();
  }, [loadMine, loadBranches]);

  const resolveAddressWithinCavite = React.useCallback(async (rawAddress) => {
    const trimmed = String(rawAddress || '').trim();
    if (!trimmed) return null;

    const attempts = [
      trimmed,
      /cavite/i.test(trimmed) ? null : `${trimmed}, Cavite, Philippines`,
    ].filter(Boolean);

    for (const candidate of attempts) {
      try {
        const geo = await geocodeAddress(candidate);
        if (geo?.lat !== null && geo?.lng !== null && inCavite(Number(geo.lat), Number(geo.lng))) {
          return { lat: Number(geo.lat), lng: Number(geo.lng), formattedAddress: geo.formattedAddress || candidate };
        }
      } catch {
        // Try the next candidate form.
      }
    }

    return null;
  }, [inCavite]);


  const requestDelete = (post) => setConfirmDelete(post);

  const requestEdit = (post) => {
    setEditPost(post);
    setEditCaption(post.caption || '');
    setEditAddress(post.address || '');
    setEditMenuItems(toEditableMenuItems(post.menu_items));
    if (post.lat !== null && post.lng !== null) {
      const next = { lat: Number(post.lat), lng: Number(post.lng) };
      setEditCoords(next);
    } else {
      setEditCoords(null);
    }
    setEditNewFiles([]);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const p = confirmDelete;
    setDeletingId(p.id);
    setErr('');
    try {
      // delete post
      await api.delete(`/api/uploads/posts/${p.id}`);
      setMyPosts(prev => prev.filter(x => x.id !== p.id));
      setConfirmDelete(null);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        setErr('Please log in');
        navigate('/login');
        return;
      }
      if (status === 404) {
        // try fallback post delete
        try { await api.post(`/api/uploads/posts/${p.id}/delete`); } catch { }
        await loadMine();
        setConfirmDelete(null);
      } else {
        setErr(e?.response?.data?.error || 'Delete failed');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editPost) return;
    try {
      setPosting(true); setErr('');
      let lat = editCoords?.lat ?? editPost.lat; let lng = editCoords?.lng ?? editPost.lng;
      let finalEditAddress = editAddress;
      if (editCoords) {
        try {
          const addr = await reverseGeocode(editCoords.lat, editCoords.lng);
          if (addr) {
            finalEditAddress = addr;
            setEditAddress(addr);
          }
        } catch { }
      }
      // If the user placed a map pin, trust that exact pin. Otherwise geocode changed text.
      if (!editCoords && (editAddress || '') !== (editPost.address || '')) {
        const geo = await resolveAddressWithinCavite(editAddress);
        if (!geo) {
          setErr('Please enter a valid Cavite address before saving.');
          setPosting(false);
          return;
        }
        lat = Number(geo.lat);
        lng = Number(geo.lng);
        if (geo.formattedAddress) {
          finalEditAddress = geo.formattedAddress;
          setEditAddress(geo.formattedAddress);
        }
      }
      const payload = {
        caption: editCaption,
        address: finalEditAddress,
        menuItems: normalizeMenuItems(editMenuItems),
      };
      if (lat !== null && lng !== null) { payload.lat = lat; payload.lng = lng; }
      const { data } = await api.patch(`/api/uploads/posts/${editPost.id}`, payload);
      let updated = data?.post || null;
      // Upload newly added files one by one, in the order the owner arranged them
      for (const file of editNewFiles) {
        const fd = new FormData();
        fd.append('file', file);
        const addRes = await api.post(`/api/uploads/posts/${editPost.id}/media`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (addRes?.data?.post) updated = addRes.data.post;
      }
      if (updated) setMyPosts(prev => prev.map(p => p.id === editPost.id ? { ...p, ...updated } : p));
      setEditPost(null);
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) { setErr('Please log in'); navigate('/login'); return; }
      setErr(e?.response?.data?.error || 'Update failed');
    } finally { setPosting(false); }
  };

  const removeMedia = async (media) => {
    if (!editPost || !media?.id) return;
    if (!window.confirm('Remove this photo/video from the post?')) return;
    try {
      setRemovingMediaId(media.id);
      try {
        await api.delete(`/api/uploads/${media.id}`);
      } catch (e) {
        if (e?.response?.status === 404) { try { await api.post(`/api/uploads/${media.id}/delete`); } catch { } }
        else throw e;
      }
      // Update local editPost + myPosts media list
      setEditPost(prev => prev ? { ...prev, media: (prev.media || []).filter(m => m.id !== media.id) } : prev);
      setMyPosts(prev => prev.map(p => p.id === editPost.id ? { ...p, media: (p.media || []).filter(m => m.id !== media.id) } : p));
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to remove media');
    } finally { setRemovingMediaId(null); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setOk(''); setPosting(true);
    try {
      if (!files || files.length === 0) {
        setErr('Please attach at least one photo/video');
        setPosting(false);
        return;
      }
      const cleanMenuItems = normalizeMenuItems(menuItems);
      const form = new FormData();
      for (const f of files) form.append('file', f);
      if (caption) form.append('caption', caption);
      if (selectedBranchId) form.append('branch_id', selectedBranchId);
      if (showMenuInput && cleanMenuItems.length) form.append('menuItems', JSON.stringify(cleanMenuItems));
      // create a grouped post
      await api.post('/api/uploads/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setOk('Uploaded');
      setCaption('');
      setFiles([]);
      setMenuItems([createEmptyMenuItem()]);
      setShowMenuInput(false);
      loadMine();
    } catch (e) {
      const status = e?.response?.status;
      if (status === 401) {
        setErr('Please log in');
        navigate('/login');
        return;
      }
      setErr(e?.response?.data?.error || 'Upload failed');
    } finally { setPosting(false); }
  };

  return (
    <>
      <Box sx={{ pt: { xs: 3, md: 5 }, pb: 4, display: 'grid', gap: 3 }}>
        <Card sx={{ maxWidth: 720, width: '100%', mx: 'auto', border: '1px solid var(--border-subtle)', boxShadow: 'var(--shadow-sm)' }}>
          <CardHeader
            avatar={<Avatar src={avatarSrc} sx={{ bgcolor: 'var(--accent)', color: 'var(--on-accent)' }}>{avatarFallback}</Avatar>}
            title={<h1 className="m-0 font-display text-2xl font-semibold text-content-primary">Create a post</h1>}
            subheader="Share a dish, a menu update, or what's new at your place."
            sx={{ pb: 0 }}
          />
          <Box key="owner-upload-form" component="form" onSubmit={submit} style={{ padding: 16, display: 'grid', gap: 12 }}>
            {branches.length > 1 && (
              <div className="p-3.5 rounded-xl border border-border-subtle bg-surface shadow-xs">
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5">
                  Which branch is this post for? <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  required
                  className="w-full bg-background-primary border border-border-subtle rounded-xl px-3.5 py-2.5 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/40 transition-all cursor-pointer font-medium"
                >
                  <option value="" disabled>Select branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.address || 'Cavite Branch'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <TextField
              label="Caption"
              placeholder="What's on the menu today?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />

            {/* Photos/videos: reorderable, first file is the cover */}
            <MediaPicker id="owner-upload-file" files={files} setFiles={setFiles} disabled={posting} />

            {!showMenuInput ? (
              <Button
                type="button"
                variant="outlined"
                onClick={() => setShowMenuInput(true)}
                sx={{
                  justifySelf: 'start',
                  borderRadius: 999,
                  px: 2,
                  fontWeight: 700,
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                + Add a Menu Item to this Post
              </Button>
            ) : (
              <MenuItemsEditor
                menuItems={menuItems}
                setMenuItems={setMenuItems}
                sourceText={caption}
                helperText="Add menu names and prices. Smart tags highlight automatically as you type, and you can uncheck any false positive."
              />
            )}

            {ok && <div className="alert-success" role="status"><span className="font-semibold">Posted! Your upload is live.</span></div>}
            {err && <div className="alert-error" role="alert"><span className="font-semibold">{err}</span></div>}
            <Button type="submit" variant="contained" size="large" disabled={posting} sx={{ justifySelf: { xs: 'stretch', sm: 'end' }, minWidth: 160 }}>
              {posting ? <><CircularProgress size={18} sx={{ color: 'inherit', mr: 1 }} /> Posting…</> : 'Post'}
            </Button>
          </Box>
        </Card>

        <Box sx={{ maxWidth: 720, width: '100%', mx: 'auto' }}>
          <h2 className="section-title mb-4">Your recent posts</h2>
          {myPosts?.map(p => (
            <article key={p.id} className="mb-6 bg-surface border border-subtle rounded-panel shadow-card overflow-hidden">
              {/* Title row with actions */}
              <header className="flex items-start justify-between gap-3 px-4 sm:px-5 pt-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0 text-lg font-bold text-content-primary" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>
                      {p.restaurant_name || 'Your food post'}
                    </h3>
                    {p.has_vegan_items && <VeganBadge />}
                  </div>
                  <p className="m-0 mt-0.5 text-sm text-content-muted">
                    <time dateTime={p.created_at}>{new Date(p.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</time>
                    {p.address ? <> · {cleanAddress(p.address)}</> : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="small" onClick={() => requestEdit(p)} sx={{ minHeight: 36 }}>Edit</Button>
                  <Button size="small" color="error" onClick={() => requestDelete(p)} sx={{ minHeight: 36 }}>Delete</Button>
                </div>
              </header>

              {p.caption && <p className="m-0 px-4 sm:px-5 pt-3 text-content-primary leading-relaxed whitespace-pre-line">{p.caption}</p>}

              {/* Cover media (opens gallery) */}
              {Array.isArray(p.media) && p.media.length > 0 && (
                <div className="px-4 sm:px-5 pt-4">
                  <button
                    type="button"
                    className="relative block w-full rounded-card overflow-hidden bg-black/90 cursor-zoom-in"
                    onClick={() => { setGalleryItems(p.media); setGalleryIndex(0); setGalleryOpen(true); }}
                    aria-label={`Open media for ${p.restaurant_name || 'this post'}`}
                  >
                    {p.media[0].url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video controls className="w-full max-h-[520px] object-contain block">
                        <source src={p.media[0].url.startsWith('http') ? p.media[0].url : `${API_BASE_URL}${p.media[0].url}`} />
                      </video>
                    ) : (
                      <img
                        alt={p.caption || p.restaurant_name || 'Post photo'}
                        src={p.media[0].url.startsWith('http') ? p.media[0].url : `${API_BASE_URL}${p.media[0].url}`}
                        className="w-full max-h-[520px] object-contain block mx-auto"
                        loading="lazy"
                      />
                    )}
                  </button>
                </div>
              )}

              <MenuItemsPreview menuItems={p.menu_items} />

              {Array.isArray(p.media) && p.media.length > 0 && (
                <section className="px-4 sm:px-5 pt-5 pb-4 mt-4 border-t border-subtle">
                  <h4 className="m-0 mb-2 text-sm font-bold text-content-primary" style={{ fontFamily: 'var(--font-body)', letterSpacing: 0 }}>Comments</h4>
                  <CommentThread uploadId={p.media[0].id} postOwnerId={user.id} />
                </section>
              )}
              {!(Array.isArray(p.media) && p.media.length > 0) && <div className="pb-4" />}
            </article>
          ))}
          {myPosts.length === 0 && (
            <div className="text-center py-12 px-6 rounded-panel border border-dashed border-strong text-content-secondary">
              No posts yet. Your first post will show up here.
            </div>
          )}
        </Box>

        {/* Delete confirmation dialog */}
        <Dialog open={!!confirmDelete} onClose={() => (deletingId ? null : setConfirmDelete(null))}>
          <DialogTitle>Delete post?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete the selected media and its comments. This action cannot be undone.
            </DialogContentText>
            {confirmDelete?.caption && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {confirmDelete.caption}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)} disabled={!!deletingId}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={!!deletingId}>
              {deletingId ? (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={18} /> Deleting...
                </Box>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Gallery dialog to view post media */}
        <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="lg" fullWidth>
          <DialogContent sx={{ bgcolor: 'black', p: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {galleryItems[galleryIndex] && (
              galleryItems[galleryIndex].url.match(/\.(mp4|webm|ogg)$/i) ? (
                <video controls style={{ width: '100%', maxHeight: '80vh', background: '#000' }}>
                  <source src={galleryItems[galleryIndex].url.startsWith('http') ? galleryItems[galleryIndex].url : `${API_BASE_URL}${galleryItems[galleryIndex].url}`} />
                </video>
              ) : (
                <img src={galleryItems[galleryIndex].url.startsWith('http') ? galleryItems[galleryIndex].url : `${API_BASE_URL}${galleryItems[galleryIndex].url}`} alt={galleryItems[galleryIndex].filename} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', background: '#000' }} />
              )
            )}

            <IconButton sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff' }} onClick={() => setGalleryIndex(i => Math.max(0, i - 1))} disabled={galleryIndex === 0}>‹</IconButton>
            <IconButton sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff' }} onClick={() => setGalleryIndex(i => Math.min(galleryItems.length - 1, i + 1))} disabled={galleryIndex >= galleryItems.length - 1}>›</IconButton>
            <IconButton sx={{ position: 'absolute', top: 8, right: 8, color: '#fff' }} onClick={() => setGalleryOpen(false)}>Close</IconButton>
          </DialogContent>
        </Dialog>

        {/* Edit post dialog */}
        <Dialog open={!!editPost} onClose={() => setEditPost(null)} maxWidth="sm" fullWidth fullScreen={isPhone} aria-labelledby="edit-post-title">
          <DialogTitle id="edit-post-title" sx={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Edit post</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'grid', gap: 2, pt: 1 }}>
              <TextField label="Caption" fullWidth value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
              <TextField label="Address" fullWidth value={editAddress} onChange={(e) => { setEditAddress(e.target.value); setEditCoords(null); }} helperText="Updating the address will also update the pin location." />
              <Box
                ref={editMapContainer}
                sx={{ height: 220, borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}
              />

              {/* Existing media with remove buttons */}
              {Array.isArray(editPost?.media) && editPost.media.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Current photos &amp; videos</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    {editPost?.media?.map((m, idx) => (
                      <Box key={m.id} sx={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', bgcolor: '#000' }}>
                        <span className="absolute top-1.5 left-1.5 z-10 flex gap-1">
                          <span className="min-w-[22px] h-[22px] px-1.5 grid place-items-center rounded-full bg-black/70 text-white text-xs font-bold">{idx + 1}</span>
                          {idx === 0 && <span className="h-[22px] px-2 grid place-items-center rounded-full bg-[var(--leaf-300)] text-[#12251a] text-xs font-bold">Cover</span>}
                        </span>
                        {m.url.match(/\.(mp4|webm|ogg)$/i) ? (
                          <video style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: '1/1' }}>
                            <source src={m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`} />
                          </video>
                        ) : (
                          <img src={m.url.startsWith('http') ? m.url : `${API_BASE_URL}${m.url}`} alt={m.filename} style={{ width: '100%', display: 'block', objectFit: 'cover', aspectRatio: '1/1' }} />
                        )}
                        <Button size="small" color="error" variant="contained" onClick={() => removeMedia(m)} disabled={removingMediaId === m.id} aria-label={`Remove photo ${idx + 1}`} sx={{ position: 'absolute', left: 6, right: 6, bottom: 6, minHeight: 34, fontSize: '0.8rem' }}>
                          {removingMediaId === m.id ? 'Removing…' : 'Remove'}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Add new media: reorderable, uploaded after the current ones in this order */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Add photos &amp; videos</Typography>
                <MediaPicker id="edit-add-file" files={editNewFiles} setFiles={setEditNewFiles} disabled={posting} />
              </Box>

              <MenuItemsEditor
                menuItems={editMenuItems}
                setMenuItems={setEditMenuItems}
                sourceText={editCaption}
                helperText="Update the items and prices shown for this post."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditPost(null)} disabled={posting}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveEdit} disabled={posting} sx={{ minWidth: 110 }}>
              {posting ? (editNewFiles.length ? `Uploading ${editNewFiles.length}…` : 'Saving…') : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default OwnerUpload;
