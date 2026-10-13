import React, { useState } from 'react';
import DataTable from '../common/DataTable';
import RejectionModal from './RejectionModal';
import DocumentsModal from './DocumentsModal';
import { Box, Typography, Chip, Button, IconButton, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import DescriptionIcon from '@mui/icons-material/Description';

const formatApprovalDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const ApplicationReview = ({ applications, onApprove, onReject, busyApplicationId }) => {
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [documentsModalOpen, setDocumentsModalOpen] = useState(false);

  const columns = [
    {
      id: 'name',
      label: 'Restaurant',
      minWidth: 200,
      render: (row) => (
        <Box>
          <Typography variant="subtitle2" className="font-semibold text-content-primary">
            {row.name}
          </Typography>
          <Typography variant="caption" className="text-content-secondary break-all">
            {row.address}
          </Typography>
        </Box>
      )
    },
    {
      id: 'applicantName',
      label: 'Applicant',
      minWidth: 180,
      render: (row) => (
        <Box>
          <Typography variant="body2" className="font-semibold text-content-primary">
            {row.applicantName}
          </Typography>
          <Typography variant="caption" className="text-content-secondary break-all">
            {row.applicantEmail}
          </Typography>
        </Box>
      )
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 130,
      render: (row) => {
        const colorMap = { approved: 'success', rejected: 'error', pending: 'warning' };
        return (
          <Box>
            <Chip 
              label={row.status} 
              size="small" 
              color={colorMap[row.status] || 'default'} 
              className="capitalize font-semibold text-xs"
            />
            {row.status?.toLowerCase() === 'approved' && formatApprovalDate(row.approvedAt || row.updatedAt || row.createdAt) && (
              <span className="text-xs text-content-secondary mt-1 block whitespace-nowrap">
                Approved: {formatApprovalDate(row.approvedAt || row.updatedAt || row.createdAt)}
              </span>
            )}
          </Box>
        );
      }
    },
    {
      id: 'documents',
      label: 'Documents',
      align: 'center',
      minWidth: 120,
      render: (row) => (
        <Button 
          size="small" 
          startIcon={<DescriptionIcon />}
          onClick={() => {
            setSelectedApp(row);
            setDocumentsModalOpen(true);
          }}
          className="text-brand-accent font-bold hover:bg-brand-accent/10 whitespace-nowrap"
        >
          View Docs
        </Button>
      )
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 120,
      render: (row) => (
        row.status === 'pending' && (
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <IconButton 
              size="small" 
              color="error" 
              onClick={() => {
                setSelectedApp(row);
                setRejectionModalOpen(true);
              }}
              disabled={busyApplicationId === row.id}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color="success" 
              onClick={() => onApprove(row.id)}
              disabled={busyApplicationId === row.id}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Stack>
        )
      )
    }
  ];

  return (
    <Box className="space-y-4">
      <DataTable 
        title="Owner Applications"
        columns={columns}
        data={applications}
        searchPlaceholder="Search by restaurant or email..."
      />

      {rejectionModalOpen && selectedApp && (
        <RejectionModal
          restaurantName={selectedApp.name}
          applicantName={selectedApp.applicantName}
          onConfirm={(reason) => {
            onReject(selectedApp.id, reason);
            setRejectionModalOpen(false);
          }}
          onCancel={() => {
            setRejectionModalOpen(false);
            setSelectedApp(null);
          }}
        />
      )}

      {documentsModalOpen && selectedApp && (
        <DocumentsModal
          app={selectedApp}
          onCancel={() => {
            setDocumentsModalOpen(false);
            setSelectedApp(null);
          }}
        />
      )}
    </Box>
  );
};

export default ApplicationReview;
