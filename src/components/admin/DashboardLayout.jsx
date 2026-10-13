import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Box, Typography, Button } from '@mui/material';
import './admin-theme.css';
import { getActiveTheme, toggleTheme } from '../../utils/theme';
import { clearAuth } from '../../utils/auth';
import api from '../../api/backend';

// Icons as SVG components for consistency
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Applications: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Posts: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Logs: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Audit: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Tickets: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  Close: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 24.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Sun: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Feed: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
  { id: 'users', label: 'User Directory', icon: Icons.Users },
  { id: 'applications', label: 'Applications', icon: Icons.Applications },
  { id: 'posts', label: 'Content', icon: Icons.Posts },
  { id: 'tickets', label: 'Support Tickets', icon: Icons.Tickets },
  { id: 'logs', label: 'Activity Logs', icon: Icons.Logs },
  { id: 'audit', label: 'Moderation Logs', icon: Icons.Audit },
];

const drawerWidth = 272; // matching 17rem in CSS

const DashboardLayout = ({ children, activeSection, onSectionChange, isMaintenanceMode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => getActiveTheme());
  const navigate = useNavigate();

  const toggleAppTheme = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  // Ticket 4 - Dedicated Admin Logout
  // Calls the /auth/admin-logout endpoint (not /auth/logout) to ensure
  // the HttpOnly cookie is cleared and the admin is ALWAYS sent to the
  // admin gateway, never to the public user login page.
  const handleLogout = async () => {
    try {
      await api.post('/auth/admin-logout');
    } catch (err) {
      // Even if the API call fails, clear local state and redirect
      console.error('Admin logout failed:', err);
    } finally {
      clearAuth();
      navigate('/admin-gateway-secure', { replace: true });
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1240] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar z-[1250] bg-background-secondary border-r border-background-tertiary ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">Eaty Wonders</h1>
              <p className="text-white/60 text-xs">Admin Dashboard</p>
            </div>
          </div>
          {/* Mobile close button inside sidebar */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <Icons.Close />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                setSidebarOpen(false);
              }}
              className={`flex items-center gap-4 w-full p-3 rounded-xl transition-all duration-200 group ${
                activeSection === item.id 
                  ? 'bg-brand-accent/10 text-brand-accent font-bold' 
                  : 'text-content-secondary hover:bg-background-tertiary hover:text-content-primary'
              }`}
            >
              <div className={activeSection === item.id ? 'text-brand-accent' : 'text-content-secondary group-hover:text-brand-accent transition-colors'}>
                <item.icon />
              </div>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="mt-auto p-4 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={toggleAppTheme}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-content-secondary hover:bg-background-tertiary hover:text-content-primary transition-all duration-200"
          >
            {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
            <span className="font-medium">Toggle Theme</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <Icons.Logout />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <Box 
        component="main" 
        className="admin-main min-h-dvh"
        sx={{ 
          flexGrow: 1,
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          transition: (theme) => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Header */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            width: { lg: `calc(100% - ${drawerWidth}px)` },
            ml: { lg: `${drawerWidth}px` },
            backgroundColor: 'var(--admin-bg-primary)',
            color: 'var(--admin-text-primary)',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            backgroundImage: 'none' // Remove MUI dark mode overlay
          }}
        >
          <Toolbar className="w-full max-w-none px-4 sm:px-6 lg:px-8 flex justify-between gap-4">
            {/* Left: Mobile Menu + Title */}
            <Box className="flex items-center gap-2">
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                edge="start"
                onClick={() => setSidebarOpen(prev => !prev)}
                sx={{ mr: 2, display: { lg: 'none' }, zIndex: 1300 }}
              >
                {sidebarOpen ? <Icons.Close /> : <Icons.Menu />}
              </IconButton>
              <Box>
                <Typography variant="h6" noWrap component="div" className="font-bold text-content-primary">
                  {NAV_ITEMS.find(i => i.id === activeSection)?.label || 'Dashboard'}
                </Typography>
                <Typography variant="caption" className="text-content-secondary hidden sm:block">
                  Welcome back, Administrator
                </Typography>
              </Box>
            </Box>

            {/* Right: Actions */}
            <Box className="flex items-center gap-3">
              <Button 
                component={Link}
                to="/feed"
                variant="contained"
                startIcon={<Icons.Feed />}
                className="bg-brand-accent hover:bg-brand-accent/90 text-white rounded-xl font-bold transition-all px-4 py-2"
                sx={{ textTransform: 'none' }}
              >
                <span className="hidden sm:inline">Go to Feed</span>
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Toolbar Spacer to prevent content from going under the AppBar */}
        <Toolbar />

        {/* Maintenance Banner */}
        {isMaintenanceMode && (
          <Box className="mx-4 sm:mx-6 mt-6">
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-sm">MAINTENANCE MODE ACTIVE</p>
                  <p className="text-xs opacity-80">Public access to the site is currently blocked.</p>
                </div>
              </div>
              <div className="hidden sm:block px-3 py-1 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                Live
              </div>
            </div>
          </Box>
        )}

        {/* Page Content */}
        <Box className="p-4 sm:p-6 lg:p-8 w-full max-w-none mx-auto">
          {children}
        </Box>
      </Box>
    </div>
  );
};

export default DashboardLayout;
