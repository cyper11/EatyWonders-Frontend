import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/backend';
import { setAuth as saveAuthToLocal, clearAuth as clearAuthFromLocal, getUser, getToken } from '../utils/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getUser());
  const [token, setToken] = useState(getToken());
  const [ownerPlaces, setOwnerPlaces] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [loading, setLoading] = useState(true); // Session rehydration loading state

  const [impersonatedUser, setImpersonatedUser] = useState(() => {
    const saved = localStorage.getItem('impersonatedUser');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (newToken, newUser) => {
    saveAuthToLocal(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (newUser) => {
    saveAuthToLocal(token, newUser);
    setUser(newUser);
  };

  const logout = useCallback(async () => {
    // Check if user is admin or on an admin path before clearing state
    const isAdmin = user?.role === 'admin' || window.location.pathname.startsWith('/admin');

    // Call backend logout to clear HttpOnly cookie
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout API call failed:', err);
    }
    // Clear local state
    clearAuthFromLocal();
    localStorage.removeItem('impersonatedUserId');
    localStorage.removeItem('impersonatedUser');
    setToken('');
    setUser(null);
    setImpersonatedUser(null);
    setOwnerPlaces([]);

    // Redirect based on the context before logout
    // window.location.href is used intentionally here because AuthProvider is a PARENT of
    // the React Router <Router>, so useNavigate() cannot be called in this scope.
    // The ghost-login fix is handled by the backend noCache middleware on /auth/me,
    // and by navigate({replace:true}) in DashboardLayout and Login (which ARE inside the Router).
    if (isAdmin) {
      if (typeof window !== 'undefined' && (window.location.hostname === 'admin.eatywonders.com' || window.location.hostname.startsWith('admin.'))) {
        window.location.href = '/admin-gateway-secure';
      } else {
        window.location.href = 'https://admin.eatywonders.com';
      }
    } else {
      window.location.href = '/login';
    }
  }, [user]);

  const startImpersonation = useCallback(async (targetUser) => {
    if (!targetUser?.id) return;

    // In the Dual-Identity pattern, we keep our admin token
    // and just tell the API client to send the target ID in a header.
    localStorage.setItem('impersonatedUserId', targetUser.id);
    localStorage.setItem('impersonatedUser', JSON.stringify(targetUser));
    setImpersonatedUser(targetUser);

    // Redirect to home to see the app as that user
    window.location.href = '/';
  }, []);

  const stopImpersonation = useCallback(() => {
    localStorage.removeItem('impersonatedUserId');
    localStorage.removeItem('impersonatedUser');
    setImpersonatedUser(null);

    // Redirect back to admin dashboard
    if (typeof window !== 'undefined' && (window.location.hostname === 'admin.eatywonders.com' || window.location.hostname.startsWith('admin.'))) {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = 'https://admin.eatywonders.com';
    }
  }, []);

  // Session Rehydration: Check if user is still authenticated via HttpOnly cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.user) {
          setUser(data.user);
          saveAuthToLocal(null, data.user);
        } else {
          setUser(null);
          clearAuthFromLocal();
        }
      } catch (err) {
        setUser(null);
        clearAuthFromLocal();
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const fetchOwnerPlaces = useCallback(async () => {
    if (ownerPlaces.length > 0) return; // Prevent duplicate calls if already loaded

    setIsLoadingPlaces(true);
    try {
      const response = await api.get('/api/owner/places/all');
      // The backend returns { places: [...] }
      if (response.data && response.data.places && Array.isArray(response.data.places)) {
        setOwnerPlaces(response.data.places);
      } else if (Array.isArray(response.data)) {
        // Fallback for legacy array responses
        setOwnerPlaces(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch owner places:', error);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [ownerPlaces.length]);

  // Auto-fetch if user is logged in (optional, or components can call it)
  useEffect(() => {
    if (user) {
      fetchOwnerPlaces();
    }
  }, [user, fetchOwnerPlaces]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      updateUser,
      impersonatedUser,
      startImpersonation,
      stopImpersonation,
      ownerPlaces,
      setOwnerPlaces,
      fetchOwnerPlaces,
      isLoadingPlaces,
      loading, // Export loading state for protected routes
      isOwner: user?.role === 'owner',
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
