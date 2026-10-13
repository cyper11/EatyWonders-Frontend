import React, { useMemo, useState } from 'react';
import api from '../api/backend';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './ResetPassword.css';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import PasswordChecklist from '../components/PasswordChecklist';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ThemeToggleButton from '../components/ui/ThemeToggleButton';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword = () => {
  const q = useQuery();
  const email = q.get('email') || '';
  const token = q.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isInvalidLink = !email || !token;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (isInvalidLink) {
      setError('Invalid or missing reset link.');
      return;
    }
    
    // Strict 8-character validation as requested
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, token, password });
      setMessage('Password updated successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page reset-page">
      <div className="auth-theme-wrapper">
        <ThemeToggleButton />
      </div>
      
      <section className="auth-card reset-card" aria-labelledby="reset-title">
        <div className="reset-hero" aria-hidden="true">
          <div className="reset-hero-icon">
            <VpnKeyOutlinedIcon style={{ fontSize: '48px' }} />
          </div>
          <div className="reset-lock-badge">
            <LockOutlinedIcon style={{ fontSize: '32px' }} />
          </div>
        </div>

        <header className="auth-header reset-header">
          <h1 id="reset-title">Reset Password</h1>
          <p className="text-content-secondary">Create a strong, new password for your account.</p>
        </header>

        <div className="auth-divider reset-divider" aria-hidden="true">
          <span />
          <LocalFloristIcon />
          <span />
        </div>

        {error && <div className="auth-alert auth-alert-error reset-alert" role="alert">{error}</div>}
        {message && <div className="auth-alert reset-alert" style={{ color: '#25652b', background: '#eef8e8', border: '1px solid #cce6c2' }} role="status">{message}</div>}

        {isInvalidLink ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <p style={{ color: 'var(--auth-muted)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              This reset link is invalid or has expired.
            </p>
            <Link to="/forgot-password" style={{ color: 'var(--auth-green)', fontWeight: '700' }}>
              Request a new reset link
            </Link>
          </div>
        ) : (
          <form key="reset-password-form" className="reset-form space-y-4" onSubmit={submit}>
            <div className="space-y-4">
              <Input
                id="new-password"
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 8 characters"
                icon={LockOutlinedIcon}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading || !!message}
                rightElement={
                  <button
                    type="button"
                    className="p-2 text-content-secondary hover:text-brand-accent transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </button>
                }
              />
              <PasswordStrengthIndicator password={password} showErrors={false} />
              <PasswordChecklist password={password} />
            </div>

            <Input
              id="confirm-password"
              label="Confirm New Password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your new password"
              icon={ShieldOutlinedIcon}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading || !!message}
              rightElement={
                <button
                  type="button"
                  className="p-2 text-content-secondary hover:text-brand-accent transition-colors"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </button>
              }
            />

            <Button 
              type="submit" 
              size="lg" 
              className="w-full mt-4" 
              disabled={loading || !!message || password !== confirm || password.length < 8}
            >
              <span>{loading ? 'Updating...' : 'Update Password'}</span>
              <ArrowForwardIcon className="ml-2" aria-hidden="true" />
            </Button>
          </form>
        )}

        <div className="reset-footer">
          <Link to="/login" replace>
            <ArrowBackIcon aria-hidden="true" />
            <span>Back to Login</span>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
