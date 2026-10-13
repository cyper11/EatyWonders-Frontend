import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ResponsiveMenu from './ResponsiveMenu';
import api from '../api/backend';

const OwnerMenu = ({ userId, placeId = null }) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(placeId ? String(placeId) : '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data } = await api.get('/api/uploads/my-branches');
        const list = Array.isArray(data?.branches) ? data.branches : [];
        setBranches(list);
        if (!selectedBranchId && list.length > 0) {
          setSelectedBranchId(String(list[0].id));
        }
      } catch (err) {
        console.warn('Failed to fetch branches:', err);
      }
    };
    fetchBranches();
  }, [selectedBranchId]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedBranchId) {
          params.owner_place_id = selectedBranchId;
        } else if (userId) {
          params.owner_id = userId;
        }
        const { data } = await api.get('/api/menu', { params });
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch menu:', err);
        setError('Could not load your menu items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [userId, selectedBranchId]);

  const handleCreatePost = () => {
    navigate('/owner/upload');
  };

  return (
    <Box className="w-full space-y-6">
      {/* Helper Banner: Post-Driven Menu Education */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border border-emerald-500/20 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-primary)]">
            <span className="text-lg">✨</span> Post-Driven Menu
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed m-0">
            Want to update your menu? Create a new post showcasing your dish! All items attached to your posts automatically populate your live establishment menu.
          </p>
        </div>
        <button
          onClick={handleCreatePost}
          className="flex-shrink-0 px-4 py-2.5 bg-[var(--brand-accent)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-sm cursor-pointer border-0 inline-flex items-center gap-1.5"
        >
          <span>📸</span> Create Post
        </button>
      </div>

      {/* Branch Selector if multiple branches */}
      {branches.length > 1 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-xs">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] whitespace-nowrap">
            Branch Menu:
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]/40 cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.address || 'Cavite Branch'}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <Box className="flex justify-center py-12">
          <CircularProgress sx={{ color: 'var(--brand-accent)' }} />
        </Box>
      ) : error ? (
        <Box className="text-center py-10 text-red-500">
          <Typography>{error}</Typography>
        </Box>
      ) : (
        <ResponsiveMenu
          items={menuItems}
          onManageMenu={handleCreatePost}
        />
      )}
    </Box>
  );
};

export default OwnerMenu;
