import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggleButton = ({ sx = {} }) => {
  const { theme, toggleTheme } = useTheme();
  const label = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={toggleTheme}
        aria-label={label}
        sx={{
          width: 44,
          height: 44,
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-subtle)',
          bgcolor: 'var(--surface)',
          transition: 'color 0.2s, border-color 0.2s, background-color 0.2s',
          '&:hover': {
            color: 'var(--accent)',
            borderColor: 'var(--border-brand)',
            bgcolor: 'var(--surface)',
          },
          ...sx,
        }}
      >
        {theme === 'dark' ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggleButton;
