import React, { useState, useEffect, Suspense, lazy } from "react";
import { Grid, CircularProgress, Box } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import List from "./components/List";
import Map from "./components/Map/Map";
import Hero from "./components/Hero";
import NearbyRestaurants from "./components/NearbyRestaurants";
import AskAI from "./components/AskAI";
import RoleRoute from './components/RoleRoute';
import Layout from "./components/Layout";
import { getPlacesData } from "./api/apiService";
import api from './api/backend';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import "./style/global.css";

// Check whether current hostname is the isolated admin subdomain
const isAdminSubdomain =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'admin.eatywonders.com' ||
   window.location.hostname === 'admin.localhost' ||
   (window.location.hostname !== 'eatywonders.com' && window.location.hostname.startsWith('admin.')));

// Stealth Redirect Component: Immediately redirects legacy admin paths on public domain to isolated admin subdomain
const AdminRedirect = () => {
  useEffect(() => {
    window.location.replace("https://admin.eatywonders.com");
  }, []);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <CircularProgress size={36} />
    </Box>
  );
};

// Code-split all pages — each route is a separate JS chunk downloaded on-demand.
// Users on the home page never download AdminDashboard (38 kB) or Register (32 kB).
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const UserPage = lazy(() => import('./pages/User'));
const Profile = lazy(() => import('./pages/ProfilePage'));
const UserFeed = lazy(() => import('./pages/UserFeed'));
const OwnerUpload = lazy(() => import('./pages/OwnerUpload'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const OwnerSupport = lazy(() => import('./pages/OwnerSupport'));
const RestaurantDetail = lazy(() => import('./pages/RestaurantDetail'));
const StyleGuide = lazy(() => import('./pages/StyleGuide'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));

// Fallback shown while each page chunk is downloading
const PageLoader = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
    <CircularProgress size={36} />
  </Box>
);

function scrollToMap(behavior = 'smooth') {
  window.requestAnimationFrame(() => {
    const mapSection = document.getElementById('map');
    if (mapSection) mapSection.scrollIntoView({ behavior, block: 'start' });
  });
}

const MainApp = () => {
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [childClicked, setChildClicked] = useState(null);
  const [coordinates, setCoordinates] = useState({});
  const [userLocation, setUserLocation] = useState(null);
  const [bounds, setBounds] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState("restaurants");
  const [rating, setRating] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploads, setUploads] = useState([]);
  const [posts, setPosts] = useState([]);
  const { ownerPlaces, fetchOwnerPlaces } = useAuth();
  const [mapFocus, setMapFocus] = useState(null);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const latParam = params.get('lat');
    const lngParam = params.get('lng');
    const ownerPlaceId = params.get('ownerPlaceId') || null;
    const targetLat = Number(latParam);
    const targetLng = Number(lngParam);
    const hasTargetCoordinates = Number.isFinite(targetLat) && Number.isFinite(targetLng);
    const shouldFocusMap = hasTargetCoordinates || params.get('focus') === 'map' || location.hash === '#map';

    if (hasTargetCoordinates || ownerPlaceId) {
      if (hasTargetCoordinates) setCoordinates({ lat: targetLat, lng: targetLng });
      setMapFocus({
        lat: hasTargetCoordinates ? targetLat : null,
        lng: hasTargetCoordinates ? targetLng : null,
        ownerPlaceId,
        preferCoordinates: params.get('source') === 'post',
      });
      scrollToMap('auto');
    } else if (shouldFocusMap) {
      scrollToMap('auto');
    } else {
      setMapFocus(null);
    }
    // Always attempt to get the real user geolocation for "Nearby"
    try {
      navigator.geolocation.getCurrentPosition(({ coords: { latitude, longitude } }) => {
        setUserLocation({ lat: latitude, lng: longitude });
        // If coordinates not explicitly set (no query), initialize map to user
        if (!hasTargetCoordinates) setCoordinates({ lat: latitude, lng: longitude });
      });
    } catch { }
  }, [location.search, location.hash]);

  useEffect(() => {
    if (places) {
      const filtered = places.filter((place) => place.rating > rating);
      setFilteredPlaces(filtered);
    }
  }, [rating, places]);

  useEffect(() => {
    if (bounds.sw && bounds.ne) {
      setIsLoading(true);
      getPlacesData(type, bounds.sw, bounds.ne).then((data) => {
        setPlaces(data?.filter((place) => place.name && place.num_reviews > 0));
        setFilteredPlaces([]);
        setIsLoading(false);
      });
    }
  }, [type, bounds]);

  useEffect(() => {
    (async () => {
      const [uploadsRes, postsRes] = await Promise.all([
        api.get('/api/uploads').catch(() => null),
        api.get('/api/uploads/posts').catch(() => null)
      ]);

      if (uploadsRes?.data) setUploads(uploadsRes.data);
      if (postsRes?.data) setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);

      // ownerPlaces is now handled by AuthContext via fetchOwnerPlaces
      fetchOwnerPlaces();
    })();
  }, [fetchOwnerPlaces]);

  useEffect(() => {
    if (!mapFocus) return undefined;
    const timer = window.setTimeout(() => scrollToMap('auto'), 80);
    return () => window.clearTimeout(timer);
  }, [mapFocus, ownerPlaces.length, posts.length, uploads.length]);

  return (
    <>
      <Hero searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <Grid container spacing={3} id="list-content">
        <Grid item xs={12}>
          <NearbyRestaurants
            userCoords={userLocation}
            coordinates={coordinates}
            ownerPlaces={ownerPlaces}
            setCoordinates={setCoordinates}
            uploads={uploads}
            posts={posts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </Grid>
        <Grid item xs={12} id="explore-map-section">
          <Map
            setCoordinates={setCoordinates}
            setBounds={setBounds}
            coordinates={coordinates}
            places={filteredPlaces.length ? filteredPlaces : places}
            setChildClicked={setChildClicked}
            uploads={uploads}
            ownerPlaces={ownerPlaces}
            mapFocus={mapFocus}
          />
        </Grid>
        <Grid item xs={12}>
          <List
            places={filteredPlaces.length ? filteredPlaces : places}
            childClicked={childClicked}
            isLoading={isLoading}
            type={type}
            setType={setType}
            rating={rating}
            setRating={setRating}
            uploads={uploads}
            posts={posts}
          />
        </Grid>
      </Grid>
      <AskAI />
    </>
  );
};

const App = () => {
  const AppWithProviders = (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {isAdminSubdomain ? (
                  <>
                    {/* Isolated Admin Subdomain Routes */}
                    <Route path="/" element={<RoleRoute roles={["admin"]} element={<AdminDashboard />} />} />
                    <Route path="/admin" element={<RoleRoute roles={["admin"]} element={<AdminDashboard />} />} />
                    <Route path="/admin/dashboard" element={<RoleRoute roles={["admin"]} element={<AdminDashboard />} />} />
                    <Route path="/dashboard" element={<RoleRoute roles={["admin"]} element={<AdminDashboard />} />} />
                    <Route path="/admin-gateway-secure" element={<AdminLogin />} />
                    <Route path="/login" element={<AdminLogin />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  <>
                    {/* Public Tourist Routes */}
                    <Route path="/" element={<MainApp />} />
                    {/* Post & media detail */}
                    <Route path="/post/:id" element={<PostDetail />} />
                    <Route path="/posts/:id" element={<PostDetail />} />
                    {/* Restaurant detail */}
                    <Route path="/restaurants/:id" element={<RestaurantDetail />} />
                    <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                    {/* Public user profile */}
                    <Route path="/user/:id" element={<PublicProfile />} />
                    <Route path="/profile/:id" element={<PublicProfile />} />
                    {/* Auth pages */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Legacy Admin Paths: Immediate Stealth Redirect to isolated admin subdomain */}
                    <Route path="/admin" element={<AdminRedirect />} />
                    <Route path="/admin/*" element={<AdminRedirect />} />
                    <Route path="/admin-gateway-secure" element={<AdminRedirect />} />

                    {/* Authenticated user pages */}
                    <Route path="/user" element={<RoleRoute roles={["user", "end_user", "owner", "admin"]} element={<UserPage />} />} />
                    <Route path="/profile" element={<RoleRoute roles={["user", "end_user", "owner", "admin"]} element={<Profile />} />} />
                    <Route path="/profile/edit" element={<RoleRoute roles={["user", "end_user", "owner", "admin"]} element={<Profile />} />} />
                    {/* /feed is canonical; /user-page kept as alias for backward compat */}
                    <Route path="/feed" element={<RoleRoute roles={["user", "end_user", "owner", "admin"]} element={<UserFeed />} />} />
                    <Route path="/user-page" element={<RoleRoute roles={["user", "end_user", "owner", "admin"]} element={<UserFeed />} />} />
                    {/* /owner is canonical; /owner-page kept as alias */}
                    <Route path="/owner" element={<RoleRoute roles={["owner", "admin"]} element={<OwnerUpload />} />} />
                    <Route path="/owner-page" element={<RoleRoute roles={["owner", "admin"]} element={<OwnerUpload />} />} />
                    {/* Help & Support hub — owners and admins only */}
                    <Route path="/support" element={<RoleRoute roles={["owner", "admin"]} element={<OwnerSupport />} />} />
                    {/* Utility */}
                    <Route path="/styleguide" element={<StyleGuide />} />
                    <Route path="/maintenance" element={<Maintenance />} />
                  </>
                )}
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );

  return AppWithProviders;
};

export default App;
