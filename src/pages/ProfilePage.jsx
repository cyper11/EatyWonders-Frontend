import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Box, Typography, Avatar, Tab, Tabs, CircularProgress, Container, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import UserActivityLogs from '../components/UserActivityLogs';
import UserFavorites from '../components/UserFavorites';
import OwnerPosts from '../components/OwnerPosts';
import OwnerMenu from '../components/OwnerMenu';
import EditSocialsModal, { FacebookIcon, InstagramIcon } from '../components/EditSocialsModal';
import { API_BASE_URL } from '../api/backend';

const getLevelData = (xp, role) => {
  const isOwner = role === 'owner';
  const xpNum = Number(xp || 0);

  if (isOwner) {
    if (xpNum < 501) {
      return {
        level: 1,
        rank: 'Local Business',
        minXp: 0,
        maxXp: 500,
        progress: (xpNum / 500) * 100,
        checklist: [
          { text: 'Submit your restaurant for admin verification (+500 XP)' },
          { text: 'Post dishes with menu items (+30 XP)' },
          { text: 'Reply to customer comments/posts (+20 XP)' }
        ]
      };
    } else if (xpNum < 1501) {
      return {
        level: 2,
        rank: 'Neighborhood Favorite',
        minXp: 501,
        maxXp: 1500,
        progress: ((xpNum - 501) / (1500 - 501)) * 100,
        checklist: [
          { text: 'Receive a high review (4 or 5 stars) from customers (+50 XP)' },
          { text: 'Regularly post new dishes & menu items (+30 XP)' },
          { text: 'Reply to customer reviews (+20 XP)' }
        ]
      };
    } else {
      return {
        level: 3,
        rank: 'Cavite Taste-Maker',
        minXp: 1501,
        maxXp: 3000,
        progress: 100,
        checklist: []
      };
    }
  } else {
    // Tourist
    if (xpNum < 101) {
      return {
        level: 1,
        rank: 'Tourist',
        minXp: 0,
        maxXp: 100,
        progress: (xpNum / 100) * 100,
        checklist: [
          { text: 'Write a culinary review (+50 XP)' },
          { text: 'Upload photos/videos of local food (+30 XP)' }
        ]
      };
    } else if (xpNum < 301) {
      return {
        level: 2,
        rank: 'Local Explorer',
        minXp: 101,
        maxXp: 300,
        progress: ((xpNum - 101) / (300 - 101)) * 100,
        checklist: [
          { text: 'Write more reviews (+50 XP)' },
          { text: 'Upload more culinary photos (+30 XP)' }
        ]
      };
    } else {
      return {
        level: 3,
        rank: 'Cavite Culinary Expert',
        minXp: 301,
        maxXp: 1000,
        progress: 100,
        checklist: []
      };
    }
  }
};

const ProfilePage = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('');
  const [showSocialsModal, setShowSocialsModal] = useState(false);

  const levelData = user ? getLevelData(user.xp || 0, user.role) : null;

  // Set default tab based on role once user data is available
  useEffect(() => {
    if (user && !activeTab) {
      setActiveTab('posts');
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <>
        <Box className="flex items-center justify-center min-h-[60vh]">
          <CircularProgress sx={{ color: 'var(--brand-accent)' }} />
        </Box>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Box className="max-w-md mx-auto text-center py-20 px-6">
          <Box className="bg-surface p-10 rounded-panel border border-subtle shadow-card">
            <Typography variant="h5" className="font-black text-brand-text mb-4">Access Denied</Typography>
            <Typography className="text-brand-text-secondary mb-8">Please log in to view your profile and manage your activity.</Typography>
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full min-h-[48px] bg-brand-accent text-on-accent font-bold rounded-full hover:bg-brand-strong transition-colors"
            >
              Log in
            </button>
          </Box>
        </Box>
      </>
    );
  }

  const avatarSrc = user.profile_url ? (user.profile_url.startsWith('http') ? user.profile_url : `${API_BASE_URL}${user.profile_url}`) : undefined;

  return (
    <>
      <Container maxWidth="lg" disableGutters className="py-6 sm:py-10">
        {/* Profile Header */}
        <Box className="bg-surface rounded-panel p-6 sm:p-8 mb-8 border border-subtle shadow-card flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
          
          <Avatar 
            src={avatarSrc} 
            sx={{ width: 128, height: 128, fontSize: '3rem', fontWeight: 700, bgcolor: 'var(--accent)', color: 'var(--on-accent)', border: '4px solid var(--surface)', boxShadow: '0 0 0 1px var(--border-subtle)' }}
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          
          <Box className="text-center md:text-left flex-grow">
            <Box className="flex flex-wrap justify-center md:justify-start gap-3 items-center mb-1">
              <Typography variant="h4" component="h1" className="text-brand-text" sx={{ fontSize: { xs: '1.9rem', sm: '2.25rem' } }}>
                {user.name}
              </Typography>
              <Box className="px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-xs font-bold capitalize border border-brand-accent/20">
                {user.role}
              </Box>
              
              {/* Social Icons */}
              <Box className="flex items-center gap-2 ml-2">
                {user.facebook_url && (
                  <a href={user.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook (opens in new tab)" className="w-10 h-10 grid place-items-center rounded-full text-content-secondary hover:text-brand-accent hover:bg-brand-accent/10 transition-colors">
                    <FacebookIcon className="w-5 h-5" />
                  </a>
                )}
                {user.instagram_url && (
                  <a href={user.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram (opens in new tab)" className="w-10 h-10 grid place-items-center rounded-full text-content-secondary hover:text-brand-accent hover:bg-brand-accent/10 transition-colors">
                    <InstagramIcon className="w-5 h-5" />
                  </a>
                )}
              </Box>
            </Box>
            <Typography variant="body1" className="text-brand-text-secondary font-medium mb-4">
              {user.email}
            </Typography>
            
            <Box className="flex flex-wrap justify-center md:justify-start gap-6 items-center">
              <Box className="text-center md:text-left">
                <Typography variant="caption" className="text-brand-text-secondary font-semibold">Member since</Typography>
                <Typography variant="body2" className="font-black text-brand-text">
                  {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
              </Box>

              {user.role === 'owner' && (
                <button 
                  onClick={() => setShowSocialsModal(true)}
                  className="flex items-center gap-2 min-h-[40px] px-4 bg-background-secondary text-brand-text rounded-full text-sm font-semibold border border-subtle hover:border-brand-accent hover:text-brand-accent transition-colors"
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                  Edit socials
                </button>
              )}
            </Box>
          </Box>
          
        </Box>

        {/* Level & XP Progress Card */}
        {levelData && (
          <Box className="bg-surface rounded-panel p-6 sm:p-8 mb-8 border border-subtle shadow-card relative overflow-hidden">
            <Box className="flex flex-col lg:flex-row gap-8 items-stretch">
              {/* XP progress details */}
              <Box className="flex-grow flex flex-col justify-between">
                <Box className="mb-4">
                  <Box className="flex items-center gap-3 mb-2 flex-wrap">
                    <Typography variant="h6" component="h2" className="text-brand-text">
                      Rank: {levelData.rank}
                    </Typography>
                    <Box className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                      levelData.level === 3 ? 'bg-[var(--annatto-600)]' :
                      levelData.level === 2 ? 'bg-[var(--forest-700)]' :
                      'bg-[#5b6b60]'
                    }`}>
                      Lvl {levelData.level}
                    </Box>
                  </Box>
                  <Typography variant="body2" className="text-brand-text-secondary font-medium">
                    {user.role === 'owner' ? 'Vendor Growth & Levels' : 'Tourist Discovery Rank'}
                  </Typography>
                </Box>

                {/* Progress Bar */}
                <Box className="mt-4">
                  <Box className="flex justify-between items-end mb-2">
                    <Typography className="text-xs font-bold text-brand-text-secondary">
                      Current XP: {user.xp || 0} XP
                    </Typography>
                    {levelData.maxXp && (
                      <Typography className="text-xs font-black text-brand-accent">
                        Next Rank at {levelData.maxXp} XP
                      </Typography>
                    )}
                  </Box>
                  <Box className="w-full bg-background-secondary h-3 rounded-full overflow-hidden" role="progressbar" aria-label="XP progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(levelData.progress || 0)}>
                    <Box 
                      className="h-full rounded-full bg-brand-accent transition-[width] duration-700 ease-out"
                      style={{ width: `${Math.min(100, Math.max(5, levelData.progress))}%` }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* XP Checklist */}
              {levelData.checklist && levelData.checklist.length > 0 && (
                <Box className="lg:w-96 bg-background-secondary p-5 rounded-card flex flex-col justify-center">
                  <Typography className="font-bold text-sm text-brand-text mb-3">
                    Earn more XP
                  </Typography>
                  <Box className="space-y-3">
                    {levelData.checklist.map((item, index) => (
                      <Box key={index} className="flex items-start gap-2.5">
                        <span className="text-brand-accent text-sm mt-[-2px]">✦</span>
                        <Typography variant="caption" className="text-brand-text-secondary font-semibold leading-relaxed">
                          {item.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Navigation Tabs */}
        <Box className="mb-8 border-b border-subtle">
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            aria-label="Profile sections"
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: 'var(--accent)', height: 3, borderRadius: 3 },
              '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.98rem', color: 'var(--text-secondary)', minHeight: 52 },
              '& .Mui-selected': { color: 'var(--accent) !important' }
            }}
          >
            <Tab key="posts" label="My posts" value="posts" />
            {user.role === 'owner' && <Tab key="menu" label="Establishment menu" value="menu" />}
            <Tab key="activity" label="Activity" value="activity" />
            <Tab key="favorites" label="Favorites" value="favorites" />
          </Tabs>
        </Box>

        {/* Content Area */}
        <Box className="min-h-[400px] animate-in fade-in duration-500">
          {activeTab === 'activity' && <UserActivityLogs userId={user.id} />}
          {activeTab === 'favorites' && <UserFavorites userId={user.id} />}
          {activeTab === 'posts' && <OwnerPosts userId={user.id} />}
          {activeTab === 'menu' && <OwnerMenu userId={user.id} />}
        </Box>
      </Container>

      {/* Edit Socials Modal */}
      <Dialog 
        open={showSocialsModal} 
        onClose={() => setShowSocialsModal(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { p: 1 } }}
      >
        <DialogTitle className="flex justify-between items-center">
          <Typography variant="h6" component="span">Business socials</Typography>
          <IconButton onClick={() => setShowSocialsModal(false)} aria-label="Close"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <EditSocialsModal 
            onClose={() => setShowSocialsModal(false)} 
            onSaved={() => {/* AuthContext update handled inside component */}} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePage;
