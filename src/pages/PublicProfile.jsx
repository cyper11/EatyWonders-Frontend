import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Container, 
  Box, 
  Typography, 
  Avatar, 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  CircularProgress,
  Paper,
  Rating
} from '@mui/material';
import api, { API_BASE_URL } from '../api/backend';
import useDocumentTitle from '../hooks/useDocumentTitle';

const PublicProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentTitle(profile?.user?.name ? `${profile.user.name}'s Profile` : 'User Profile');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/auth/profile/${id}`);
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h5" color="error" textAlign="center">{error || 'User not found'}</Typography>
        <Box textAlign="center" mt={2}>
          <Link to="/" style={{ color: 'var(--primary-main)' }}>Return to Home</Link>
        </Box>
      </Container>
    );
  }

  const { user, uploads } = profile;
  const avatarFallback = user.name?.charAt(0).toUpperCase();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Paper elevation={0} sx={{ 
        p: 4, 
        borderRadius: 4, 
        bgcolor: 'var(--surface-paper)', 
        border: '1px solid var(--surface-border)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Profile Header Background Decor */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 100, 
          background: 'var(--bg-secondary)'
        }} />

        <Avatar 
          src={user.profile_url} 
          sx={{ 
            width: 120, 
            height: 120, 
            mx: 'auto', 
            mb: 2, 
            border: '4px solid var(--surface)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            position: 'relative',
            zIndex: 1,
            bgcolor: 'var(--accent)',
            color: 'var(--on-accent)',
            fontSize: '3rem'
          }}
        >
          {avatarFallback}
        </Avatar>

        <Typography variant="h4" sx={{ fontWeight: 800, color: 'var(--surface-text)' }}>
          {user.name}
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'var(--surface-secondary)', mt: 1, maxWidth: 600, mx: 'auto' }}>
          {user.bio}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'var(--surface-text)' }}>{uploads.length}</Typography>
            <Typography variant="caption" sx={{ color: 'var(--surface-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Posts</Typography>
          </Box>
        </Box>
      </Paper>

      <Typography variant="h5" sx={{ mt: 6, mb: 3, fontWeight: 800, color: 'var(--surface-text)' }}>
        Shared Wonders
      </Typography>

      {uploads.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4, bgcolor: 'var(--surface-paper)', border: '1px dotted var(--surface-border)' }}>
          <Typography color="text.secondary">This user hasn't shared any culinary wonders yet.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {uploads.map((upload) => (
            <Grid item xs={12} sm={6} md={4} key={upload.id}>
              <Card 
                component={Link} 
                to={`/post/${upload.id}`}
                sx={{ 
                  borderRadius: 3, 
                  textDecoration: 'none',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <CardMedia
                  component={upload.url?.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'img'}
                  height="200"
                  image={upload.url?.startsWith('http') ? upload.url : `${API_BASE_URL}${upload.url}`}
                  src={upload.url?.startsWith('http') ? upload.url : `${API_BASE_URL}${upload.url}`}
                  alt={upload.caption || 'Upload'}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700, color: 'var(--surface-text)' }}>
                    {upload.caption || upload.restaurant_name || 'Untitled Wonder'}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: 'var(--surface-secondary)', display: 'block' }}>
                    {upload.restaurant_name}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Rating size="small" value={upload.rating_avg || 0} readOnly precision={0.5} />
                    <Typography variant="caption" sx={{ color: 'var(--surface-secondary)' }}>
                      ({upload.rating_count || 0})
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default PublicProfile;
