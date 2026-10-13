import React, { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Alert, Stack } from '@mui/material';
import api from '../api/backend';
import { useAuth } from '../context/AuthContext';

const EditSocialsModal = ({ onClose, onSaved }) => {
  const { user, updateUser } = useAuth();
  const [fb, setFb] = useState(user?.facebook_url || '');
  const [ig, setIg] = useState(user?.instagram_url || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data } = await api.patch(`/api/users/${user.id}/socials`, {
        facebook_url: fb,
        instagram_url: ig
      });
      
      // Update local auth context
      updateUser({ ...user, facebook_url: data.facebook_url, instagram_url: data.instagram_url });
      
      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(onClose, 1500);
    } catch (err) {
      console.error('Failed to update socials:', err);
      setError(err.response?.data?.error || 'Failed to update social links. Please check the URL formats.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="p-2">
      <Typography variant="body2" className="text-brand-text-secondary mb-6">
        Add your business's social media profiles. These will be displayed as clickable icons on your public profile.
      </Typography>

      <Stack spacing={3}>
        <Box>
          <Typography variant="caption" className="font-bold text-brand-text mb-1 block">Facebook URL</Typography>
          <TextField
            fullWidth
            placeholder="facebook.com/yourbusiness"
            value={fb}
            onChange={(e) => setFb(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'var(--input-bg)',
                '& fieldset': { borderColor: 'var(--brand-bg3)' },
                '&:hover fieldset': { borderColor: 'var(--brand-accent)' },
              }
            }}
          />
        </Box>

        <Box>
          <Typography variant="caption" className="font-bold text-brand-text mb-1 block">Instagram URL</Typography>
          <TextField
            fullWidth
            placeholder="instagram.com/yourbusiness"
            value={ig}
            onChange={(e) => setIg(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: 'var(--input-bg)',
                '& fieldset': { borderColor: 'var(--brand-bg3)' },
                '&:hover fieldset': { borderColor: 'var(--brand-accent)' },
              }
            }}
          />
        </Box>

        {error && <Alert severity="error" className="rounded-xl">{error}</Alert>}
        {success && <Alert severity="success" className="rounded-xl">Social links updated successfully!</Alert>}

        <Button
          fullWidth
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          sx={{
            borderRadius: '12px',
            bgcolor: 'var(--brand-accent)',
            py: 1.5,
            fontWeight: 800,
            textTransform: 'none',
            '&:hover': { bgcolor: '#518f42' }
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Social Links'}
        </Button>
      </Stack>
    </Box>
  );
};

// SVG Icons for display
export const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default EditSocialsModal;
