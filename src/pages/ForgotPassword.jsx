import React, { useState } from 'react';
import './ForgotPassword.css';
import api from '../api/backend';
import { Link } from 'react-router-dom';
import { Button, Input } from '../components/ui';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import AuthShell from '../components/AuthShell';
import useDocumentTitle from '../hooks/useDocumentTitle';

const ForgotPassword = () => {
  useDocumentTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDevLink('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage('If an account exists, a reset link has been sent.');
      if (data?.dev && data?.link) setDevLink(data.link);
    } catch (err) {
      setError(err?.response?.data?.error || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      titleId="forgot-title"
      subtitle={<p className="m-0">Enter the email you signed up with and we'll send you a reset link.</p>}
    >
      <div aria-live="polite">
        {error && (
          <div className="alert-error animate-fade-in-up mb-5" role="alert">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}
        {message && (
          <div className="alert-success animate-fade-in-up mb-5" role="status">
            <MarkEmailReadOutlinedIcon className="flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold m-0">Check your inbox</p>
              <p className="text-sm m-0">{message}</p>
            </div>
          </div>
        )}
        {devLink && (
          <p className="mb-5 text-sm text-content-secondary">
            Dev link: <a href={devLink} target="_blank" rel="noreferrer" className="text-brand-accent underline">Open reset</a>
          </p>
        )}
      </div>

      <form key="forgot-password-form" className="w-full flex flex-col gap-5" onSubmit={onSubmit} aria-busy={loading}>
        <Input
          id="forgot-email"
          label="Email address"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={EmailOutlinedIcon}
        />

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading && <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" aria-hidden="true" />}
          {loading ? 'Sending…' : message ? 'Send again' : 'Send reset link'}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-3 p-4 rounded-card bg-background-secondary">
        <ShieldOutlinedIcon className="text-brand-accent shrink-0" fontSize="small" aria-hidden="true" />
        <p className="text-sm text-content-secondary m-0">
          For your security, the reset link is valid for <strong className="text-content-primary">1 hour</strong> only.
        </p>
      </div>

      <p className="mt-8 pt-6 border-t border-subtle text-center text-content-secondary">
        Remembered it?{' '}
        <Link to="/login" replace className="text-brand-accent font-bold no-underline hover:underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
};

export default ForgotPassword;
