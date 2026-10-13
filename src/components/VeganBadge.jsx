import React from 'react';
import Chip from '@mui/material/Chip';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';

const VeganBadge = ({ label = 'Vegan Options', size = 'small', sx = {} }) => (
  <Chip
    icon={<SpaOutlinedIcon />}
    label={label}
    size={size}
    sx={{
      height: size === 'small' ? 26 : 32,
      bgcolor: 'var(--brand-accent-soft)',
      color: 'var(--accent)',
      fontWeight: 700,
      border: '1px solid var(--border-brand)',
      '& .MuiChip-label': { color: 'var(--accent)', px: 0.75 },
      '& .MuiChip-icon': { color: 'var(--accent)', fontSize: 16, ml: 0.75 },
      ...sx,
    }}
  />
);

export default VeganBadge;
