import React, { useState, useEffect } from 'react';
import { FALLBACK_IMAGE } from '../utils/media';
import { Box, Typography, CircularProgress, Card, CardMedia, CardContent, Button, Stack } from '@mui/material';
import RoomIcon from '@mui/icons-material/Room';
import { useNavigate } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/backend';

const UserFavorites = ({ userId }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/users/${userId}/favorites`);
        setFavorites(data);
      } catch (err) {
        console.error('Failed to fetch favorites:', err);
        setError('Could not load your favorites. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchFavorites();
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

  if (!favorites.length) return (
    <Box className="text-center py-10 bg-brand-bg1 rounded-3xl border border-dashed border-brand-bg3">
      <Typography className="text-brand-text-secondary">No favorites saved yet.</Typography>
    </Box>
  );

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {favorites.map((fav) => (
        <Card 
          key={fav.id} 
          elevation={0}
          className="flex flex-col h-full bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
          onClick={() => navigate(`/restaurant/${fav.place_id}`)}
          sx={{ cursor: 'pointer', backgroundColor: 'var(--surface)' }}
        >
          <div className="w-full h-48 sm:h-52 overflow-hidden bg-background-secondary relative flex-shrink-0">
            <CardMedia
              component="img"
              image={fav.image_url ? (fav.image_url.startsWith('http') ? fav.image_url : `${API_BASE_URL}${fav.image_url}`) : FALLBACK_IMAGE}
              alt={fav.name}
              className="w-full h-48 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4">
              <Typography variant="h6" className="text-white font-bold truncate">
                {fav.name}
              </Typography>
            </div>
          </div>
          <CardContent className="flex flex-col flex-1 p-4 md:p-5">
            <Stack spacing={1.5} className="flex-1">
              <Box className="flex items-start gap-2 text-secondary">
                <RoomIcon fontSize="small" sx={{ color: 'var(--brand-accent)', mt: 0.2 }} />
                <Typography variant="body2" className="text-sm text-secondary line-clamp-2">
                  {fav.address || 'No address provided'}
                </Typography>
              </Box>
              <Typography variant="body2" className="text-sm text-secondary line-clamp-2">
                {fav.description || 'No description available'}
              </Typography>
              <div className="mt-auto pt-4 border-t border-border-subtle/50">
                <Button 
                  variant="outlined" 
                  fullWidth
                  sx={{ 
                    borderRadius: '12px',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  View Details
                </Button>
              </div>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default UserFavorites;
