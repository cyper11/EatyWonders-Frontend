import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggleButton = ({ sx = {} }) => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Tooltip title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      <IconButton 
        onClick={toggleTheme} 
        sx={{ 
          color: 'var(--text-primary)',
          bgcolor: 'var(--bg-secondary)',
          '&:hover': { 
            bgcolor: 'var(--bg-tertiary)',
            transform: 'translateY(-1px)',
          },
          width: 40,
          height: 40,
          borderRadius: '12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          ...sx
        }}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
