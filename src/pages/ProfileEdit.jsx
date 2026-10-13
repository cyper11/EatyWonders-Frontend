import React, { useState } from 'react';
import api, { API_BASE_URL } from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { Avatar, Box, Button, TextField, Stack } from '@mui/material';

// Reusable edit form suitable for embedding in a Dialog
const ProfileEditForm = ({ onClose }) => {
  const { user: u, updateUser } = useAuth();
  const [name, setName] = useState(u?.name || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(u?.profile_url ? `${API_BASE_URL}${u.profile_url}` : undefined);
  const [saving, setSaving] = useState(false);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      if (name && name.trim()) form.append('name', name.trim());
      if (file) form.append('profile', file);
      const { data } = await api.post('/auth/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(data.user);
      if (onClose) onClose();
    } catch (e) {
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Box style={{ display:'flex', alignItems:'center', gap:16 }}>
        <Avatar src={preview} sx={{ width: 72, height: 72 }}>
          {(u?.name || u?.email || 'U').slice(0,1).toUpperCase()}
        </Avatar>
        <Button component="label" variant="outlined">
          Choose Photo
          <input type="file" accept="image/*" hidden onChange={onFile} />
        </Button>
      </Box>
      <TextField label="Name" value={name} onChange={(e)=>setName(e.target.value)} />
      <Box>
        <Button variant="contained" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        <Button variant="text" sx={{ ml: 1 }} onClick={()=>onClose && onClose()}>Cancel</Button>
      </Box>
    </Stack>
  );
};

export default ProfileEditForm;
