import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ThemeToggleButton from './ui/ThemeToggleButton';
import sideImage from '../background/adobongpusitsagatarecipe-1.jpg';

/**
 * Shared layout for login / register / password pages.
 * Phones: photo banner with the brand, form in a sheet that overlaps it.
 * Desktop: sticky photo panel on the left, focused form column on the right.
 */
const AuthShell = ({ title, subtitle, titleId = 'auth-title', wide = false, children }) => {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const backButtonBase =
    'inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-full font-semibold transition-colors';

  return (
    <div className="min-h-dvh grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] bg-background-primary">
      {/* Photo panel (desktop) */}
      <aside className="hidden lg:block relative lg:sticky lg:top-0 lg:self-start lg:h-dvh overflow-hidden bg-[var(--forest-900)]" aria-hidden="true">
        <img src={sideImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1a10] via-[#0c1a10]/30 to-transparent" />
        <div className="absolute left-10 right-10 bottom-10 text-white">
          <img src="/GreenSimpleCleanVeganFoodLogo.png" alt="" className="w-14 h-14 rounded-full ring-2 ring-white/30" />
          <p className="mt-5 mb-0 font-display text-[2.2rem] leading-tight font-semibold">
            Unveiling the culinary heart of Cavite
          </p>
          <p className="mt-2 mb-0 text-white/75">Your digital gateway to Cavite's local flavors.</p>
        </div>
      </aside>

      <div className="flex flex-col min-h-dvh min-w-0">
        {/* Photo banner (phones & tablets) */}
        <div className="lg:hidden relative h-[210px] sm:h-[260px] shrink-0 overflow-hidden bg-[var(--forest-900)]">
          <img src={sideImage} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/55" aria-hidden="true" />
          <div
            className="absolute inset-x-0 top-0 flex items-center justify-between px-4 sm:px-6"
            style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}
          >
            <button type="button" onClick={goBack} className={`${backButtonBase} bg-black/35 text-white hover:bg-black/50`}>
              <ArrowBackRoundedIcon fontSize="small" aria-hidden="true" />
              Back
            </button>
            <ThemeToggleButton sx={{ bgcolor: 'rgba(0,0,0,0.35)', color: '#fff', borderColor: 'rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(0,0,0,0.5)', color: '#fff' } }} />
          </div>
          <Link to="/" className="absolute left-4 sm:left-6 bottom-10 flex items-center gap-2.5 no-underline" aria-label="Eaty Wonders home">
            <img src="/GreenSimpleCleanVeganFoodLogo.png" alt="" className="w-10 h-10 rounded-full ring-2 ring-white/40" />
            <span className="font-display text-xl font-semibold text-white leading-none drop-shadow">Eaty Wonders</span>
          </Link>
        </div>

        {/* Top bar (desktop) */}
        <div className="hidden lg:flex items-center justify-between gap-3 px-8 h-[68px] shrink-0">
          <button type="button" onClick={goBack} className={`${backButtonBase} -ml-3 text-content-secondary hover:text-content-primary hover:bg-brand-accent/5`}>
            <ArrowBackRoundedIcon fontSize="small" aria-hidden="true" />
            Back
          </button>
          <ThemeToggleButton />
        </div>

        {/* Form sheet */}
        <div className="relative flex-1 -mt-6 lg:mt-0 rounded-t-[28px] lg:rounded-none bg-background-primary flex items-start lg:items-center justify-center px-5 sm:px-8 pt-8 lg:pt-4 pb-12">
          <div className={`relative w-full min-w-0 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
            <header className="mb-7">
              <h1 id={titleId} className="m-0 font-display text-[2rem] sm:text-[2.4rem] leading-tight font-semibold text-content-primary">
                {title}
              </h1>
              {subtitle && <div className="mt-2 text-content-secondary">{subtitle}</div>}
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
