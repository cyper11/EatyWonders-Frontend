import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Stack } from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import api from '../api/backend';

const UserActivityLogs = ({ userId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/api/users/${userId}/activity`);
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch activity logs:', err);
        setError('Could not load your activity. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchActivity();
  }, [userId]);

  if (loading) return (
    <Box className="flex justify-center py-10">
      <CircularProgress sx={{ color: 'var(--brand-accent)' }} />
    </Box>
  );

  if (error) return (
    <Box className="text-center py-10 text-red-500">
      <Typography>{error}</Typography>
    </Box>
  );

  if (!logs.length) return (
    <Box className="text-center py-10 bg-brand-bg1 rounded-3xl border border-dashed border-brand-bg3">
      <Typography className="text-brand-text-secondary">No activity logs found yet.</Typography>
    </Box>
  );

  const formatRelativeTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHour < 24) return `${diffHour}h ago`;
      if (diffDay === 1) return 'Yesterday';
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateString;
    }
  };

  const getActivityConfig = (type) => {
    switch (type) {
      case 'review':
        return { icon: <StarIcon className="text-yellow-500" />, color: 'bg-yellow-50' };
      case 'like':
        return { icon: <FavoriteIcon className="text-rose-500" />, color: 'bg-rose-50' };
      case 'comment':
        return { icon: <ChatBubbleIcon className="text-sky-500" />, color: 'bg-sky-50' };
      case 'post':
        return { icon: <RestaurantIcon className="text-emerald-500" />, color: 'bg-emerald-50' };
      default:
        return { icon: <StarIcon />, color: 'bg-gray-50' };
    }
  };

  return (
    <Box className="space-y-6">
      {logs.map((log, index) => {
        const config = getActivityConfig(log.activity_type);
        const relativeTime = formatRelativeTime(log.created_at);
        const targetName = log.post_title || log.restaurant_name || 'a post';

        return (
          <Box key={log.id + index} className="relative pl-8">
            {/* Timeline Line */}
            {index !== logs.length - 1 && (
              <Box className="absolute left-4 top-8 bottom-0 w-0.5 bg-brand-bg3 -translate-x-1/2" />
            )}
            
            {/* Icon Bubble */}
            <Box className={`absolute left-0 top-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center border-2 border-white shadow-sm z-10`}>
              {React.cloneElement(config.icon, { sx: { fontSize: 16 } })}
            </Box>

            <Box className="bg-surface p-4 rounded-2xl border border-brand-bg3 shadow-sm hover:shadow-md transition-shadow">
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box className="flex-grow">
                  <Typography variant="body2" className="text-brand-text">
                    {log.activity_type === 'comment' && (
                      <>
                        💬 You commented on <span className="font-bold">"{targetName}"</span>:
                      </>
                    )}
                    {log.activity_type === 'like' && (
                      <>
                        ❤️ You liked <span className="font-bold">"{targetName}"</span>
                      </>
                    )}
                    {log.activity_type === 'review' && (
                      <>
                        ⭐ You rated <span className="font-bold">"{log.restaurant_name || 'an establishment'}"</span>
                      </>
                    )}
                    {log.activity_type === 'post' && (
                      <>
                        🍔 You uploaded a new discovery: <span className="font-bold">"{targetName}"</span>
                      </>
                    )}
                  </Typography>

                  {log.text && (
                    <Typography variant="body2" className="mt-1.5 text-brand-text-secondary italic pl-3 border-l-2 border-brand-bg3">
                      "{log.text}"
                    </Typography>
                  )}

                  {log.rating && (
                    <Box className="flex items-center gap-0.5 mt-1.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} sx={{ fontSize: 14, color: i < log.rating ? '#f59e0b' : '#d1d5db' }} />
                      ))}
                    </Box>
                  )}
                </Box>

                <Typography variant="caption" className="text-brand-text-secondary whitespace-nowrap flex-shrink-0">
                  {relativeTime}
                </Typography>
              </Stack>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default UserActivityLogs;
