import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../context/AuthContext';

const ImpersonationBanner = () => {
  const { impersonatedUser, stopImpersonation } = useAuth();

  if (!impersonatedUser) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#ff9800', // Highly visible orange
        color: '#fff',
        py: 1,
        position: 'sticky',
        top: 0,
        zIndex: 2000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        borderBottom: '2px solid #e68a00',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: '0.02em' }}>
              SECURE VIEW AS ACTIVE: 
              <Box component="span" sx={{ fontWeight: 400, ml: 1, color: '#fff' }}>
                Currently viewing the system as <strong>{impersonatedUser.email}</strong>
              </Box>
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="small"
            startIcon={<ExitToAppIcon />}
            onClick={stopImpersonation}
            sx={{
              backgroundColor: '#fff',
              color: '#ff9800',
              fontWeight: 800,
              '&:hover': {
                backgroundColor: '#f5f5f5',
                color: '#e68a00',
              },
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              px: 2,
            }}
          >
            Exit View As
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default ImpersonationBanner;
