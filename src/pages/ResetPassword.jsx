import React, { useMemo, useState } from 'react';
import api from '../api/backend';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './ResetPassword.css';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import PasswordChecklist from '../components/PasswordChecklist';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AuthShell from '../components/AuthShell';

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
    <AuthShell
      title="Set a new password"
      titleId="reset-title"
      subtitle={<p className="m-0">Choose a strong password you haven't used before.</p>}
    >
      <div aria-live="polite">
        {error && <div className="alert-error animate-fade-in-up mb-5" role="alert"><span className="font-semibold">{error}</span></div>}
        {message && (
          <div className="alert-success animate-fade-in-up mb-5" role="status">
            <span className="font-semibold">{message}</span>
          </div>
        )}
      </div>

      {isInvalidLink ? (
        <div className="text-center py-6">
          <p className="text-content-secondary text-lg mb-6">This reset link is invalid or has expired.</p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-full bg-brand-accent text-on-accent font-bold no-underline hover:bg-brand-strong transition-colors"
          >
            Request a new reset link
          </Link>
        </div>
      ) : (
        <form key="reset-password-form" className="flex flex-col gap-5" onSubmit={submit} aria-busy={loading}>
          <div className="space-y-3">
            <Input
              id="new-password"
              label="New password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              icon={LockOutlinedIcon}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || !!message}
              rightElement={
                <button
                  type="button"
                  className="w-10 h-10 grid place-items-center rounded-full text-content-secondary hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </button>
              }
            />
            <PasswordStrengthIndicator password={password} showErrors={false} />
            <PasswordChecklist password={password} />
          </div>

          <Input
            id="confirm-password"
            label="Confirm new password"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Type it again"
            icon={ShieldOutlinedIcon}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={loading || !!message}
            error={confirm && password !== confirm ? 'Passwords do not match' : ''}
            rightElement={
              <button
                type="button"
                className="w-10 h-10 grid place-items-center rounded-full text-content-secondary hover:text-brand-accent hover:bg-brand-accent/10 transition-colors"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                aria-pressed={showConfirm}
              >
                {showConfirm ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
              </button>
            }
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading || !!message || password !== confirm || password.length < 8}
          >
            {loading ? 'Updating…' : 'Update password'}
            {!loading && <ArrowForwardIcon fontSize="small" aria-hidden="true" />}
          </Button>
        </form>
      )}

      <p className="mt-8 pt-6 border-t border-subtle text-center">
        <Link to="/login" replace className="text-brand-accent font-bold no-underline hover:underline underline-offset-4">
          Back to log in
        </Link>
      </p>
    </AuthShell>
  );
};

export default ResetPassword;
