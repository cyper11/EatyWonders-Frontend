import React, { useState } from 'react';
import './ForgotPassword.css';
import api from '../api/backend';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../components/ui';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import SendIcon from '@mui/icons-material/Send';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import ThemeToggleButton from '../components/ui/ThemeToggleButton';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');
  const [error, setError] = useState('');

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

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
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-8 bg-background-primary">
      <div className="auth-theme-wrapper">
        <ThemeToggleButton />
      </div>
      
      <Card className="w-full max-w-md p-6 sm:p-10 shadow-2xl flex flex-col bg-surface relative z-10" aria-labelledby="forgot-title">
        <div className="flex flex-col gap-4">
          <button 
            type="button" 
            className="absolute top-4 left-4 sm:top-6 sm:left-6 w-10 h-10 flex items-center justify-center rounded-full text-content-secondary hover:text-content-primary hover:bg-background-secondary transition-all z-10"
            onClick={goBack}
            aria-label="Go back"
          >
            <ArrowBackIcon className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent">
              <RestaurantIcon style={{ fontSize: '32px' }} />
            </div>
            <h1 id="forgot-title" className="text-3xl font-bold text-content-primary">Reset Password</h1>
            <p className="text-content-secondary mt-2">Enter your email to receive a reset link</p>
          </div>

          {/* Status messages */}
          {error && (
            <div className="alert-error animate-fade-in-up" role="alert">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}
          {message && (
            <div className="alert-success animate-fade-in-up" role="status">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{message}</span>
            </div>
          )}
          {devLink && (
            <div className="mb-4 p-2 text-sm">
              <small>Dev link: <a href={devLink} target="_blank" rel="noreferrer" className="text-brand-accent underline">Open reset</a></small>
            </div>
          )}

        <form key="forgot-password-form" className="w-full flex flex-col gap-4" onSubmit={onSubmit}>
          <Input
            id="forgot-email"
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={EmailOutlinedIcon}
          />

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            <SendIcon aria-hidden="true" />
            <span>{loading ? 'Sending…' : 'Send Reset Link'}</span>
            <ArrowForwardIcon className="ml-2" aria-hidden="true" />
          </Button>
        </form>

        {/* Security note */}
        <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-brand-accent/5 border border-brand-accent/10">
          <ShieldOutlinedIcon className="text-brand-accent" aria-hidden="true" />
          <p className="text-sm text-content-secondary">
            For your security, this reset link is valid for <strong className="text-content-primary">1 hour</strong> only.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Link to="/login" replace className="text-content-secondary hover:text-brand-accent transition-colors">
            Back to Login
          </Link>
        </div>

        </div>
      </Card>
    </main>
  );
};

export default ForgotPassword;

