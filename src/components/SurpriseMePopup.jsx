import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../api/backend';

export default function SurpriseMePopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Role check: Only visible to tourists (end_user / user)
  if (!user || (user.role !== 'end_user' && user.role !== 'user') || !isVisible) {
    return null;
  }

  const handleSurpriseMe = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      setIsLoading(true);
      const res = await api.get('/api/restaurants/surpriseme');
      if (res.data && res.data.id) {
        toast.info(`🎲 Taking you to ${res.data.name || 'a mystery spot'}!`, {
          icon: '✨',
        });
        navigate(`/restaurant/${res.data.id}`);
      } else {
        toast.warning('No approved restaurants found right now.');
      }
    } catch (err) {
      console.error('[Surprise Me] Error fetching random restaurant:', err);
      toast.error('Failed to find a surprise spot. Please try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  return (
    <aside
      aria-label="Surprise Me Recommendation"
      className="fixed bottom-6 right-6 md:bottom-8 z-50 animate-fade-in-up select-none"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleSurpriseMe}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSurpriseMe(e);
          }
        }}
        className="group relative bg-brand-accent text-white p-4 pr-10 rounded-2xl shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform border border-white/20 backdrop-blur-sm max-w-xs md:max-w-sm"
      >
        {/* Animated Adventure Icon */}
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0 group-hover:rotate-12 transition-transform duration-300">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            '🧭'
          )}
        </div>

        {/* Text Content */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-white/90 leading-tight">
            Want to have an adventure?
          </span>
          <span className="text-sm font-bold text-white flex items-center gap-1 leading-snug">
            ✨ Surprise Me!
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss adventure popup"
          className="absolute top-2 right-2 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
