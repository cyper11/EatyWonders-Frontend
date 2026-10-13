import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Avatar,
  useMediaQuery,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Drawer,
  Chip,
} from "@mui/material";
import { useNavigate, NavLink, Link, useLocation } from "react-router-dom";
import Button from "./ui/Button";
import Logout from "@mui/icons-material/Logout";
import Settings from "@mui/icons-material/Settings";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import ProfileEditForm from "../pages/ProfileEdit";
import { API_BASE_URL } from "../api/backend";
import { useAuth } from "../context/AuthContext";
import ThemeToggleButton from "./ui/ThemeToggleButton";
import { useTheme } from "../context/ThemeContext";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

// ─── Brand lockup ─────────────────────────────────────────────────────────────
export function BrandMark({ compact = false, onClick }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="flex items-center gap-2.5 no-underline rounded-full pr-2 shrink-0"
      aria-label="Eaty Wonders home"
    >
      <img
        src="/GreenSimpleCleanVeganFoodLogo.png"
        alt=""
        width="40"
        height="40"
        className="w-9 h-9 min-[400px]:w-10 min-[400px]:h-10 rounded-full object-cover ring-1 ring-black/5"
      />
      {!compact && (
        <span className="max-[359px]:hidden font-display text-[1.1rem] min-[400px]:text-[1.35rem] font-semibold tracking-tight text-content-primary leading-none whitespace-nowrap">
          Eaty Wonders
        </span>
      )}
    </Link>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  if (role !== "owner") return null;
  return (
    <Chip
      label="Owner"
      size="small"
      sx={{
        height: 20,
        fontSize: "0.65rem",
        fontWeight: 800,
        letterSpacing: "0.06em",
        bgcolor: "var(--brand-accent-soft)",
        color: "var(--accent)",
        border: "1px solid var(--border-brand)",
        borderRadius: "6px",
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
}

// ─── Desktop nav link ─────────────────────────────────────────────────────────
const navLinkClass = (active) =>
  `inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[0.92rem] font-semibold no-underline whitespace-nowrap transition-[background-color,color,box-shadow] duration-200 ${
    active
      ? "bg-surface text-brand-accent shadow-card"
      : "text-content-secondary hover:text-content-primary"
  }`;

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} end className={({ isActive }) => navLinkClass(isActive)}>
      {icon}
      {label}
    </NavLink>
  );
}

function HomeLink({ icon }) {
  const location = useLocation();
  const active = location.pathname === "/" && !location.hash;
  return (
    <Link to="/" className={navLinkClass(active)} aria-current={active ? "page" : undefined}>
      {icon}
      Home
    </Link>
  );
}

function SectionLink({ hash, icon, label }) {
  const location = useLocation();
  const active = location.pathname === "/" && location.hash === `#${hash}`;
  return (
    <Link to={`/#${hash}`} className={navLinkClass(active)}>
      {icon}
      {label}
    </Link>
  );
}

function UserAvatar({ user, src, size = 36 }) {
  return (
    <Avatar
      src={src}
      alt={user?.name || user?.email}
      sx={{
        width: size,
        height: size,
        fontSize: size > 36 ? "1rem" : "0.85rem",
        fontWeight: 700,
        bgcolor: "var(--accent)",
        color: "var(--on-accent)",
        border: "2px solid var(--surface)",
        boxShadow: "0 0 0 1px var(--border-brand)",
      }}
    >
      {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
    </Avatar>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
const Header = () => {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastScroll = useRef(0);
  const isMobile = useMediaQuery("(max-width:899px)");
  const isPhone = useMediaQuery("(max-width:599px)");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isOwner, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const avatarSrc = user?.profile_url ? `${API_BASE_URL}${user.profile_url}` : undefined;
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);
  const [editOpen, setEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hide on scroll down, reveal on scroll up (never hides near the top)
  useEffect(() => {
    const onScroll = () => {
      const y = window.pageYOffset || document.documentElement.scrollTop;
      setScrolled(y > 8);
      setHidden(y > 240 && y > lastScroll.current);
      lastScroll.current = Math.max(0, y);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on navigation
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDrawerOpen(false);
  };

  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  // ── Account sheet items (phones; opened from the bottom bar avatar) ──
  const accountItems = [
    { key: 'profile', label: 'My profile', icon: <PersonOutlineOutlinedIcon fontSize="small" />, onClick: () => navigate('/profile') },
    ...(isOwner ? [{ key: 'owner', label: 'My posts', icon: <CollectionsBookmarkOutlinedIcon fontSize="small" />, onClick: () => navigate('/owner') }] : []),
    { key: 'edit', label: 'Edit profile', icon: <Settings fontSize="small" />, onClick: () => setEditOpen(true) },
    ...(isOwner ? [{ key: 'support', label: 'Help & support', icon: <HelpOutlineIcon fontSize="small" />, onClick: () => navigate('/support') }] : []),
  ];

  // The bottom bar (MobileNav) asks for the account sheet via a window event.
  useEffect(() => {
    const open = () => setDrawerOpen(true);
    window.addEventListener('ew:open-account', open);
    return () => window.removeEventListener('ew:open-account', open);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[1100] transition-[transform,background-color,box-shadow,border-color] duration-300 border-b ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${
          scrolled
            ? "glass !border-x-0 !border-t-0 rounded-none"
            : "bg-background-primary border-transparent"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto h-[var(--header-h)] px-4 sm:px-6 lg:px-8 flex items-center gap-3 min-[900px]:grid min-[900px]:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center min-w-0 min-[900px]:justify-self-start">
            <BrandMark />
          </div>

          {/* ── Desktop navigation (centered) ── */}
          {!isMobile && (
            <nav aria-label="Main" className="flex items-center gap-0.5 p-1 rounded-full bg-background-secondary border border-subtle justify-self-center">
              <HomeLink icon={<HomeOutlinedIcon sx={{ fontSize: 18 }} />} />
              <SectionLink hash="nearby" icon={<PlaceOutlinedIcon sx={{ fontSize: 18 }} />} label="Nearby" />
              <SectionLink hash="map" icon={<MapOutlinedIcon sx={{ fontSize: 18 }} />} label="Map" />
              {user && <NavItem to="/feed" icon={<DynamicFeedOutlinedIcon sx={{ fontSize: 18 }} />} label="Feed" />}
              {user && isOwner && (
                <NavItem to="/owner" icon={<CollectionsBookmarkOutlinedIcon sx={{ fontSize: 18 }} />} label="My posts" />
              )}
            </nav>
          )}

          <div className="flex-1 min-[900px]:hidden" />

          <div className="flex items-center gap-2 min-[900px]:justify-self-end">
            <div className={!user && isMobile ? "hidden min-[480px]:block" : ""}>
              <ThemeToggleButton />
            </div>

            {loading ? (
              <span className="w-10 h-10 rounded-full skeleton" aria-hidden="true" />
            ) : !user ? (
              <div className="flex items-center gap-1.5 min-[400px]:gap-2 ml-1">
                <Button variant="ghost" size={isMobile ? "sm" : "md"} className="h-11 !px-3 min-[400px]:!px-4" onClick={() => navigate("/login")}>Log in</Button>
                <Button variant="primary" size={isMobile ? "sm" : "md"} className="h-11 !shadow-none !px-4 min-[400px]:!px-5" onClick={() => navigate("/register")}>Sign up</Button>
              </div>
            ) : !isMobile && (
              <IconButton
                id="header-avatar-btn"
                aria-label="Open account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen ? "true" : undefined}
                onClick={openMenu}
                sx={{ p: 0.5 }}
              >
                <UserAvatar user={user} src={avatarSrc} />
              </IconButton>
            )}


          </div>
        </div>
      </header>

      {/* ── Account dropdown ── */}
      {user && (
        <Menu
          anchorEl={menuAnchor}
          open={menuOpen}
          onClose={closeMenu}
          transformOrigin={{ horizontal: "right", vertical: "top" }}
          anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          PaperProps={{ elevation: 8, sx: { mt: 1, minWidth: 240 } }}
        >
          <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            <UserAvatar user={user} src={avatarSrc} size={40} />
            <Box sx={{ overflow: "hidden", minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <span className="font-bold text-content-primary truncate max-w-[140px]">{user?.name || "User"}</span>
                <RoleBadge role={user?.role} />
              </Box>
              <span className="block text-xs text-content-secondary truncate max-w-[170px]">{user?.email}</span>
            </Box>
          </Box>
          <Divider />
          <MenuItem id="menu-profile" onClick={() => { closeMenu(); navigate("/profile"); }}>
            <ListItemIcon><PersonOutlineOutlinedIcon fontSize="small" /></ListItemIcon>
            My profile
          </MenuItem>
          <MenuItem id="menu-edit-profile" onClick={() => { closeMenu(); setEditOpen(true); }}>
            <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
            Edit profile
          </MenuItem>
          {isOwner && (
            <MenuItem id="menu-support" onClick={() => { closeMenu(); navigate("/support"); }}>
              <ListItemIcon><HelpOutlineIcon fontSize="small" /></ListItemIcon>
              Help &amp; support
            </MenuItem>
          )}
          <Divider />
          <MenuItem id="menu-logout" onClick={() => { closeMenu(); handleLogout(); }} sx={{ color: "error.main" }}>
            <ListItemIcon><Logout fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
            Log out
          </MenuItem>
        </Menu>
      )}

      {/* ── Account sheet (phones) ── */}
      {user && (
        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: {
              bgcolor: "var(--glass-bg-strong)",
              backdropFilter: "blur(24px) saturate(185%)",
              WebkitBackdropFilter: "blur(24px) saturate(185%)",
              borderTop: "1px solid var(--glass-border)",
              boxShadow: "inset 0 1px 0 var(--glass-highlight), 0 -12px 40px -12px rgba(0,0,0,0.35)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxWidth: 520,
              mx: "auto",
              width: "100%",
            },
          }}
        >
          <div role="dialog" aria-label="Account" className="px-4 pt-2" style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-content-muted/40" aria-hidden="true" />
            <div className="flex items-center gap-3 p-3 rounded-card bg-surface border border-subtle">
              <UserAvatar user={user} src={avatarSrc} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-content-primary truncate">{user?.name || "User"}</span>
                  <RoleBadge role={user?.role} />
                </div>
                <span className="block text-sm text-content-secondary truncate">{user?.email}</span>
              </div>
              <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close account menu" sx={{ color: "var(--text-secondary)", width: 44, height: 44 }}>
                <CloseIcon />
              </IconButton>
            </div>

            <ul className="list-none m-0 mt-2 p-0">
              {accountItems.map((item) => (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={() => { setDrawerOpen(false); item.onClick(); }}
                    className="w-full flex items-center gap-3 min-h-[52px] px-3 rounded-xl font-semibold text-content-primary hover:bg-brand-accent/5 text-left"
                  >
                    <span className="flex text-content-muted">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-full flex items-center gap-3 min-h-[52px] px-3 rounded-xl font-semibold text-content-primary hover:bg-brand-accent/5 text-left"
                >
                  <span className="flex text-content-muted">
                    {theme === "dark" ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
                  </span>
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </button>
              </li>
            </ul>

            <div className="mt-2 pt-2 border-t border-subtle">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 min-h-[52px] px-3 rounded-xl font-semibold text-danger hover:bg-danger/10 text-left"
              >
                <Logout fontSize="small" /> Log out
              </button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Edit Profile modal */}
      {user && (
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth fullScreen={isPhone} maxWidth="sm" aria-labelledby="edit-profile-title">
          <DialogTitle id="edit-profile-title" sx={{ m: 0, p: 2.5, pr: 7, fontFamily: "var(--font-display)", fontWeight: 600 }}>
            Edit profile
            <IconButton aria-label="Close" onClick={() => setEditOpen(false)} sx={{ position: "absolute", right: 12, top: 12 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <ProfileEditForm onClose={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default Header;
