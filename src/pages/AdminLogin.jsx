import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Login.css';
import api from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { toast } from 'react-toastify';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ShieldIcon from '@mui/icons-material/Shield';

import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import ThemeToggleButton from '../components/ui/ThemeToggleButton';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const turnstileSiteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  console.log('[AdminLogin] Turnstile SiteKey:', turnstileSiteKey ? 'LOADED' : 'MISSING');
  const isTurnstileEnabled = Boolean(turnstileSiteKey);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
          console.log('[AdminLogin] Cleaning up Turnstile widget:', widgetId.current);
          window.turnstile.remove(widgetId.current);
        } catch (e) {
          console.warn('[AdminLogin] Turnstile cleanup failed:', e);
        }
      }
    };
  }, []);

  const handleFetchLogin = useCallback(async (token) => {
    setLoading(true);
    setError('');

    try {
      const isDevelopment = process.env.REACT_APP_ENV === 'development';

      console.log('[AdminLogin] Submitting with token:', token ? 'YES' : 'NO');

      const loginPayload = {
        email,
        password,
        ...(isTurnstileEnabled && (isDevelopment || token) ? { turnstileToken: token || '' } : {}),
      };
      
      const { data } = await api.post('/auth/portal-login', loginPayload);
      login(null, data.user);

      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 100);
    } catch (err) {
      const errorData = err?.response?.data;
      
      // Reset CAPTCHA on failure
      if (turnstileRef.current && !isResetting.current) {
        isResetting.current = true;
        turnstileRef.current.reset();
        setTurnstileToken('');
        setTimeout(() => { isResetting.current = false; }, 500);
      }

      const msg = errorData?.error || 'Access denied. Administrative credentials required.';
      setError(msg);
      toast.error(msg);
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
    console.warn('[AdminLogin] Turnstile error:', turnstileError);
    setTurnstileToken('');
    
    // Silent reset on error to prevent alert loops
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
        console.log('[AdminLogin] Manual Turnstile execution triggered');
        pendingSubmit.current = true;
        turnstileRef.current?.execute();
      }
    } else {
      handleFetchLogin(turnstileToken);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  return (
    <main className="min-h-dvh w-full flex items-center justify-center p-4 sm:p-8 bg-background-primary overflow-hidden">
      <div className="auth-theme-wrapper">
        <ThemeToggleButton />
      </div>

      <Card className="w-full max-w-4xl max-h-full overflow-hidden flex flex-col md:flex-row shadow-2xl p-0 rounded-2xl border-t-4 border-slate-800">
        {/* Left Column - Admin Branding */}
        <div className="hidden md:flex md:w-5/12 bg-slate-900 p-12 flex-col justify-center items-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/50 -mr-32 -mt-32 rounded-full" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-800/30 -ml-24 -mb-24 rounded-full" />

          <div className="z-10 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 shadow-inner">
              <AdminPanelSettingsIcon style={{ fontSize: '56px', color: '#94a3b8' }} />
            </div>
            <h2 className="text-3xl font-bold mb-2">Admin Portal</h2>
            <p className="text-slate-400">Secure Administrative Gateway</p>
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500 uppercase tracking-widest">
              <ShieldIcon style={{ fontSize: '14px' }} />
              <span>Restricted Access</span>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-7/12 p-8 sm:p-12 flex flex-col justify-center bg-surface relative">

          <button
            type="button"
            className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full text-content-secondary hover:text-content-primary hover:bg-background-secondary transition-all z-10"
            onClick={goBack}
          >
            <ArrowBackIcon className="w-5 h-5" />
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-content-primary">Authentication</h1>
            <p className="text-content-secondary mt-2 text-sm">Please enter your administrative credentials to continue.</p>
          </div>

          <div className="min-h-[60px] mb-2">
            {error && (
              <div className="alert-error flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm animate-fade-in-up">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            )}
          </div>

          <form
            key="admin-login-form"
            className="w-full flex flex-col gap-4 relative"
            style={{
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s ease-in-out',
            }}
            onSubmit={onSubmit}
            noValidate
          >
            <Input
              id="admin-email"
              label="Admin Email"
              type="email"
              placeholder="admin@eatywonders.com"
              icon={EmailOutlinedIcon}
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              id="admin-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={LockOutlinedIcon}
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightElement={
                <button
                  type="button"
                  disabled={loading}
                  className="p-2 text-content-secondary hover:text-brand-accent transition-colors disabled:opacity-50"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </button>
              }
            />

            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
              disabled={loading || (isTurnstileEnabled && !turnstileToken && process.env.REACT_APP_ENV === 'production')}
            >
              <span>Authorize Access</span>
              <ArrowForwardIcon className="ml-2" />
            </Button>

            <div className="mt-8 pt-8 border-t border-border-subtle text-center">
              <p className="text-xs text-content-secondary leading-relaxed">
                This system is for authorized users only. All activity is logged and monitored.
                Unauthorized access attempts will be investigated.
              </p>
            </div>
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
                  console.log('[AdminLogin] Turnstile rendered:', id);
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
                <p className="text-sm font-medium text-content-primary">Securing Session...</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
};

export default AdminLogin;
