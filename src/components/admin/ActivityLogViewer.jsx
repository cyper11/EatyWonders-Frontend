import React, { useState, useMemo } from 'react';
import DataTable from '../common/DataTable';
import { Box, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { parseUA } from '../../utils/uaParser';

const ACTION_CONFIG = {
  login: { color: 'success', label: 'Login' },
  register: { color: 'primary', label: 'Register' },
  approval: { color: 'success', label: 'Approval' },
  rejection: { color: 'error', label: 'Rejection' },
  delete: { color: 'error', label: 'Delete' },
  upload: { color: 'secondary', label: 'Upload' },
  ban: { color: 'error', label: 'Ban' },
  unban: { color: 'success', label: 'Unban' },
  webhook: { color: 'info', label: 'Webhook' },
  maintenance: { color: 'warning', label: 'Maintenance' },
  'force-unlock': { color: 'error', label: 'Force Unlock' },
};

// Check if action is negative/failed
const isNegativeAction = (action) => {
  if (!action) return false;
  const negativeKeywords = ['failed', 'locked', 'banned', 'error', 'rejection', 'ban', 'delete'];
  return negativeKeywords.some(keyword => action.toLowerCase().includes(keyword));
};

// Parse browser from user agent
const getBrowserInfo = (userAgent) => {
  const { browser, os } = parseUA(userAgent);
  if (browser === 'Unknown' && os === 'Unknown') return 'Unknown';
  return os !== 'Unknown' ? `${browser} • ${os}` : browser;
};

const ActivityLogViewer = ({ logs, onExport, onRefresh, isLoading }) => {
  // Filter states
  const [userFilter, setUserFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  // Get unique actions for filter dropdown
  const uniqueActions = useMemo(() => {
    const actions = [...new Set(logs.map(log => log.action).filter(Boolean))];
    return actions.sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // User filter
      const matchesUser = !userFilter || 
        log.userEmail?.toLowerCase().includes(userFilter.toLowerCase()) ||
        log.userName?.toLowerCase().includes(userFilter.toLowerCase());
      
      // Role filter
      const matchesRole = roleFilter === 'all' || log.userRole === roleFilter;
      
      // Action filter
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      
      return matchesUser && matchesRole && matchesAction;
    });
  }, [logs, userFilter, roleFilter, actionFilter]);

  const columns = [
    { 
      id: 'timestamp', 
      label: 'Date & Time',
      minWidth: 140,
      nowrap: true,
      render: (row) => {
        const date = new Date(row.timestamp);
        return (
          <Box>
            <div className="font-semibold text-sm text-content-primary whitespace-nowrap">{date.toLocaleDateString()}</div>
            <div className="text-xs text-content-secondary whitespace-nowrap">{date.toLocaleTimeString()}</div>
          </Box>
        );
      }
    },
    { 
      id: 'userEmail', 
      label: 'User',
      minWidth: 180,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-content-primary">
            {row.userName || row.userEmail?.split('@')[0] || 'Unknown User'}
          </span>
          <span className="text-xs text-content-secondary break-all">
            {row.userEmail}
          </span>
        </div>
      )
    },
    { 
      id: 'userRole', 
      label: 'Role',
      minWidth: 90,
      render: (row) => {
        const colorMap = { admin: 'secondary', owner: 'success', user: 'default' };
        return (
          <Chip 
            label={row.userRole || 'User'} 
            size="small" 
            color={colorMap[row.userRole] || 'default'}
            variant="outlined"
            className="capitalize font-semibold text-xs"
          />
        );
      }
    },
    { 
      id: 'action', 
      label: 'Action',
      minWidth: 110,
      render: (row) => {
        const config = ACTION_CONFIG[row.action] || { color: 'default', label: row.action };
        const isNegative = isNegativeAction(row.action) || isNegativeAction(row.description);
        
        return (
          <Chip 
            label={config.label} 
            color={config.color} 
            size="small" 
            variant="outlined"
            className={`capitalize font-semibold text-xs ${isNegative ? 'border-red-500 text-red-500' : ''}`}
            sx={isNegative ? { borderColor: 'error.main', color: 'error.main', fontWeight: 'bold' } : {}}
          />
        );
      }
    },
    { 
      id: 'description', 
      label: 'Description',
      render: (row) => {
        const isNegative = isNegativeAction(row.action) || isNegativeAction(row.description);
        return (
          <span className={`text-sm break-words leading-relaxed block ${isNegative ? 'text-red-500 font-bold' : 'text-content-primary'}`}>
            {row.description}
          </span>
        );
      }
    },
    {
      id: 'browser',
      label: 'Browser/Device',
      minWidth: 140,
      render: (row) => {
        const ua = row.userAgent || row._raw?.user_agent;
        return (
          <span 
            className="text-xs text-content-secondary block break-words"
            title={ua || 'Unknown'}
          >
            {getBrowserInfo(ua)}
          </span>
        );
      }
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Row */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        {/* User Filter */}
        <div className="relative md:w-1/3">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary w-4 h-4" />
          <input
            type="text"
            placeholder="Filter by user..."
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="w-full bg-background-primary border border-border-subtle rounded-xl pl-9 pr-4 py-2 text-sm text-content-primary placeholder:text-content-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all"
          />
        </div>
        
        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full md:w-auto bg-background-primary border border-border-subtle rounded-xl px-4 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="owner">Food Owner</option>
          <option value="admin">Admin</option>
        </select>
        
        {/* Action Filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="w-full md:w-auto bg-background-primary border border-border-subtle rounded-xl px-4 py-2 text-sm text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent transition-all cursor-pointer"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>
              {ACTION_CONFIG[action]?.label || action}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={onExport}
          className="px-4 py-2 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white rounded-lg text-sm font-bold transition-all"
          disabled={!filteredLogs.length}
        >
          Download CSV
        </button>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-background-tertiary text-content-primary hover:bg-background-secondary rounded-lg text-sm font-bold transition-all disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <DataTable 
        title={`System Activity Logs (${filteredLogs.length})`}
        columns={columns}
        data={filteredLogs}
        searchPlaceholder="Search logs by email or action..."
      />
    </div>
  );
};

export default ActivityLogViewer;

