import React, { useEffect, useState, useCallback } from 'react';
import api, { API_BASE_URL } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import {
  Box, Avatar, Typography, TextField, Button, Divider,
  CircularProgress, Skeleton,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const COMMENTS_PER_PAGE = 10;

/**
 * Social-media-style comment thread.
 * - Shows newest comments first
 * - Paginated: loads 10 at a time with a "Load more" button
 * - Works with both the old flat array API response and the new paginated shape
 */
const CommentThread = ({ uploadId, postOwnerId, compact = false }) => {
  const { user, loading: authLoading } = useAuth();
  const [comments, setComments]     = useState([]);
  const [total, setTotal]           = useState(0);
  const [offset, setOffset]         = useState(0);
  const [hasMore, setHasMore]       = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [text, setText]             = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // isAuthenticated: optimistic while session is loading (same fix as PostDetail)
  const isAuthenticated = authLoading || !!user;

  const fetchComments = useCallback(async (offsetVal = 0, append = false) => {
    try {
      const pageVal = Math.floor(offsetVal / COMMENTS_PER_PAGE) + 1;
      const { data } = await api.get(
        `/api/uploads/${uploadId}/comments?limit=${COMMENTS_PER_PAGE}&page=${pageVal}`
      );
      // Handle both old flat-array response and new paginated shape
      if (Array.isArray(data)) {
        // Old API: flat array, no pagination
        setComments(data);
        setTotal(data.length);
        setHasMore(false);
      } else {
        // New API: { comments, total, hasMore }
        setComments(prev => append ? [...prev, ...(data.comments || [])] : (data.comments || []));
        setTotal(data.total ?? 0);
        setHasMore(data.hasMore ?? false);
        setOffset(offsetVal + (data.comments?.length || 0));
      }
    } catch {
      // silently ignore fetch errors
    } finally {
      setInitialLoad(false);
    }
  }, [uploadId]);

  useEffect(() => {
    setComments([]);
    setOffset(0);
    setHasMore(false);
    setInitialLoad(true);
    fetchComments(0, false);
  }, [uploadId, fetchComments]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchComments(offset, true);
    setLoadingMore(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!user) { setError('Please log in to comment'); return; }
    const trimmed = text.trim();
    if (!trimmed) return;

    // ── Optimistic update: show the comment immediately ──────────────────────
    // Build a temporary comment object from local user state.
    // The 'optimistic-*' key is replaced when the server confirms.
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      text: trimmed,
      user_id: user.id,
      author_id: user.id,
      author_name: user.name || user.email?.split('@')[0] || 'You',
      author_email: user.email,
      author_profile_url: user.profile_url || null,
      created_at: new Date().toISOString(),
    };

    setText('');                                            // clear input instantly
    setError('');
    setSubmitting(true);
    setComments(prev => [optimisticComment, ...prev]);     // prepend immediately
    setTotal(prev => prev + 1);

    try {
      await api.post(
        `/api/uploads/${uploadId}/comments`,
        { text: trimmed },
        { withCredentials: true }
      );
      // Background-sync: replace optimistic entry with confirmed server data
      fetchComments(0, false);
    } catch (err) {
      // Roll back the optimistic comment on failure
      setComments(prev => prev.filter(c => c.id !== optimisticId));
      setTotal(prev => Math.max(0, prev - 1));
      const status = err?.response?.status;
      const errorMsg = err?.response?.data?.error || 'Failed to post comment';
      if (status === 401) {
        setError('Please log in to comment');
        toast.error('Please log in to comment');
      } else {
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleHide = async (commentId, hideStatus) => {
    try {
      // Optimistic update
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_hidden: hideStatus ? 1 : 0 } : c));
      await api.patch(`/api/comments/${commentId}/hide`, { is_hidden: hideStatus ? 1 : 0 }, { withCredentials: true });
      toast.success(hideStatus ? 'Comment hidden' : 'Comment unhidden');
    } catch (err) {
      // Rollback on failure
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_hidden: hideStatus ? 0 : 1 } : c));
      const errorMsg = err?.response?.data?.error || 'Failed to update comment visibility';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <Box sx={{ mt: 1.5 }}>
      <Divider sx={{ mb: 1.5 }} />

      {/* Comment count */}
      {!initialLoad && (
        <Typography variant="caption" sx={{ color: 'var(--text-secondary, #66756a)', mb: 1, display: 'block' }}>
          {total} {total === 1 ? 'comment' : 'comments'}
        </Typography>
      )}

      {/* Comment input */}
      <Box key="comment-submission-form" component="form" onSubmit={submit} sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'flex-start' }}>
        {user && (
          <Avatar
            src={user.profile_url ? `${API_BASE_URL}${user.profile_url}` : undefined}
            sx={{ width: 32, height: 32, mt: 0.5, flexShrink: 0 }}
          >
            {(user.name || user.email || 'U')[0].toUpperCase()}
          </Avatar>
        )}
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={4}
          placeholder={
            authLoading
              ? 'Checking session…'
              : isAuthenticated
              ? 'Write a comment…'
              : 'Log in to comment'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!isAuthenticated || submitting}
          sx={{ bgcolor: 'var(--surface, #fff)', borderRadius: 1 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e);
          }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!isAuthenticated || !text.trim() || submitting}
          sx={{ minWidth: 80, flexShrink: 0 }}
        >
          {submitting ? <CircularProgress size={18} /> : 'Post'}
        </Button>
      </Box>
      {error && (
        <Box
          sx={{
            mb: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(211, 47, 47, 0.06)',
            border: '1px solid rgba(211, 47, 47, 0.15)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            animation: 'fadeSlideIn 250ms ease-out',
            '@keyframes fadeSlideIn': {
              from: { opacity: 0, transform: 'translateY(-6px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              bgcolor: 'rgba(211, 47, 47, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              mt: 0.25,
            }}
          >
            <Typography sx={{ fontSize: 14, lineHeight: 1 }}>⚠️</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 700, display: 'block', lineHeight: 1.4 }}>
              {error}
            </Typography>
            {!user && (
              <Typography variant="caption" sx={{ color: '#d32f2f', mt: 0.25, display: 'block' }}>
                <Link to="/login" style={{ color: '#d32f2f', fontWeight: 700 }}>Login</Link> to comment.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Loading skeleton */}
      {initialLoad && (
        <Box sx={{ display: 'grid', gap: 1 }}>
          {[...Array(3)].map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="circular" width={28} height={28} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="30%" height={14} />
                <Skeleton width="80%" height={14} />
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Comment list */}
      {!initialLoad && comments.length === 0 && (
        <Typography variant="body2" sx={{ color: 'var(--text-secondary, #66756a)' }}>
          No comments yet. Be the first!
        </Typography>
      )}

      <Box
        className="custom-scrollbar"
        sx={{
          maxHeight: 600,
          overflowY: 'auto',
          pr: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {comments.map((c) => {
            const name = c.author_name || (c.author_email ? c.author_email.split('@')[0] : 'User');
            const avatar = c.author_profile_url ? `${API_BASE_URL}${c.author_profile_url}` : undefined;
            const isHidden = c.is_hidden === 1;
            const canManage = user && (user.role === 'admin' || user.id === postOwnerId || user.id === c.post_owner_id);
            const authorRole = c.author_role || c.role;
            const authorId = c.author_id || c.user_id;
            const isFoodOwner = authorRole === 'food_owner' || authorRole === 'owner';
            const isEndUser = authorRole === 'end_user' || authorRole === 'user';
            const profileLink = isFoodOwner ? `/restaurant/${authorId}` : isEndUser ? `/profile/${authorId}` : null;

            return (
              <Box key={c.id} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', opacity: isHidden ? 0.6 : 1 }}>
                {profileLink ? (
                  <Link to={profileLink} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <Avatar src={avatar} sx={{ width: 28, height: 28, fontSize: 13 }}>
                      {name[0]?.toUpperCase()}
                    </Avatar>
                  </Link>
                ) : (
                  <Avatar src={avatar} sx={{ width: 28, height: 28, fontSize: 13, flexShrink: 0 }}>
                    {name[0]?.toUpperCase()}
                  </Avatar>
                )}
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
                    {profileLink ? (
                      <Link to={profileLink} style={{ textDecoration: 'none' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-primary, #203224)', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                          {name}
                        </Typography>
                      </Link>
                    ) : (
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-primary, #203224)' }}>
                        {name}
                      </Typography>
                    )}
                    {c.created_at && (
                      <Typography variant="caption" sx={{ color: 'var(--text-secondary, #66756a)', fontSize: '0.7rem' }}>
                        {new Date(c.created_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'var(--text-primary, #203224)', mt: 0.25, fontStyle: isHidden ? 'italic' : 'normal' }}>
                    {isHidden && <span style={{ fontWeight: 'bold', color: 'red', marginRight: '4px' }}>[Hidden]</span>}
                    {c.text}
                  </Typography>
                  {canManage && (
                    <Button
                      size="small"
                      variant="text"
                      sx={{ p: 0, minWidth: 'auto', mt: 0.5, fontSize: '0.7rem', color: 'var(--text-secondary)' }}
                      onClick={() => toggleHide(c.id, !isHidden)}
                    >
                      {isHidden ? 'Unhide' : 'Hide'}
                    </Button>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Load more */}
        {hasMore && (
          <Button
            size="small"
            variant="text"
            onClick={loadMore}
            disabled={loadingMore}
            sx={{ mt: 0.5, alignSelf: 'flex-start', color: 'var(--text-secondary, #66756a)' }}
            startIcon={loadingMore ? <CircularProgress size={14} /> : null}
          >
            {loadingMore ? 'Loading…' : `Load more comments`}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default CommentThread;
