import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import api from '../api/backend';

const TICKET_CATEGORIES = [
  'Menu Verification',
  'Account Issue',
  'Billing/Payouts',
  'Bug Report',
  'Other',
];

const INITIAL_FORM = { subject: '', category: '', description: '' };

/**
 * SupportTicketForm
 * Allows business owners to submit a support ticket directly to the Super Admin.
 * Submits a POST request to /api/tickets using the shared axios instance (auth + cookies).
 */
const SupportTicketForm = ({ onSuccess } = {}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear stale feedback on any change
    if (successMsg) setSuccessMsg('');
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const { subject, category, description } = form;

    // Client-side validation
    if (!subject.trim() || !category || !description.trim()) {
      setErrorMsg('All fields are required. Please fill in Subject, Category, and Description.');
      return;
    }
    if (subject.trim().length < 5) {
      setErrorMsg('Subject must be at least 5 characters.');
      return;
    }
    if (description.trim().length < 20) {
      setErrorMsg('Description must be at least 20 characters so we can understand your issue.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/api/tickets', {
        subject: subject.trim(),
        category,
        description: description.trim(),
      });

      setSuccessMsg(
        `Ticket #${data?.ticket?.id || ''} submitted successfully! Our team will review it shortly.`
      );
      setForm(INITIAL_FORM);
      // Notify parent (e.g. modal) of success so it can close / refresh
      if (typeof onSuccess === 'function') {
        // Small delay so the user briefly sees the success message
        setTimeout(onSuccess, 1400);
      }
    } catch (err) {
      const serverMsg = err?.response?.data?.error;
      const status = err?.response?.status;

      if (status === 401) {
        setErrorMsg('You must be logged in to submit a ticket. Please log in and try again.');
      } else if (status === 403) {
        setErrorMsg('Access denied. Only business owners can submit support tickets.');
      } else if (status === 400) {
        setErrorMsg(serverMsg || 'Please fill in all required fields.');
      } else if (status === 429) {
        setErrorMsg('Too many requests. Please wait a moment and try again.');
      } else {
        setErrorMsg(
          serverMsg ||
            'Something went wrong while submitting your ticket. Please try again later.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      elevation={3}
      sx={{
        maxWidth: 640,
        width: '100%',
        mx: 'auto',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'var(--border-subtle)',
        bgcolor: 'var(--surface)',
      }}
    >
      <CardHeader
        avatar={
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'var(--primary-main, #2f5d33)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SupportAgentIcon sx={{ color: '#fff', fontSize: 24 }} />
          </Box>
        }
        title={
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Contact Support
          </Typography>
        }
        subheader={
          <Typography variant="body2" color="text.secondary">
            Submit a ticket and our team will get back to you as soon as possible.
          </Typography>
        }
        sx={{ pb: 0, pt: 2.5, px: 3 }}
      />

      <CardContent sx={{ px: 3, pt: 2, pb: 3 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{ display: 'grid', gap: 2.5 }}
        >
          {/* Subject */}
          <TextField
            id="ticket-subject"
            name="subject"
            label="Subject"
            placeholder="Brief summary of your issue"
            value={form.subject}
            onChange={handleChange}
            disabled={submitting}
            required
            fullWidth
            inputProps={{ maxLength: 200 }}
            helperText={`${form.subject.length}/200`}
          />

          {/* Category */}
          <FormControl fullWidth required>
            <InputLabel id="ticket-category-label">Category</InputLabel>
            <Select
              labelId="ticket-category-label"
              id="ticket-category"
              name="category"
              value={form.category}
              label="Category"
              onChange={handleChange}
              disabled={submitting}
            >
              {TICKET_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            id="ticket-description"
            name="description"
            label="Description"
            placeholder="Describe your issue in detail. Include any relevant steps or error messages."
            value={form.description}
            onChange={handleChange}
            disabled={submitting}
            required
            fullWidth
            multiline
            minRows={5}
            maxRows={12}
            inputProps={{ maxLength: 5000 }}
            helperText={`${form.description.length}/5000`}
          />

          {/* Success / Error feedback */}
          {successMsg && (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              {successMsg}
            </Alert>
          )}
          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* Submit button */}
          <Button
            id="ticket-submit-btn"
            type="submit"
            variant="contained"
            disabled={submitting}
            size="large"
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              py: 1.4,
              bgcolor: 'var(--primary-main, #2f5d33)',
              '&:hover': { bgcolor: 'var(--primary-dark, #1e3f22)' },
            }}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {submitting ? 'Submitting…' : 'Submit Ticket'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SupportTicketForm;
