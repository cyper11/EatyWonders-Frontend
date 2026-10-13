import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useAuth } from '../context/AuthContext';
import api from '../api/backend';

const DISMISS_KEY = 'ew_surprise_dismissed';

export default function SurpriseMePopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) !== '1'; } catch { return true; }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Only for tourists (end_user / user), and not on pages where it would cover a form
  const hiddenOnPath = ['/login', '/register', '/forgot-password', '/reset-password', '/maintenance'].includes(location.pathname);
  if (!user || (user.role !== 'end_user' && user.role !== 'user') || !isVisible || hiddenOnPath) {
    return null;
  }

  const handleSurpriseMe = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      const res = await api.get('/api/restaurants/surpriseme');
      if (res.data && res.data.id) {
        toast.info(`Taking you to ${res.data.name || 'a mystery spot'}!`);
        navigate(`/restaurant/${res.data.id}`);
      } else {
        toast.warning('No approved restaurants found right now.');
      }
    } catch (err) {
      console.error('[Surprise Me] Error fetching random restaurant:', err);
      toast.error("Couldn't find a surprise spot. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  return (
    <aside
      aria-label="Surprise me"
      className="fixed z-50 right-4 sm:right-6 bottom-[calc(84px+env(safe-area-inset-bottom,0px))] min-[900px]:bottom-[calc(16px+env(safe-area-inset-bottom,0px))] animate-fade-in-up flex items-center gap-1 pl-1 pr-1 py-1 rounded-full bg-[var(--forest-800)] text-white shadow-float"
    >
      <button
        type="button"
        onClick={handleSurpriseMe}
        disabled={isLoading}
        aria-busy={isLoading}
        className="flex items-center gap-2.5 min-h-[44px] pl-2 pr-3 rounded-full font-semibold text-sm hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span className="w-8 h-8 rounded-full grid place-items-center bg-[var(--leaf-300)] text-[#12251a]" aria-hidden="true">
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-[#12251a]/30 border-t-[#12251a] rounded-full animate-spin" />
          ) : (
            <CasinoOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </span>
        <span>{isLoading ? 'Finding a spot…' : 'Surprise me'}</span>
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss surprise me"
        className="w-9 h-9 grid place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <CloseRoundedIcon sx={{ fontSize: 18 }} />
      </button>
    </aside>
  );
}
