import React, { useState, useCallback } from 'react';
import DataTable from '../common/DataTable';
import { Box, Chip, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

const AuditLogs = ({ logs, onRefresh, onExport, isLoading, totalCount, currentPage, totalPages, onPageChange }) => {
  const [actionFilter, setActionFilter] = useState('');

  const actionColors = {
    APPROVE: 'success',
    REJECT: 'error',
    BAN: 'warning',
    UNBAN: 'info',
    DELETE: 'default',
  };

  const actionLabels = {
    APPROVE: 'Approved',
    REJECT: 'Rejected',
    BAN: 'Banned',
    UNBAN: 'Unbanned',
    DELETE: 'Deleted',
  };

  const filteredLogs = actionFilter
    ? logs.filter(log => log.action_type === actionFilter)
    : logs;

  const columns = [
    {
      id: 'timestamp',
      label: 'Date & Time',
      minWidth: 140,
      nowrap: true,
      render: (row) => (
        <Box>
          <div className="font-semibold text-sm text-content-primary whitespace-nowrap">
            {new Date(row.created_at).toLocaleDateString()}
          </div>
          <div className="text-xs text-content-secondary whitespace-nowrap">
            {new Date(row.created_at).toLocaleTimeString()}
          </div>
        </Box>
      )
    },
    {
      id: 'action',
      label: 'Action',
      minWidth: 110,
      render: (row) => {
        const details = row.details || {};
        const isBlocked = String(details.action || '').toLowerCase().includes('blocked') || 
                          String(details.description || '').toLowerCase().includes('vulgarity') ||
                          row.action_type === 'COMMENT_BLOCKED_VULGARITY';
        const label = isBlocked ? 'Blocked' : (actionLabels[row.action_type] || row.action_type);
        const color = isBlocked ? 'error' : (actionColors[row.action_type] || 'default');
        return (
          <Chip
            label={label}
            size="small"
            color={color}
            variant="outlined"
            className="font-bold text-xs capitalize"
          />
        );
      }
    },
    {
      id: 'admin',
      label: 'Admin',
      minWidth: 160,
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-content-primary">
            {row.admin_name || 'Admin'}
          </span>
          <span className="text-xs text-content-secondary break-all">
            {row.admin_email || '—'}
          </span>
        </div>
      )
    },
    {
      id: 'target',
      label: 'Target',
      minWidth: 160,
      render: (row) => {
        if (row.target_application_id) {
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-content-primary">
                {row.target_application_name || 'Application'}
              </span>
              <span className="text-xs text-content-secondary">
                App #{row.target_application_id}
              </span>
            </div>
          );
        }
        if (row.target_user_id) {
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-content-primary">
                {row.target_user_name || 'User'}
              </span>
              <span className="text-xs text-content-secondary break-all">
                {row.target_user_email || `ID: ${row.target_user_id}`}
              </span>
            </div>
          );
        }
        return <span className="text-sm text-content-secondary">—</span>;
      }
    },
    {
      id: 'details',
      label: 'Details',
      render: (row) => {
        const details = row.details || {};
        let detailText = '';

        switch (row.action_type) {
          case 'APPROVE':
            detailText = `Approved ${details.restaurantName || 'restaurant'} for ${details.applicantName || 'applicant'}`;
            break;
          case 'REJECT':
            detailText = details.rejectReason || `Rejected ${details.restaurantName || 'restaurant'}`;
            break;
          case 'BAN':
            detailText = `Banned ${details.userName || 'user'} for ${details.days} days: ${details.reason}`;
            break;
          case 'UNBAN':
            detailText = `Unbanned ${details.userName || 'user'}`;
            break;
          case 'DELETE':
            detailText = details.description || 'Deleted content';
            if (details.comment_preview) {
              detailText += ` [Comment: "${details.comment_preview}"]`;
            }
            break;
          default:
            detailText = details.description || JSON.stringify(details).slice(0, 200);
        }

        return (
          <div className="text-sm text-content-primary break-words leading-relaxed">
            {detailText}
          </div>
        );
      }
    }
  ];

  const exportToCSV = useCallback(() => {
    if (!filteredLogs.length) return;

    const headers = ['Date', 'Time', 'Action', 'Admin', 'Admin Email', 'Target Type', 'Target', 'Details'];
    const rows = filteredLogs.map(log => {
      const details = log.details || {};
      let detailStr = '';

      switch (log.action_type) {
        case 'APPROVE':
          detailStr = `Approved ${details.restaurantName || 'restaurant'}`;
          break;
        case 'REJECT':
          detailStr = details.rejectReason || `Rejected ${details.restaurantName || 'restaurant'}`;
          break;
        case 'BAN':
          detailStr = `Banned for ${details.days} days: ${details.reason}`;
          break;
        case 'UNBAN':
          detailStr = 'Unbanned user';
          break;
        default:
          detailStr = details.description || JSON.stringify(details);
      }

      const targetType = log.target_application_id ? 'Application' : log.target_user_id ? 'User' : '—';
      const target = log.target_application_name || log.target_user_name || log.target_user_email || '—';

      return [
        new Date(log.created_at).toLocaleDateString(),
        new Date(log.created_at).toLocaleTimeString(),
        log.action_type,
        log.admin_name || 'Unknown',
        log.admin_email || '',
        targetType,
        target,
        detailStr
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredLogs]);

  return (
    <Box className="space-y-4">
      {/* Filters and Actions */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'between', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, flexGrow: 1, width: { xs: '100%', sm: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
            <InputLabel id="action-filter-label">Filter by Action</InputLabel>
            <Select
              labelId="action-filter-label"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              label="Filter by Action"
              sx={{ borderRadius: 2, bgcolor: 'var(--surface-paper)' }}
            >
              <MenuItem value="">All Actions</MenuItem>
              <MenuItem value="APPROVE">Approve</MenuItem>
              <MenuItem value="REJECT">Reject</MenuItem>
              <MenuItem value="BAN">Ban</MenuItem>
              <MenuItem value="UNBAN">Unban</MenuItem>
              <MenuItem value="DELETE">Delete</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="body2" sx={{ color: 'var(--surface-secondary)' }}>
            Showing {filteredLogs.length} entries
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={onRefresh} disabled={isLoading} size="small" sx={{ bgcolor: 'var(--surface-paper)', border: '1px solid var(--surface-border)' }}>
              <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export to CSV">
            <IconButton onClick={exportToCSV} disabled={!filteredLogs.length} size="small" sx={{ bgcolor: 'var(--surface-paper)', border: '1px solid var(--surface-border)' }}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        title="Compliance Audit Logs"
        columns={columns}
        data={filteredLogs}
        searchPlaceholder="Search audit logs..."
        getRowClassName={(row) => {
          const details = row.details || {};
          const isBlocked = String(details.action || '').toLowerCase().includes('blocked') || 
                            String(details.description || '').toLowerCase().includes('vulgarity') ||
                            row.action_type === 'COMMENT_BLOCKED_VULGARITY';
          if (isBlocked) {
            return 'admin-row-blocked';
          }
          return '';
        }}
      />
    </Box>
  );
};

export default AuditLogs;
