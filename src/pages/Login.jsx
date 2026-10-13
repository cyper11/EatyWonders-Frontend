import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Login.css';
import api from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { toast } from 'react-toastify';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LockClockIcon from '@mui/icons-material/LockClock';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

import AuthShell from '../components/AuthShell';
import { Dialog } from '@mui/material';
import useDocumentTitle from "../hooks/useDocumentTitle";

const Login = () => {
  useDocumentTitle('Login');
  const navigate = useNavigate();
  const { login } = useAuth();
  const turnstileSiteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  const isTurnstileEnabled = Boolean(turnstileSiteKey);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileRef = useRef(null);
  const widgetId = useRef(null);
  const pendingSubmit = useRef(false);
  const isResetting = useRef(false);

  // SANITIZATION: Prevent postMessage origin mismatch by explicitly removing
  // the widget on unmount to kill any 'ghost' listeners.
  useEffect(() => {
    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          console.log('[Login] Cleaning up Turnstile widget:', widgetId.current);
          window.turnstile.remove(widgetId.current);
        } catch (e) {
          console.warn('[Login] Turnstile cleanup failed:', e);
        }
      }
    };
  }, []);

  // Countdown timer for account lockout
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked, lockoutSeconds]);

  const handleFetchLogin = useCallback(async (token) => {
    setLoading(true);
    setError('');

    try {
      const isDevelopment = process.env.REACT_APP_ENV === 'development';

      console.log('[Login] Sending Turnstile token:', token ? 'Token present' : 'Token MISSING');

      const loginPayload = {
        email,
        password,
        ...(isTurnstileEnabled && (isDevelopment || token) ? { turnstileToken: token || '' } : {}),
      };
      console.log('[Debug API BaseURL]:', api.defaults.baseURL);
      const { data } = await api.post('/auth/login', loginPayload);
      login(null, data.user);
      setIsLocked(false);

      setTimeout(() => {
        if (data.user.role === 'admin') window.location.replace("https://admin.eatywonders.com");
        else if (data.user.role === 'owner') navigate('/owner-page');
        else navigate('/user-page');
      }, 100);
    } catch (err) {
      const errorData = err?.response?.data;
      const errorCode = errorData?.code;

      if (turnstileRef.current && !isResetting.current) {
        isResetting.current = true;
        turnstileRef.current.reset();
        setTurnstileToken('');
        setTimeout(() => { isResetting.current = false; }, 500);
      }

      switch (errorCode) {
        case 'ACCOUNT_LOCKED':
          setIsLocked(true);
          const minutes = errorData?.minutes || 15;
          setLockoutMinutes(minutes);
          setLockoutSeconds(minutes * 60);
          setAttemptsRemaining(0);
          toast.error(`Account locked due to too many failed attempts. Try again in ${minutes} minutes.`);
          break;
        case 'EMAIL_NOT_VERIFIED':
          setError('Email Not Verified');
          toast.error('Please verify your email address before logging in.');
          break;
        case 'INVALID_CREDENTIALS':
          setError('Invalid Credentials');
          toast.error('The email or password you entered is incorrect.');
          break;
        default:
          const msg = errorData?.error || errorData?.message || 'Login failed. Please try again.';
          setError(msg);
          toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [email, password, isTurnstileEnabled, login, navigate]);

  const onVerify = useCallback((token) => {
    setTurnstileToken(token);
    if (pendingSubmit.current) {
      pendingSubmit.current = false;
      handleFetchLogin(token);
    }
  }, [handleFetchLogin]);

  const onError = useCallback((turnstileError) => {
    console.warn('[Login] Turnstile error:', turnstileError);
    setTurnstileToken('');
    if (turnstileRef.current && !isResetting.current) {
      isResetting.current = true;
      turnstileRef.current.reset();
      setTimeout(() => { isResetting.current = false; }, 500);
    }
  }, []);

  const onExpire = useCallback(() => {
    setTurnstileToken('');
    if (turnstileRef.current && !isResetting.current) {
      isResetting.current = true;
      turnstileRef.current.reset();
      setTimeout(() => { isResetting.current = false; }, 500);
    }
  }, []);

  const onSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log("Form submitted at:", new Date().toISOString());
    setError('');

    if (isTurnstileEnabled && process.env.REACT_APP_ENV === 'production') {
      if (turnstileToken) {
        handleFetchLogin(turnstileToken);
      } else {
        console.log('[Login] Manual Turnstile execution triggered');
        pendingSubmit.current = true;
        turnstileRef.current?.execute();
      }
    } else {
      handleFetchLogin(turnstileToken);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      titleId="login-title"
      subtitle={<p className="m-0">Log in to save favorites, rate dishes, and share your food finds.</p>}
    >
      <div aria-live="assertive">
        {error && !isLocked && (
          <div className="alert-error animate-fade-in-up mb-5" role="alert">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {isLocked && (
          <div className="alert-error animate-fade-in-up mb-5" role="alert">
            <LockClockIcon className="flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold m-0">Account temporarily locked</p>
              <p className="text-sm m-0">
                Try again in {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
              </p>
            </div>
          </div>
        )}
      </div>

      <form
        key="auth-login-form"
        className="w-full flex flex-col gap-5"
        style={{ opacity: loading || isLocked ? 0.6 : 1, transition: 'opacity 0.2s ease-in-out' }}
        onSubmit={onSubmit}
        noValidate
        aria-busy={loading}
      >
        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          icon={EmailOutlinedIcon}
          required
          disabled={isLocked || loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Input
            id="login-password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            icon={LockOutlinedIcon}
            required
            disabled={isLocked || loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightElement={
              <button
                type="button"
                className="w-10 h-10 grid place-items-center rounded-full text-content-secondary hover:text-brand-accent hover:bg-brand-accent/10 transition-colors disabled:opacity-50"
                disabled={isLocked || loading}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
              </button>
            }
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {attemptsRemaining !== null && attemptsRemaining < 5 && !isLocked ? (
              <p className="text-xs font-bold text-danger m-0">
                {attemptsRemaining} attempts remaining before account lock
              </p>
            ) : <span />}
            <Link to="/forgot-password" className="text-sm font-semibold text-brand-accent no-underline hover:underline underline-offset-4 min-h-[32px] inline-flex items-center">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || isLocked || (isTurnstileEnabled && !turnstileToken && process.env.REACT_APP_ENV === 'production')}
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" aria-hidden="true" />
              Logging in…
            </>
          ) : (
            <>
              Log in
              <ArrowForwardIcon fontSize="small" aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      {/* Cloudflare Turnstile Widget — intentionally OUTSIDE the <form>.
          Cloudflare's Turnstile JS calls form.requestSubmit() on its closest
          ancestor <form> after verification. Inside the form this bypasses
          e.preventDefault() and fires a native GET navigation. Outside the form
          only the onSuccess callback fires, which is all we need. */}
      {isTurnstileEnabled && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <Turnstile
            ref={turnstileRef}
            siteKey={turnstileSiteKey}
            execution="execute"
            appearance="always"
            onRender={(id) => {
              widgetId.current = id;
              console.log('[Login] Turnstile rendered:', id);
            }}
            onSuccess={onVerify}
            onError={onError}
            onExpire={onExpire}
          />
          <p className="text-xs text-content-muted m-0">Protected by Cloudflare Turnstile.</p>
        </div>
      )}

      <p className="mt-8 pt-6 border-t border-subtle text-center text-content-secondary">
        New to Eaty Wonders?{' '}
        <Link to="/register" className="text-brand-accent font-bold no-underline hover:underline underline-offset-4">Create an account</Link>
      </p>

      {/* Account lockout dialog */}
      <Dialog
        open={isLocked}
        onClose={() => setIsLocked(false)}
        aria-labelledby="lockout-title"
        aria-describedby="lockout-desc"
        PaperProps={{ sx: { p: 1, maxWidth: 420 } }}
      >
        <div className="p-5 text-center">
          <span className="w-14 h-14 mx-auto rounded-full grid place-items-center bg-danger/10 text-danger" aria-hidden="true">
            <LockClockIcon />
          </span>
          <h2 id="lockout-title" className="mt-4 mb-2 font-display text-2xl font-semibold text-content-primary">Account locked</h2>
          <p id="lockout-desc" className="text-content-secondary m-0">
            For your security, this account is locked for {lockoutMinutes} minutes after several failed login attempts.
          </p>
          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2 justify-center">
            <Button variant="secondary" onClick={() => setIsLocked(false)}>Close</Button>
            <Button onClick={() => navigate('/forgot-password')}>Reset password</Button>
          </div>
        </div>
      </Dialog>
    </AuthShell>
  );
};

export default Login;
