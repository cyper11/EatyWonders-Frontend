import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Card, CardMedia, CardContent, Stack, Button, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/backend';

const OwnerPosts = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/posts`, { params: { owner_id: userId } });
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch owner posts:', err);
        setError('Could not load your posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPosts();
  }, [userId]);

  if (loading) return (
    <Box className="flex justify-center py-10">
      <CircularProgress sx={{ color: 'var(--brand-accent)' }} />
    </Box>
  );

  if (error) return (
    <Box className="text-center py-10 text-red-500">
      <Typography>{error}</Typography>
    </Box>
  );

  if (!posts.length) return (
    <Box className="text-center py-12 bg-brand-bg1 rounded-3xl border border-dashed border-brand-bg3">
      <Typography className="text-brand-text-secondary mb-4">You haven't posted anything yet.</Typography>
      <Button 
        variant="contained" 
        onClick={() => navigate('/owner/upload')}
        sx={{ borderRadius: '12px', bgcolor: 'var(--brand-accent)', fontWeight: 700 }}
      >
        Create Your First Post
      </Button>
    </Box>
  );

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {posts.map((post) => (
        <Card 
          key={post.id} 
          elevation={0}
          className="flex flex-col h-full bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
          sx={{ backgroundColor: 'var(--surface)' }}
        >
          <div className="w-full h-48 sm:h-52 overflow-hidden bg-background-secondary relative flex-shrink-0 cursor-pointer" onClick={() => navigate(`/post/${post.post_id || post.id}`)}>
            <CardMedia
              component="img"
              image={post.url ? (post.url.startsWith('http') ? post.url : `${API_BASE_URL}${post.url}`) : 'https://via.placeholder.com/400x300?text=No+Media'}
              alt={post.caption || 'Owner Post'}
              className="w-full h-48 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-3 right-3 flex gap-2 pointer-events-none">
              <Chip 
                label={new Date(post.created_at).toLocaleDateString()} 
                size="small" 
                className="bg-black/60 text-white backdrop-blur-md font-bold border-none"
              />
            </div>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 pointer-events-none">
              <Stack direction="row" spacing={2} className="text-white font-bold">
                <Box className="flex items-center gap-1"><FavoriteIcon /> {post.likes_count || 0}</Box>
                <Box className="flex items-center gap-1"><CommentIcon /> {post.comments_count || 0}</Box>
              </Stack>
            </div>
          </div>
          <CardContent className="flex flex-col flex-1 p-4 md:p-5">
            <Typography variant="body2" className="text-sm text-secondary line-clamp-2 mt-1 mb-4">
              {post.caption || 'No caption provided.'}
            </Typography>
            <div className="mt-auto pt-4 border-t border-border-subtle/50">
              <Stack direction="row" spacing={1.5}>
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  fullWidth
                  sx={{ 
                    borderRadius: '12px', 
                    borderColor: 'var(--border-subtle)', 
                    color: 'var(--text-primary)',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                  onClick={(e) => { e.stopPropagation(); /* Placeholder */ }}
                >
                  Edit
                </Button>
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteIcon />}
                  fullWidth
                  sx={{ 
                    borderRadius: '12px', 
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                  onClick={(e) => { e.stopPropagation(); /* Placeholder */ }}
                >
                  Delete
                </Button>
              </Stack>
            </div>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default OwnerPosts;
