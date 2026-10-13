import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Login.css';
import api from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { toast } from 'react-toastify';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LockClockIcon from '@mui/icons-material/LockClock';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

import ThemeToggleButton from '../components/ui/ThemeToggleButton';
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

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background-primary relative overflow-hidden">
      <div className="auth-theme-wrapper">
        <ThemeToggleButton />
      </div>

      <Card className="w-full max-w-5xl max-h-full overflow-hidden flex flex-col md:flex-row shadow-2xl p-0 rounded-2xl" aria-labelledby="login-title">
        {/* Left Column - Branding (Desktop Only) */}
        <div className="hidden md:flex md:w-1/2 bg-brand-accent p-12 flex-col justify-center items-center text-white relative overflow-hidden">
          {/* Decorative floating elements */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full" />
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute top-1/3 right-20 w-12 h-12 bg-white/10 rounded-full" />
          <div className="absolute bottom-1/3 left-16 w-16 h-16 bg-white/10 rounded-full" />

          {/* Branding content */}
          <div className="z-10 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
              <RestaurantIcon style={{ fontSize: '48px' }} />
            </div>
            <h2 className="text-4xl font-bold mb-4">EatyWonders</h2>
            <p className="text-xl text-white/90">Unveiling the Culinary Heart of Cavite</p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center bg-surface relative">

          <button
            type="button"
            className="absolute top-4 left-4 sm:top-6 sm:left-6 w-10 h-10 flex items-center justify-center rounded-full text-content-secondary hover:text-content-primary hover:bg-background-secondary transition-all z-10"
            onClick={goBack}
            aria-label="Go back"
          >
            <ArrowBackIcon className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Mobile header (hidden on desktop) */}
          <div className="md:hidden text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 bg-brand-accent/10 rounded-full flex items-center justify-center text-brand-accent">
              <RestaurantIcon style={{ fontSize: '40px' }} />
            </div>
            <h1 id="login-title" className="text-3xl font-bold text-content-primary">Login</h1>
            <p className="text-content-secondary mt-2">Login to continue</p>
          </div>

          {/* Desktop header (hidden on mobile) */}
          <div className="hidden md:block mb-4 text-center">
            <h1 id="login-title" className="text-3xl font-bold text-content-primary">Welcome Back</h1>
            <p className="text-content-secondary mt-2">Login to continue your journey</p>
          </div>

          <div className="min-h-[60px] mb-2">
            {error && (
              <div className="alert-error animate-fade-in-up" role="alert">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}

            {isLocked && (
              <div className="alert-error animate-fade-in-up" role="alert">
                <LockClockIcon className="flex-shrink-0" />
                <div>
                  <p className="font-bold">Account temporarily locked</p>
                  <p className="text-sm text-red-500/80">
                    Try again in {Math.floor(lockoutSeconds / 60)}:{String(lockoutSeconds % 60).padStart(2, '0')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form
            key="auth-login-form"
            className="w-full flex flex-col gap-2 relative"
            style={{
              opacity: loading || isLocked ? 0.6 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
            onSubmit={onSubmit}
            noValidate
          >
            <Input
              id="login-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={EmailOutlinedIcon}
              required
              disabled={isLocked || loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="space-y-1">
              <Input
                id="login-password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                icon={LockOutlinedIcon}
                required
                disabled={isLocked || loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <button
                    type="button"
                    className="p-2 text-content-secondary hover:text-brand-accent transition-colors disabled:opacity-50"
                    disabled={isLocked || loading}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                  </button>
                }
              />
              {attemptsRemaining !== null && attemptsRemaining < 5 && !isLocked && (
                <p className="text-xs font-bold text-red-500 mt-1">
                  {attemptsRemaining} attempts remaining before account lock
                </p>
              )}
            </div>

            <Link to="/forgot-password" className="login-forgot-link">Forgot password?</Link>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || isLocked || (isTurnstileEnabled && !turnstileToken && process.env.REACT_APP_ENV === 'production')}
            >
              <span>Login</span>
              <ArrowForwardIcon className="ml-2" aria-hidden="true" />
            </Button>

            <p className="text-xs text-content-secondary text-center mt-2">
              Protected by Cloudflare Turnstile.
            </p>

            <div className="relative mt-2 mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-surface px-3 text-sm text-content-secondary">or</span>
              </div>
            </div>

            <p className="text-center text-content-secondary">
              Don&apos;t have an account? <Link to="/register" className="text-brand-accent font-bold hover:underline">Sign up</Link>
            </p>
          </form>

          {/* Cloudflare Turnstile Widget — intentionally OUTSIDE the <form>.
              Cloudflare's Turnstile JS calls form.requestSubmit() on its closest
              ancestor <form> after verification. Inside the form this bypasses
              e.preventDefault() and fires a native GET navigation. Outside the form
              only the onSuccess callback fires, which is all we need. */}
          {isTurnstileEnabled && (
            <div className="my-2 flex justify-center">
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
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-surface/60 backdrop-blur-sm transition-all animate-fade-in">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
                <p className="text-sm font-medium text-content-primary">Authenticating...</p>
              </div>
            </div>
          )}

          {/* Account Lockout Modal */}
          {isLocked && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '16px',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsLocked(false);
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: '12px',
                  padding: '32px',
                  maxWidth: '400px',
                  width: '100%',
                  textAlign: 'center',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    marginBottom: '12px',
                  }}
                >
                  Account Locked
                </h2>
                <p
                  style={{
                    fontSize: '15px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    marginBottom: '24px',
                  }}
                >
                  For your security, this account has been temporarily locked due to multiple failed login attempts. Please wait {lockoutMinutes} minutes.
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                  }}
                >
                  <button
                    onClick={() => navigate('/forgot-password')}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#15803d')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#16a34a')}
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => setIsLocked(false)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => (e.target.style.backgroundColor = '#e5e7eb')}
                    onMouseLeave={(e) => (e.target.style.backgroundColor = '#f3f4f6')}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Login;
