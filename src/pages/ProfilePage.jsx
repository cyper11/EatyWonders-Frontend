import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
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
      <Layout>
        <Box className="flex items-center justify-center min-h-[60vh]">
          <CircularProgress sx={{ color: 'var(--brand-accent)' }} />
        </Box>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <Box className="max-w-md mx-auto text-center py-20 px-6">
          <Box className="bg-white p-10 rounded-[40px] border border-brand-bg3 shadow-xl">
            <Typography variant="h5" className="font-black text-brand-text mb-4">Access Denied</Typography>
            <Typography className="text-brand-text-secondary mb-8">Please log in to view your profile and manage your activity.</Typography>
            <button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-brand-accent text-white font-black py-4 rounded-2xl hover:scale-[1.02] transition-transform"
            >
              Log In Now
            </button>
          </Box>
        </Box>
      </Layout>
    );
  }

  const avatarSrc = user.profile_url ? (user.profile_url.startsWith('http') ? user.profile_url : `${API_BASE_URL}${user.profile_url}`) : undefined;

  return (
    <Layout>
      <Container maxWidth="lg" className="py-10">
        {/* Profile Header */}
        <Box className="bg-white rounded-[32px] p-8 mb-10 border border-brand-bg3 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <Box className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-accent via-rose-400 to-amber-400" />
          
          <Avatar 
            src={avatarSrc} 
            sx={{ width: 140, height: 140, border: '6px solid var(--brand-bg1)' }}
            className="shadow-xl"
          >
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          
          <Box className="text-center md:text-left flex-grow">
            <Box className="flex flex-wrap justify-center md:justify-start gap-3 items-center mb-1">
              <Typography variant="h4" className="font-black text-brand-text">
                {user.name}
              </Typography>
              <Box className="px-4 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-accent/20">
                {user.role}
              </Box>
              
              {/* Social Icons */}
              <Box className="flex items-center gap-2 ml-2">
                {user.facebook_url && (
                  <a href={user.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:scale-110 transition-transform">
                    <FacebookIcon className="w-5 h-5" />
                  </a>
                )}
                {user.instagram_url && (
                  <a href={user.instagram_url} target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:scale-110 transition-transform">
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
                <Typography variant="caption" className="text-brand-text-secondary uppercase font-bold tracking-tighter">Member Since</Typography>
                <Typography variant="body2" className="font-black text-brand-text">
                  {new Date(user.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Typography>
              </Box>

              {user.role === 'owner' && (
                <button 
                  onClick={() => setShowSocialsModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-bg1 text-brand-text rounded-xl text-xs font-bold border border-brand-bg3 hover:bg-brand-bg2 transition-colors"
                >
                  <EditIcon sx={{ fontSize: 14 }} />
                  Edit Socials
                </button>
              )}
            </Box>
          </Box>
          
          <Box className="hidden lg:block absolute -right-10 -bottom-10 opacity-[0.05]">
            <Avatar sx={{ width: 200, height: 200 }} src={avatarSrc} />
          </Box>
        </Box>

        {/* Level & XP Progress Card */}
        {levelData && (
          <Box className="bg-white rounded-[32px] p-8 mb-10 border border-brand-bg3 shadow-sm relative overflow-hidden">
            <Box className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-brand-accent to-rose-500 animate-pulse" />
            <Box className="flex flex-col lg:flex-row gap-8 items-stretch">
              {/* XP progress details */}
              <Box className="flex-grow flex flex-col justify-between">
                <Box className="mb-4">
                  <Box className="flex items-center gap-3 mb-2 flex-wrap">
                    <Typography variant="h6" className="font-black text-brand-text">
                      Rank: {levelData.rank}
                    </Typography>
                    <Box className={`px-4 py-1 rounded-full text-xs font-black text-white ${
                      levelData.level === 3 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                      levelData.level === 2 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                      'bg-gradient-to-r from-rose-500 to-rose-600'
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
                  <Box className="w-full bg-brand-bg1 h-5 rounded-full overflow-hidden border border-brand-bg3 p-0.5 shadow-inner">
                    <Box 
                      className="h-full rounded-full bg-gradient-to-r from-brand-accent to-amber-400 transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, Math.max(5, levelData.progress))}%` }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* XP Checklist */}
              {levelData.checklist && levelData.checklist.length > 0 && (
                <Box className="lg:w-96 bg-brand-bg1/60 p-6 rounded-2xl border border-brand-bg3 flex flex-col justify-center shadow-sm">
                  <Typography className="font-black text-[10px] text-brand-text uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span className="text-amber-500">⚡</span> Earn More XP
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
        <Box className="mb-10 bg-brand-bg1/50 p-2 rounded-3xl border border-brand-bg3/50">
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{
              '& .MuiTabs-indicator': { backgroundColor: 'var(--brand-accent)', height: '100%', borderRadius: '20px', opacity: 0.1, zIndex: 0 },
              '& .MuiTab-root': { 
                fontWeight: 800, 
                textTransform: 'none', 
                fontSize: '1rem', 
                color: 'var(--brand-text-secondary)',
                zIndex: 1,
                minHeight: '56px',
                borderRadius: '20px',
                transition: 'all 0.2s ease',
              },
              '& .Mui-selected': { color: 'var(--brand-accent) !important', transform: 'scale(1.02)' }
            }}
          >
            <Tab key="posts" label="My Posts" value="posts" />
            {user.role === 'owner' && <Tab key="menu" label="Establishment Menu" value="menu" />}
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
        PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}
      >
        <DialogTitle className="flex justify-between items-center">
          <Typography variant="h6" className="font-black">Business Socials</Typography>
          <IconButton onClick={() => setShowSocialsModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <EditSocialsModal 
            onClose={() => setShowSocialsModal(false)} 
            onSaved={() => {/* AuthContext update handled inside component */}} 
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ProfilePage;
