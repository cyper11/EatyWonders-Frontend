import React from 'react';
import Header from '../components/Header';
import { getUser } from '../utils/auth';
import { Avatar, Card, CardContent, Typography, Box } from '@mui/material';
import { API_BASE_URL } from '../api/backend';

// Thin wrapper: the home already shows the map+list; this page can simply show the list area if desired.
const UserPage = (props) => {
  // For simplicity, rely on existing home UX; you can customize later.
  const u = getUser();
  const avatarSrc = u?.profile_url ? `${API_BASE_URL}${u.profile_url}` : undefined;
  return (
    <>
      <Header />
      <div style={{ padding: 16, paddingTop: 80 }}>
        <h2>User Dashboard</h2>
        <p>You can browse restaurants and write reviews on place cards.</p>
        {u && (
          <Card style={{ maxWidth: 420, marginTop: 16 }}>
            <CardContent>
              <Box style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Avatar src={avatarSrc} sx={{ width: 56, height: 56 }}>
                  {(u.name || u.email || 'U').slice(0,1).toUpperCase()}
                </Avatar>
                <div>
                  <Typography variant="h6">{u.name || 'Unnamed User'}</Typography>
                  <Typography variant="body2" color="text.secondary">{u.email}</Typography>
                  <Typography variant="caption" color="text.secondary">Role: {u.role}</Typography>
                </div>
              </Box>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default UserPage;
