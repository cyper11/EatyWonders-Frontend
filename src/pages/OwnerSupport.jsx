import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import Header from '../components/Header';
import SupportTicketForm from '../components/SupportTicketForm';
import api from '../api/backend';

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Open:        { bgcolor: '#e8f5e9', color: '#1b5e20' },
  'In Progress': { bgcolor: '#fff8e1', color: '#7b5600' },
  Resolved:    { bgcolor: '#e3f2fd', color: '#0d47a1' },
  Closed:      { bgcolor: '#f3e5f5', color: '#4a148c' },
};

function StatusBadge({ status }) {
  const colors = STATUS_COLORS[status] || { bgcolor: '#f5f5f5', color: '#333' };
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        fontWeight: 700,
        borderRadius: '8px',
        fontSize: '0.72rem',
        letterSpacing: '0.03em',
        ...colors,
      }}
    />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ onNew }) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        px: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          bgcolor: 'var(--brand-accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ConfirmationNumberOutlinedIcon sx={{ fontSize: 36, color: 'var(--accent)' }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
        No support tickets yet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
        Submit a ticket whenever you need help with your menu verification, account issues,
        payout questions, or anything else. Our team will respond promptly.
      </Typography>
      <Button
        id="support-empty-new-ticket-btn"
        variant="contained"
        startIcon={<AddCircleOutlineIcon />}
        onClick={onNew}
        sx={{
          mt: 1,
          borderRadius: 2,
          fontWeight: 700,
          px: 3,
          py: 1.2,
          bgcolor: 'var(--accent)',
          color: '#fff',
          '&:hover': { bgcolor: '#6aa83e' },
        }}
      >
        Submit Your First Ticket
      </Button>
    </Box>
  );
}

// ─── Single ticket card ───────────────────────────────────────────────────────
function TicketCard({ ticket }) {
  const created = ticket.created_at
    ? new Date(ticket.created_at).toLocaleString()
    : '—';
  const updated = ticket.updated_at && ticket.updated_at !== ticket.created_at
    ? new Date(ticket.updated_at).toLocaleString()
    : null;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        border: '1px solid var(--border-subtle)',
        bgcolor: 'var(--surface)',
        transition: 'box-shadow 180ms',
        '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.10)' },
      }}
    >
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Top row: ticket # + status */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.04em' }}
            >
              #{ticket.id} · {ticket.category}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, mt: 0.25 }}
            >
              {ticket.subject}
            </Typography>
          </Box>
          <StatusBadge status={ticket.status} />
        </Box>

        {/* Description preview */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 1.5,
          }}
        >
          {ticket.description}
        </Typography>

        {/* Admin notes — shown only when present */}
        {ticket.admin_notes && (
          <Box
            sx={{
              px: 2,
              py: 1.25,
              mb: 1.5,
              borderRadius: 1.5,
              bgcolor: 'var(--brand-accent-soft)',
              border: '1px solid var(--border-brand)',
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: 'var(--accent)', display: 'block', mb: 0.25 }}
            >
              Admin Note
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
              {ticket.admin_notes}
            </Typography>
          </Box>
        )}

        {/* Timestamps */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            Submitted: {created}
          </Typography>
          {updated && (
            <Typography variant="caption" color="text.secondary">
              Last updated: {updated}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function OwnerSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/tickets');
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        setError('You must be logged in to view your tickets.');
      } else {
        setError('Failed to load your support tickets. Please refresh and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Called from the form on successful submission — refreshes list and closes modal
  const handleTicketSubmitted = () => {
    setModalOpen(false);
    loadTickets();
  };

  const openCount = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;

  return (
    <>
      <Header />
      <Box
        sx={{
          pt: { xs: 10, md: 11 },
          pb: 6,
          px: { xs: 2, sm: 3, md: 4 },
          maxWidth: 820,
          mx: 'auto',
        }}
      >
        {/* ── Page header ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: 'var(--brand-accent-soft)',
                border: '1px solid var(--border-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HelpOutlineIcon sx={{ color: 'var(--accent)', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}
              >
                Help &amp; Support
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {loading
                  ? 'Loading your tickets…'
                  : tickets.length === 0
                  ? 'No tickets yet — submit one below.'
                  : openCount > 0
                  ? `${openCount} active ticket${openCount > 1 ? 's' : ''} · ${tickets.length} total`
                  : `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} · all resolved`}
              </Typography>
            </Box>
          </Box>

          {/* Primary CTA */}
          <Button
            id="support-new-ticket-btn"
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setModalOpen(true)}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              px: 2.5,
              py: 1.1,
              flexShrink: 0,
              bgcolor: 'var(--accent)',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(127,191,77,0.30)',
              '&:hover': {
                bgcolor: '#6aa83e',
                boxShadow: '0 6px 18px rgba(127,191,77,0.38)',
              },
            }}
          >
            Submit New Ticket
          </Button>
        </Box>

        <Divider sx={{ mb: 3, borderColor: 'var(--border-subtle)' }} />

        {/* ── Body ── */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={36} sx={{ color: 'var(--accent)' }} />
          </Box>
        ) : error ? (
          <Box
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: '#fdecec',
              border: '1px solid #e7a4a4',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: '#b71c1c', fontWeight: 600 }}>
              {error}
            </Typography>
            <Button size="small" onClick={loadTickets} sx={{ mt: 1.5, fontWeight: 700 }}>
              Retry
            </Button>
          </Box>
        ) : tickets.length === 0 ? (
          <EmptyState onNew={() => setModalOpen(true)} />
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </Box>
        )}
      </Box>

      {/* ── Submit Ticket Modal ── */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: 'var(--bg-primary)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontWeight: 800,
            color: 'var(--text-primary)',
            pb: 1,
          }}
        >
          Submit a New Ticket
          <IconButton
            id="support-modal-close-btn"
            aria-label="close dialog"
            onClick={() => setModalOpen(false)}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: '8px !important', pb: 3, px: { xs: 2, sm: 3 } }}>
          <SupportTicketForm onSuccess={handleTicketSubmitted} />
        </DialogContent>
      </Dialog>
    </>
  );
}



