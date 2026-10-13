import React from 'react';
import Chip from '@mui/material/Chip';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';

const VeganBadge = ({ label = 'Vegan Options', size = 'small', sx = {} }) => (
  <Chip
    icon={<SpaOutlinedIcon />}
    label={label}
    size={size}
    sx={{
      bgcolor: '#245c35',
      color: '#f7fff5',
      fontWeight: 800,
      border: '1px solid rgba(18, 63, 30, 0.6)',
      boxShadow: '0 6px 16px rgba(25, 66, 37, 0.18)',
      textShadow: '0 1px 1px rgba(0, 0, 0, 0.18)',
      '& .MuiChip-label': {
        color: '#f7fff5',
        px: 0.5,
      },
      '& .MuiChip-icon': { color: '#b8ef91' },
      ...sx,
    }}
  />
);

export default VeganBadge;
