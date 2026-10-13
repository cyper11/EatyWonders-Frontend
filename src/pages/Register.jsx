import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Register.css';
import api from '../api/backend';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { geocodeAddress } from '../utils/geocode';
import { toast } from 'react-toastify';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import useDocumentTitle from '../hooks/useDocumentTitle';
import PasswordChecklist from '../components/PasswordChecklist';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';

import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Button from '../components/ui/Button';
import AuthShell from '../components/AuthShell';

import TermsModal from '../components/TermsModal';
import PrivacyModal from '../components/PrivacyModal';

const suffixOptions = ['Jr.', 'Sr.', 'II', 'III', 'IV'];

// Standalone field error component (defined outside Register to prevent remount on every render)
const FieldError = ({ message }) => {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-center gap-1.5 mt-2 mb-0 text-sm font-semibold text-danger animate-fade-in-up">
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  );
};




const Register = () => {
  const navigate = useNavigate();
  useDocumentTitle('Create Account');
  const { login } = useAuth();
  const turnstileSiteKey = process.env.REACT_APP_TURNSTILE_SITE_KEY;
  const isTurnstileEnabled = Boolean(turnstileSiteKey);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [suffix, setSuffix] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileFile, setProfileFile] = useState(null);
  const [code, setCode] = useState('');
  const [sentMessage, setSentMessage] = useState('');
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
          console.log('[Register] Cleaning up Turnstile widget:', widgetId.current);
          window.turnstile.remove(widgetId.current);
        } catch (e) {
          console.warn('[Register] Turnstile cleanup failed:', e);
        }
      }
    };
  }, []);



  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantDescription, setRestaurantDescription] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [businessRegDate, setBusinessRegDate] = useState('');
  const [regFile, setRegFile] = useState(null);
  const [barangayFile, setBarangayFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [birFile, setBirFile] = useState(null);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [showTermsWarning, setShowTermsWarning] = useState(false);
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Restaurant name availability check state
  const [isNameTaken, setIsNameTaken] = useState(false);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const nameCheckTimeoutRef = useRef(null);

  const isOwner = role === 'owner';

  // Debounced restaurant name availability check
  useEffect(() => {
    // Only check if user is registering as owner and has entered a name
    if (!isOwner || !restaurantName.trim()) {
      setIsNameTaken(false);
      setIsCheckingName(false);
      return;
    }

    // Clear any existing timeout
    if (nameCheckTimeoutRef.current) {
      clearTimeout(nameCheckTimeoutRef.current);
    }

    // Set checking state
    setIsCheckingName(true);

    // Debounce the API call by 500ms
    nameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/auth/check-restaurant?name=${encodeURIComponent(restaurantName.trim())}`);
        setIsNameTaken(!response.data.available);
      } catch (err) {
        console.error('Error checking restaurant name:', err);
        setIsNameTaken(false);
      } finally {
        setIsCheckingName(false);
      }
    }, 500);

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (nameCheckTimeoutRef.current) {
        clearTimeout(nameCheckTimeoutRef.current);
      }
    };
  }, [restaurantName, isOwner]);

  // Compute password mismatch error dynamically
  const passwordMismatchError = confirmPassword && password !== confirmPassword;

  // Clear a single field error when user starts typing
  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };



  // Custom validation that replaces browser-native tooltips
  const validateFields = () => {
    const errors = {};
    if (!firstName.trim()) errors.firstName = 'First name is required.';
    if (!surname.trim()) errors.surname = 'Surname is required.';
    if (!email.trim()) errors.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Please enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    if (!agreedToTerms) errors.terms = 'You must agree to the Terms & Conditions.';
    if (!agreedToPrivacy) errors.privacy = 'You must agree to the Privacy Policy.';
      if (isOwner) {
      if (!restaurantName.trim()) errors.restaurantName = 'Restaurant name is required.';
      else if (isNameTaken) errors.restaurantName = 'Restaurant name is already taken.';
      if (!restaurantAddress.trim()) errors.restaurantAddress = 'Restaurant address is required.';
      if (!businessRegDate) errors.businessRegDate = 'Business registration date is required.';
      if (!regFile) errors.regFile = 'Proof of Business Registration (DTI/SEC) is required.';
      if (!barangayFile) errors.barangayFile = 'Barangay Business Clearance is required.';
      if (!idFile) errors.idFile = 'Owner valid ID photo is required.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      const fieldIdMap = {
        firstName: 'first-name',
        surname: 'surname',
        email: 'register-email',
        password: 'register-password',
        confirmPassword: 'confirm-password',
        restaurantName: 'restaurant-name',
        restaurantAddress: 'restaurant-address',
        businessRegDate: 'business-reg-date',
        regFile: 'reg-photo',
        barangayFile: 'barangay-photo',
        idFile: 'id-photo',
        terms: 'terms-checkbox',
        privacy: 'privacy-checkbox'
      };
      const el = document.getElementById(fieldIdMap[firstErrorKey]);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  // Handle checkbox click attempts - show warning instead
  const handleTermsCheckboxClick = (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setShowTermsWarning(true);
      setTimeout(() => setShowTermsWarning(false), 4000);
    }
  };

  const handlePrivacyCheckboxClick = (e) => {
    e.preventDefault();
    if (!agreedToPrivacy) {
      setShowPrivacyWarning(true);
      setTimeout(() => setShowPrivacyWarning(false), 4000);
    }
  };

  const getFullName = useCallback(() =>
    [firstName, middleName, surname, suffix]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' '), [firstName, middleName, surname, suffix]);

  const handleFetchRegister = useCallback(async (token) => {
    setLoading(true);
    setError('');

    try {
      const fullName = getFullName();

      const form = new FormData();
      form.append('name', fullName);
      form.append('email', email);
      form.append('password', password);
      form.append('role', role);
      form.append('agreedToTerms', agreedToTerms ? '1' : '0');
      form.append('agreedToPrivacy', agreedToPrivacy ? '1' : '0');
      if (code.trim()) form.append('code', code.trim());
      if (profileFile) form.append('profile', profileFile);
      if (isTurnstileEnabled && token) form.append('turnstileToken', token);

      if (isOwner) {
        form.append('restaurantName', restaurantName.trim());
        form.append('restaurantDescription', restaurantDescription.trim());
        form.append('restaurantAddress', restaurantAddress.trim());
        form.append('businessRegDate', businessRegDate);
        form.append('business_reg', regFile);
        form.append('barangay_clearance', barangayFile);
        form.append('owner_id', idFile);
        if (birFile) form.append('bir', birFile);

        try {
          const geo = await geocodeAddress(`${restaurantName.trim()}, ${restaurantAddress.trim()}`);
          if (geo?.lat !== null && geo?.lng !== null) {
            form.append('restaurantLat', String(geo.lat));
            form.append('restaurantLng', String(geo.lng));
          }
        } catch {
          // Address geocoding is helpful but not required
        }
      }

      const response = await api.post('/auth/register', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = response.data || {};

      if (response.status === 202 && data.verification_sent) {
        setSentMessage(
          isOwner
            ? `Verification code sent. After you verify, your owner application will wait for admin approval.`
            : `Verification code sent to your email.`
        );
        return;
      }

      login(data.token, data.user);
      if (data.user?.role === 'owner') navigate('/owner-page');
      else if (data.user?.role === 'admin') window.location.replace("https://admin.eatywonders.com");
      else navigate('/user-page');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'An error occurred during registration.';

      if (turnstileRef.current && !isResetting.current) {
        isResetting.current = true;
        turnstileRef.current.reset();
        setTurnstileToken('');
        setTimeout(() => { isResetting.current = false; }, 500);
      }

      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [email, password, role, agreedToTerms, agreedToPrivacy, code, profileFile, isTurnstileEnabled, isOwner, restaurantName, restaurantDescription, restaurantAddress, businessRegDate, regFile, barangayFile, idFile, birFile, login, navigate, getFullName]);

  const onVerify = useCallback((token) => {
    setTurnstileToken(token);
    if (pendingSubmit.current) {
      pendingSubmit.current = false;
      handleFetchRegister(token);
    }
  }, [handleFetchRegister]);

  const onError = useCallback((turnstileError) => {
    console.warn('[Register] Turnstile error:', turnstileError);
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

  const onSubmit = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    console.log("Form submitted at:", new Date().toISOString());
    setError('');

    if (!validateFields()) return;

    if (isTurnstileEnabled && process.env.REACT_APP_ENV === 'production') {
      if (turnstileToken) {
        handleFetchRegister(turnstileToken);
      } else {
        console.log('[Register] Manual Turnstile execution triggered');
        pendingSubmit.current = true;
        turnstileRef.current?.execute();
      }
    } else {
      handleFetchRegister(turnstileToken);
    }
  };

  const sendCode = async () => {
    if (!email) {
      setSentMessage('Enter email first');
      return;
    }
    setSentMessage('Sending...');
    try {
      await api.post('/auth/send-code', { email });
      setSentMessage('Verification code sent to your email');
    } catch (e) {
      setSentMessage(e?.response?.data?.error || 'Failed to send verification code');
    }
  };

  return (
    <>
      <AuthShell
        wide
        title="Create your account"
        titleId="register-title"
        subtitle={
          <p className="m-0">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-accent font-bold no-underline hover:underline underline-offset-4">Log in</Link>
          </p>
        }
      >
            <div aria-live="assertive">
              {error && <div className="alert-error animate-fade-in-up mb-2" role="alert"><span className="font-semibold">{error}</span></div>}
            </div>

        <form
          key="auth-register-form"
          className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5 mt-4" 
          style={{
            opacity: loading ? 0.6 : 1,
            transition: 'opacity 0.2s ease-in-out',
          }}
          onSubmit={onSubmit}
          noValidate
        >
          <Input
            id="first-name"
            label="First Name"
            placeholder="First name"
            icon={PersonOutlineIcon}
            value={firstName}
            onChange={(e) => { setFirstName(e.target.value); clearFieldError('firstName'); }}
            error={fieldErrors.firstName}
          />

          <Input
            id="surname"
            label="Surname"
            placeholder="Surname"
            icon={PersonOutlineIcon}
            value={surname}
            onChange={(e) => { setSurname(e.target.value); clearFieldError('surname'); }}
            error={fieldErrors.surname}
          />

          <Input
            id="middle-name"
            label="Middle Name"
            placeholder="Middle name"
            icon={PersonOutlineIcon}
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
          />

          <Select
            id="suffix"
            label="Suffix (optional)"
            icon={BadgeOutlinedIcon}
            value={suffix}
            onChange={(e) => setSuffix(e.target.value)}
          >
            <option value="">Select</option>
            {suffixOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>

          <div className="sm:col-span-2">
            <Input
              id="register-email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              icon={EmailOutlinedIcon}
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
              error={fieldErrors.email}
            />
          </div>

          <div className="space-y-4">
            <Input
              id="register-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              icon={LockOutlinedIcon}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
              error={fieldErrors.password}
              autoComplete="new-password"
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
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm password"
            icon={LockOutlinedIcon}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
            error={fieldErrors.confirmPassword || (passwordMismatchError ? 'Passwords do not match' : '')}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                className="p-2 text-content-secondary hover:text-brand-accent transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
              </button>
            }
          />

          <div className="sm:col-span-2">
            <Select
              id="role"
              label="Role"
              icon={GroupsOutlinedIcon}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="owner">Food Owner</option>
            </Select>
          </div>

          <div className="auth-field register-field sm:col-span-2">
            <label htmlFor="profile-photo">Profile photo (optional)</label>
            <div className="register-file-control">
              <ImageOutlinedIcon aria-hidden="true" />
              <label className="register-file-button" htmlFor="profile-photo">Choose File</label>
              <span>{profileFile?.name || 'No file selected'}</span>
              <input
                type="file"
                id="profile-photo"
                accept="image/*"
                className="register-file-input"
                onChange={(event) => setProfileFile(event.target.files && event.target.files[0])}
              />
            </div>
          </div>

          {isOwner && (
            <>
              <div className="sm:col-span-2 mt-4">
                <h2 className="font-display text-xl font-semibold text-content-primary m-0 pt-5 border-t border-subtle">Owner application</h2>
                <p className="text-sm text-content-secondary mt-1 mb-0">We review these documents before your restaurant goes live.</p>
              </div>
              <div className="relative">
                <Input
                  id="restaurant-name"
                  label="Restaurant Name"
                  placeholder="Your restaurant name"
                  icon={StorefrontOutlinedIcon}
                  value={restaurantName}
                  onChange={(e) => { setRestaurantName(e.target.value); clearFieldError('restaurantName'); }}
                  error={fieldErrors.restaurantName || (isNameTaken ? 'Restaurant name is already taken.' : '')}
                />
                {/* Availability feedback */}
                {isCheckingName && (
                  <span className="text-sm text-content-secondary mt-1 block animate-pulse">
                    Checking availability...
                  </span>
                )}
                {isNameTaken && !isCheckingName && (
                  <span className="text-sm text-danger font-bold mt-1 block animate-fade-in-up">
                    This restaurant name is already taken.
                  </span>
                )}
              </div>

              <Input
                id="restaurant-address"
                label="Restaurant Address"
                placeholder="Street, city, barangay"
                icon={LocationOnOutlinedIcon}
                value={restaurantAddress}
                onChange={(e) => { setRestaurantAddress(e.target.value); clearFieldError('restaurantAddress'); }}
                error={fieldErrors.restaurantAddress}
              />

              <Input
                id="business-reg-date"
                label="Business Registration Date"
                type="date"
                icon={DescriptionOutlinedIcon}
                value={businessRegDate}
                onChange={(e) => { setBusinessRegDate(e.target.value); clearFieldError('businessRegDate'); }}
                error={fieldErrors.businessRegDate}
              />

              <div className="sm:col-span-2">
                <Textarea
                  id="restaurant-description"
                  label="Restaurant Description"
                  placeholder="Tell users about your food business"
                  icon={DescriptionOutlinedIcon}
                  value={restaurantDescription}
                  onChange={(e) => setRestaurantDescription(e.target.value)}
                />
              </div>

              <div className="auth-field register-field sm:col-span-2">
                <label htmlFor="reg-photo">Proof of Business Registration (DTI/SEC)</label>
                <div className="register-file-control">
                  <ImageOutlinedIcon aria-hidden="true" />
                  <label className="register-file-button" htmlFor="reg-photo">Choose File</label>
                  <span>{regFile?.name || 'No file selected'}</span>
                  <input
                    type="file"
                    id="reg-photo"
                    accept="image/*"
                    className="register-file-input"
                    onChange={(event) => { setRegFile(event.target.files && event.target.files[0]); clearFieldError('regFile'); }}
                  />
                </div>
                <FieldError message={fieldErrors.regFile} />
              </div>

              <div className="auth-field register-field sm:col-span-2">
                <label htmlFor="barangay-photo">Barangay Business Clearance</label>
                <div className="register-file-control">
                  <ImageOutlinedIcon aria-hidden="true" />
                  <label className="register-file-button" htmlFor="barangay-photo">Choose File</label>
                  <span>{barangayFile?.name || 'No file selected'}</span>
                  <input
                    type="file"
                    id="barangay-photo"
                    accept="image/*"
                    className="register-file-input"
                    onChange={(event) => { setBarangayFile(event.target.files && event.target.files[0]); clearFieldError('barangayFile'); }}
                  />
                </div>
                <FieldError message={fieldErrors.barangayFile} />
              </div>

              <div className="auth-field register-field sm:col-span-2">
                <label htmlFor="id-photo">Owner's Valid ID Photo</label>
                <div className="register-file-control">
                  <ImageOutlinedIcon aria-hidden="true" />
                  <label className="register-file-button" htmlFor="id-photo">Choose File</label>
                  <span>{idFile?.name || 'No file selected'}</span>
                  <input
                    type="file"
                    id="id-photo"
                    accept="image/*"
                    className="register-file-input"
                    onChange={(event) => { setIdFile(event.target.files && event.target.files[0]); clearFieldError('idFile'); }}
                  />
                </div>
                <FieldError message={fieldErrors.idFile} />
              </div>

              <div className="auth-field register-field sm:col-span-2">
                <label htmlFor="bir-photo">BIR Registration Photo (Optional)</label>
                <div className="register-file-control">
                  <ImageOutlinedIcon aria-hidden="true" />
                  <label className="register-file-button" htmlFor="bir-photo">Choose File</label>
                  <span>{birFile?.name || 'No file selected'}</span>
                  <input
                    type="file"
                    id="bir-photo"
                    accept="image/*"
                    className="register-file-input"
                    onChange={(event) => { setBirFile(event.target.files && event.target.files[0]); clearFieldError('birFile'); }}
                  />
                </div>
                <FieldError message={fieldErrors.birFile} />
              </div>
            </>
          )}

          <div className="auth-field register-field sm:col-span-2">
            <label htmlFor="verification-code" className="block text-sm font-semibold text-content-primary mb-1.5">Email verification</label>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-grow min-w-0">
                <Input
                  id="verification-code"
                  placeholder="Enter code"
                  icon={VerifiedUserOutlinedIcon}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <Button type="button" variant="secondary" onClick={sendCode} className="sm:min-w-[140px] min-h-[48px]">
                Send code
              </Button>
            </div>
            {sentMessage && <p className="text-sm text-content-secondary mt-2 mb-0" role="status">{sentMessage}</p>}
          </div>

          <fieldset className="sm:col-span-2 mt-2 pt-5 border-0 border-t border-subtle p-0 m-0">
            <legend className="text-sm font-semibold text-content-primary mb-3 float-left w-full">
              Agreements
            </legend>

            <div className={`
              flex items-center gap-3 p-4 mb-3 rounded-lg transition-all duration-200 border
              ${agreedToTerms ? 'bg-brand-accent/5 border-brand-accent' : 'bg-background-secondary border-subtle'}
            `}>
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={agreedToTerms}
                onClick={handleTermsCheckboxClick}
                readOnly
                className="w-5 h-5 cursor-pointer accent-brand-accent flex-shrink-0"
              />
              <label htmlFor="terms-checkbox" className="text-sm cursor-pointer m-0 text-content-primary flex-1 flex items-center gap-1.5">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsTermsModalOpen(true);
                    setShowTermsWarning(false);
                  }}
                  className="bg-transparent border-none underline text-brand-accent font-bold cursor-pointer p-0 font-inherit transition-colors hover:text-brand-accent/80"
                >
                  Terms & Conditions
                </button>
              </label>
            </div>
            {showTermsWarning && (
              <p className="text-sm font-semibold text-danger mt-0 mb-3" role="alert">
                Please open and read the Terms and Conditions to agree.
              </p>
            )}

            <div className={`
              flex items-center gap-3 p-4 rounded-lg transition-all duration-200 border
              ${agreedToPrivacy ? 'bg-brand-accent/5 border-brand-accent' : 'bg-background-secondary border-subtle'}
            `}>
              <input
                type="checkbox"
                id="privacy-checkbox"
                checked={agreedToPrivacy}
                onClick={handlePrivacyCheckboxClick}
                readOnly
                className="w-5 h-5 cursor-pointer accent-brand-accent flex-shrink-0"
              />
              <label htmlFor="privacy-checkbox" className="text-sm cursor-pointer m-0 text-content-primary flex-1 flex items-center gap-1.5">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsPrivacyModalOpen(true);
                    setShowPrivacyWarning(false);
                  }}
                  className="bg-transparent border-none underline text-brand-accent font-bold cursor-pointer p-0 font-inherit transition-colors hover:text-brand-accent/80"
                >
                  Privacy Policy
                </button>
              </label>
            </div>
            {showPrivacyWarning && (
              <p className="text-sm font-semibold text-danger mt-0 mb-3" role="alert">
                Please open and read the Privacy Policy to agree.
              </p>
            )}
            <FieldError message={fieldErrors.terms} />
            <FieldError message={fieldErrors.privacy} />
          </fieldset>

          <div className="sm:col-span-2 mt-2">
            <Button type="submit" size="lg" className="w-full" disabled={loading || (isTurnstileEnabled && !turnstileToken && process.env.REACT_APP_ENV === 'production') || isNameTaken}>
              {loading ? 'Creating account…' : 'Create account'}
              {!loading && <ArrowForwardIcon fontSize="small" aria-hidden="true" />}
            </Button>
          </div>

          <p className="sm:col-span-2 flex items-center justify-center gap-1.5 text-xs text-content-muted m-0">
            <SecurityOutlinedIcon sx={{ fontSize: 16 }} aria-hidden="true" />
            Protected by Cloudflare Turnstile.
          </p>
        </form>

          {/* Cloudflare Turnstile Widget — intentionally OUTSIDE the <form>.
              Cloudflare's Turnstile JS calls form.requestSubmit() on its closest
              ancestor <form> after verification. Inside the form this bypasses
              e.preventDefault() and fires a native GET navigation. Outside the form
              only the onSuccess callback fires, which is all we need. */}
          {isTurnstileEnabled && (
            <div style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
              <Turnstile
                ref={turnstileRef}
                siteKey={turnstileSiteKey}
                execution="execute"
                appearance="always"
                onRender={(id) => {
                  widgetId.current = id;
                  console.log('[Register] Turnstile rendered:', id);
                }}
                onSuccess={onVerify}
                onError={onError}
                onExpire={onExpire}
              />
            </div>
          )}

          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background-primary/70" role="status" aria-live="polite">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
                <p className="text-sm font-medium text-content-primary">Creating Account...</p>
              </div>
            </div>
          )}
      </AuthShell>

    {isTermsModalOpen && (
      <TermsModal
        onClose={() => setIsTermsModalOpen(false)}
        onAgree={() => {
          setAgreedToTerms(true);
          setIsTermsModalOpen(false);
        }}
      />
    )}
    {isPrivacyModalOpen && (
      <PrivacyModal
        onClose={() => setIsPrivacyModalOpen(false)}
        onAgree={() => {
          setAgreedToPrivacy(true);
          setIsPrivacyModalOpen(false);
        }}
      />
    )}
    </>
  );
};

export default Register;
