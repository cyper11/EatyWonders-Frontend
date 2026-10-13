import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ImpersonationBanner from './ImpersonationBanner';
import SurpriseMePopup from './SurpriseMePopup';
import MobileNav from './MobileNav';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children, noContainer = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isAdminSubdomain = typeof window !== 'undefined' &&
    (window.location.hostname === 'admin.eatywonders.com' ||
     window.location.hostname === 'admin.localhost' ||
     (window.location.hostname !== 'eatywonders.com' && window.location.hostname.startsWith('admin.')));
  const isAuthPath = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isAdminPath = isAdminSubdomain || location.pathname.startsWith('/admin') || location.pathname === '/admin-gateway-secure';
  const isMaintenancePath = location.pathname === '/maintenance';
  const showNav = !isAdminPath && !isAuthPath && !isMaintenancePath;
  const bannerOffsetClass = user?.isImpersonated ? 'pt-10' : '';
  const contained = !(noContainer || isAdminPath || isAuthPath);

  return (
    <div className={`min-h-dvh flex flex-col bg-background-primary text-content-primary ${bannerOffsetClass}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ImpersonationBanner />
      {showNav && <Header />}

      <main
        id="main-content"
        tabIndex={-1}
        className={`flex-grow outline-none ${showNav ? 'pt-[calc(var(--header-h)+env(safe-area-inset-top,0px))]' : ''} ${
          contained ? 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12' : ''
        }`}
      >
        {children}
      </main>

      {showNav && <Footer />}
      {showNav && <MobileNav />}
      <SurpriseMePopup />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
};

export default Layout;
