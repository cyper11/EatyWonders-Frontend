import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ImpersonationBanner from './ImpersonationBanner';
import SurpriseMePopup from './SurpriseMePopup';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children, maxWidth = "xl", noContainer = false }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdminSubdomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'admin.eatywonders.com' || 
     window.location.hostname === 'admin.localhost' || 
     (window.location.hostname !== 'eatywonders.com' && window.location.hostname.startsWith('admin.')));
  const isAuthPath = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  const isAdminPath = isAdminSubdomain || location.pathname.startsWith('/admin') || location.pathname === '/admin-gateway-secure';
  const isMaintenancePath = location.pathname === '/maintenance';
  const showNav = !isAdminPath && !isAuthPath && !isMaintenancePath;
  const bannerOffsetClass = user?.isImpersonated ? 'pt-10' : '';

  return (
    <div className={`min-h-dvh flex flex-col bg-background-primary text-content-primary transition-colors duration-300 ${bannerOffsetClass}`}>
      <ImpersonationBanner />
      {showNav && <Header />}
      
      <main className={`flex-grow ${isAdminPath ? '' : 'pt-20 pb-12'} ${noContainer || isAdminPath ? '' : 'max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8'}`}>
        <div id="main-content">
          {children}
        </div>
      </main>

      {showNav && <Footer />}
      <SurpriseMePopup />
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
};

export default Layout;
