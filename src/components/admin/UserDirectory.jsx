import React, { useState, useMemo } from 'react';
import DataTable from '../common/DataTable';
import BanModal from './BanModal';
import { Box, Avatar, Chip, Typography, IconButton, Menu, MenuItem, ListItemIcon } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
const UserDirectory = ({ users, onBanUser, onUnbanUser, onUnlockUser, onImpersonateUser, busyUserId, currentAdminId }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Search filter
      const matchesSearch = !searchQuery || 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const columns = [
    {
      id: 'name',
      label: 'User',
      minWidth: 200,
      render: (row) => (
        <Box className="flex items-center gap-3">
          <Avatar src={row.avatar} alt={row.name}>
            {!row.avatar && row.name.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" className="font-semibold text-content-primary">
              {row.name}
            </Typography>
            <Typography variant="caption" className="text-content-secondary break-all">
              {row.email}
            </Typography>
          </Box>
        </Box>
      )
    },
    {
      id: 'role',
      label: 'Role',
      minWidth: 90,
      render: (row) => {
        const colorMap = { admin: 'secondary', owner: 'success', user: 'default' };
        return (
          <Chip 
            label={row.role} 
            size="small" 
            color={colorMap[row.role] || 'default'} 
            variant="outlined"
            className="capitalize font-semibold text-xs"
          />
        );
      }
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      render: (row) => {
        const getStatusConfig = () => {
          if (row.status === 'banned') return { label: 'Banned', color: 'error' };
          if (row.status === 'locked') return { label: 'Locked', color: 'warning' };
          return { label: 'Active', color: 'success' };
        };
        const config = getStatusConfig();
        
        return (
          <Box>
            <Chip 
              label={config.label} 
              size="small" 
              color={config.color} 
              className="capitalize font-semibold text-xs"
            />
            {row.bannedUntil && row.status === 'banned' && (
              <Typography variant="caption" display="block" className="mt-1 text-content-secondary whitespace-nowrap">
                Until {new Date(row.bannedUntil).toLocaleDateString()}
              </Typography>
            )}
            {row.lockoutUntil && row.status === 'locked' && (
              <Typography variant="caption" display="block" className="mt-1 text-content-secondary whitespace-nowrap">
                Until {new Date(row.lockoutUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
          </Box>
        );
      }
    },
    { id: 'posts', label: 'Posts', align: 'center', minWidth: 80 },
    { 
      id: 'createdAt', 
      label: 'Account Created',
      minWidth: 140,
      nowrap: true,
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 70,
      render: (row) => (
        <IconButton 
          size="small" 
          onClick={(e) => handleMenuOpen(e, row)}
          disabled={busyUserId === row.id}
        >
          <MoreVertIcon className="text-content-secondary" />
        </IconButton>
      )
    }
  ];

  return (
    <Box className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative w-full md:flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background-primary border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
          />
        </div>
        
        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full md:w-auto bg-background-primary border border-border-subtle rounded-xl px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all cursor-pointer min-w-[140px]"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="owner">Food Owner</option>
          <option value="admin">Admin</option>
        </select>
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-auto bg-background-primary border border-border-subtle rounded-xl px-4 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all cursor-pointer min-w-[140px]"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <DataTable 
        title={`User Directory (${filteredUsers.length})`}
        columns={columns}
        data={filteredUsers}
        searchPlaceholder="Search by name or email..."
        hideSearch={true}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            backgroundColor: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--bg-tertiary)'
          }
        }}
      >
        {menuUser?.role !== 'admin' && Number(menuUser?.id) !== Number(currentAdminId) && (
          <MenuItem
            onClick={() => {
              onImpersonateUser(menuUser.id);
              handleMenuClose();
            }}
          >
            <ListItemIcon><VisibilityIcon fontSize="small" /></ListItemIcon>
            View As User
          </MenuItem>
        )}
        {menuUser?.role !== 'admin' && menuUser?.status !== 'banned' && (
          <MenuItem 
            onClick={() => {
              setSelectedUser(menuUser);
              setBanModalOpen(true);
              handleMenuClose();
            }}
            className="text-red-500"
          >
            <ListItemIcon><BlockIcon fontSize="small" className="text-red-500" /></ListItemIcon>
            Ban User
          </MenuItem>
        )}
        {menuUser?.role !== 'admin' && menuUser?.status === 'banned' && (
          <MenuItem 
            onClick={() => {
              onUnbanUser(menuUser.id);
              handleMenuClose();
            }}
            className="text-green-500"
          >
            <ListItemIcon><CheckCircleOutlineIcon fontSize="small" className="text-green-500" /></ListItemIcon>
            Unban User
          </MenuItem>
        )}
        {menuUser?.role !== 'admin' && menuUser?.status === 'locked' && (
          <MenuItem 
            onClick={() => {
              onUnlockUser(menuUser.id);
              handleMenuClose();
            }}
            className="text-amber-500"
          >
            <ListItemIcon><CheckCircleOutlineIcon fontSize="small" className="text-amber-500" /></ListItemIcon>
            Unlock User
          </MenuItem>
        )}
      </Menu>

      {banModalOpen && selectedUser && (
        <BanModal
          userName={selectedUser.name}
          onConfirm={(days, reason) => {
            onBanUser(selectedUser.id, days, reason);
            setBanModalOpen(false);
          }}
          onCancel={() => {
            setBanModalOpen(false);
            setSelectedUser(null);
          }}
        />
      )}
    </Box>
  );
};

export default UserDirectory;
