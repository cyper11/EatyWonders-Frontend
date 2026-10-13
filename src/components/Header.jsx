import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
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
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import { useNavigate, NavLink } from "react-router-dom";
import Button from "./ui/Button";
import Logout from "@mui/icons-material/Logout";
import Settings from "@mui/icons-material/Settings";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import MenuIcon from "@mui/icons-material/Menu";
import DynamicFeedOutlinedIcon from "@mui/icons-material/DynamicFeedOutlined";
import CollectionsBookmarkOutlinedIcon from "@mui/icons-material/CollectionsBookmarkOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ProfileEditForm from "../pages/ProfileEdit";
import { API_BASE_URL } from "../api/backend";
import { useAuth } from "../context/AuthContext";
import ThemeToggleButton from "./ui/ThemeToggleButton";

// ─── Styled components ────────────────────────────────────────────────────────

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "hide",
})(({ theme, hide }) => ({
  background:
    "linear-gradient(115deg, var(--bg-primary) 0%, var(--bg-secondary) 45%, var(--bg-tertiary) 100%)",
  color: "var(--text-primary)",
  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
  backdropFilter: "saturate(160%) blur(6px)",
  transition: "top 0.3s",
  zIndex: theme.zIndex.drawer + 1,
  top: hide ? "-72px" : "0px",
}));

const LogoContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginLeft: -4,
  cursor: "pointer",
});


// ─── Desktop nav pill ─────────────────────────────────────────────────────────
const NavPill = styled("span")(() => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontWeight: 700,
  fontSize: "0.92rem",
  padding: "5px 12px",
  borderRadius: 999,
  transition: "background 180ms, color 180ms",
  color: "var(--text-primary)",
  background: "transparent",
  border: "1px solid transparent",
  textDecoration: "none",
  cursor: "pointer",
  "&:hover": {
    background: "var(--brand-accent-soft)",
    color: "var(--accent)",
    border: "1px solid var(--border-brand)",
  },
  "&[data-active='true']": {
    color: "var(--accent)",
    background: "var(--brand-accent-soft)",
    border: "1px solid var(--border-brand)",
  }
}));

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  if (role === "owner")
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
  return null;
}

// ─── Reusable nav link wrapper that applies NavPill active styles ─────────────
function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <NavPill data-active={isActive ? "true" : undefined}>
          {icon}
          {label}
        </NavPill>
      )}
    </NavLink>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────
const Header = () => {
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [scrollDirection, setScrollDirection] = useState("up");
  const isMobile = useMediaQuery("(max-width:768px)");
  const navigate = useNavigate();
  const { user, logout, isOwner, loading } = useAuth();
  const avatarSrc = user?.profile_url
    ? `${API_BASE_URL}${user.profile_url}`
    : undefined;
  const [menuAnchor, setMenuAnchor] = useState(null);
  const menuOpen = Boolean(menuAnchor);
  const [editOpen, setEditOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Hide header on scroll down, reveal on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setScrollDirection(currentScrollTop > lastScrollTop ? "down" : "up");
      setLastScrollTop(currentScrollTop <= 0 ? 0 : currentScrollTop);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollTop]);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDrawerOpen(false);
  };

  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const goHome = () => navigate("/");

  // ── Mobile drawer nav items — categorized ──
  const drawerSections = [];

  // MAIN section
  const mainItems = [
    { to: "/", icon: <HomeOutlinedIcon fontSize="small" />, label: "Home" },
  ];
  if (user) {
    mainItems.push({ to: "/feed", icon: <DynamicFeedOutlinedIcon fontSize="small" />, label: "Feed" });
  }
  drawerSections.push({ heading: "MAIN", items: mainItems });

  // PERSONAL section
  if (user) {
    const personalItems = [
      { to: "/profile", icon: <PersonOutlineOutlinedIcon fontSize="small" />, label: "My Profile" },
    ];
    if (isOwner) {
      personalItems.push({ to: "/owner", icon: <CollectionsBookmarkOutlinedIcon fontSize="small" />, label: "My Posts" });
    }
    drawerSections.push({ heading: "PERSONAL", items: personalItems });
  }

  // SYSTEM section
  if (user) {
    const systemItems = [];
    if (isOwner) {
      systemItems.push({ to: "/support", icon: <HelpOutlineIcon fontSize="small" />, label: "Help & Support" });
    }
    if (systemItems.length > 0) {
      drawerSections.push({ heading: "SYSTEM", items: systemItems });
    }
  }

  return (
    <>
      <StyledAppBar position="fixed" hide={scrollDirection === "down"}>
        <Toolbar sx={{ pl: 1, pr: "calc(env(safe-area-inset-right, 0px) + 16px)", minHeight: 64 }}>
          {/* Logo */}
          <LogoContainer onClick={goHome}>
            <Avatar src="/GreenSimpleCleanVeganFoodLogo.png" alt="Eaty Wonders" sx={{ width: 38, height: 38 }} />
            {!isMobile && (
              <Typography
                variant="h5"
                sx={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}
              >
                Eaty Wonders
              </Typography>
            )}
          </LogoContainer>

          <Box sx={{ flexGrow: 1 }} />

          {/* ── DESKTOP ── */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ThemeToggleButton />

              {loading ? (
                <Box sx={{ width: 40, height: 40, borderRadius: "50%", bgcolor: "var(--brand-accent-soft)", animation: "pulse 1.5s infinite" }} />
              ) : !user ? (
                /* Logged out */
                <Box sx={{ display: "flex", gap: 1.5, ml: 1 }}>
                  <Button variant="outline" onClick={() => navigate("/login")}>Log In</Button>
                  <Button variant="primary" onClick={() => navigate("/register")}>Sign Up</Button>
                </Box>
              ) : (
                /* Logged in */
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 0.5 }}>
                  <NavItem to="/" icon={<HomeOutlinedIcon sx={{ fontSize: 15 }} />} label="Home" />
                  <NavItem to="/feed" icon={<DynamicFeedOutlinedIcon sx={{ fontSize: 15 }} />} label="Feed" />

                  {isOwner && (
                    <NavItem to="/owner" icon={<CollectionsBookmarkOutlinedIcon sx={{ fontSize: 15 }} />} label="My Posts" />
                  )}

                  {/* Divider */}
                  <Box sx={{ width: 1, height: 24, bgcolor: "var(--border-subtle)", mx: 0.5 }} />

                  {/* Avatar menu trigger */}
                  <IconButton
                    id="header-avatar-btn"
                    aria-label="account menu"
                    onClick={openMenu}
                    sx={{ p: 0.5, ml: 0.5 }}
                  >
                    <Avatar
                      src={avatarSrc}
                      alt={user?.name || user?.email}
                      sx={{
                        width: 36,
                        height: 36,
                        border: "2px solid var(--border-brand)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        bgcolor: "var(--accent)",
                        color: "#fff",
                      }}
                    >
                      {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Box>
              )}
            </Box>
          )}

          {/* ── MOBILE ── */}
          {isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ThemeToggleButton />
              {!loading && !user && (
                <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                  Log In
                </Button>
              )}
              {!loading && user && (
                <IconButton
                  id="header-avatar-btn-mobile"
                  aria-label="account menu"
                  onClick={openMenu}
                  sx={{ p: 0.5 }}
                >
                  <Avatar
                    src={avatarSrc}
                    alt={user?.name || user?.email}
                    sx={{
                      width: 34,
                      height: 34,
                      border: "2px solid var(--border-brand)",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      bgcolor: "var(--accent)",
                      color: "#fff",
                    }}
                  >
                    {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                  </Avatar>
                </IconButton>
              )}
              {/* Hamburger */}
              <IconButton
                id="header-menu-btn"
                aria-label="open navigation"
                onClick={() => setDrawerOpen(true)}
                sx={{ color: "var(--text-primary)" }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          )}

          {/* ── Shared profile dropdown ── */}
          {user && (
            <Menu
              anchorEl={menuAnchor}
              open={menuOpen}
              onClose={closeMenu}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 8,
                sx: {
                  mt: 1,
                  minWidth: 220,
                  borderRadius: 2,
                  border: "1px solid var(--border-subtle)",
                  bgcolor: "var(--surface)",
                  overflow: "visible",
                },
              }}
            >
              {/* User identity header */}
              <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                  src={avatarSrc}
                  sx={{
                    width: 40,
                    height: 40,
                    border: "2px solid var(--border-brand)",
                    bgcolor: "var(--accent)",
                    color: "#fff",
                    fontWeight: 700,
                  }}
                >
                  {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
                </Avatar>
                <Box sx={{ overflow: "hidden" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.15 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "var(--text-primary)", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 130 }}>
                      {user?.name || "User"}
                    </Typography>
                    <RoleBadge role={user?.role} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                    {user?.email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderColor: "var(--border-subtle)" }} />

              <MenuItem id="menu-profile" onClick={() => { closeMenu(); navigate("/profile"); }}>
                <ListItemIcon><PersonOutlineOutlinedIcon fontSize="small" /></ListItemIcon>
                My Profile
              </MenuItem>
              <MenuItem id="menu-edit-profile" onClick={() => { closeMenu(); setEditOpen(true); }}>
                <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                Edit Profile
              </MenuItem>

              {/* Help & Support — the profile dropdown "industry standard" placement */}
              {isOwner && (
                <MenuItem id="menu-support" onClick={() => { closeMenu(); navigate("/support"); }}>
                  <ListItemIcon><HelpOutlineIcon fontSize="small" /></ListItemIcon>
                  Help &amp; Support
                </MenuItem>
              )}

              <Divider sx={{ borderColor: "var(--border-subtle)" }} />

              <MenuItem id="menu-logout" onClick={() => { closeMenu(); handleLogout(); }} sx={{ color: "error.main" }}>
                <ListItemIcon><Logout fontSize="small" sx={{ color: "error.main" }} /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          )}
        </Toolbar>
      </StyledAppBar>

      {/* ── Mobile slide-in drawer ── */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: "var(--bg-primary)",
            borderLeft: "1px solid var(--border-subtle)",
            pt: 1,
          },
        }}
      >
        {/* Drawer header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar src="/GreenSimpleCleanVeganFoodLogo.png" sx={{ width: 32, height: 32 }} />
            <Typography sx={{ fontFamily: "Poppins, sans-serif", fontWeight: 800, color: "var(--text-primary)", fontSize: "1rem" }}>
              Eaty Wonders
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "var(--text-primary)" }} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: "var(--border-subtle)" }} />

        {/* Logged-in user identity strip */}
        {user && (
          <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar src={avatarSrc} sx={{ width: 38, height: 38, bgcolor: "var(--accent)", color: "#fff", fontWeight: 700, border: "2px solid var(--border-brand)" }}>
              {(user?.name || user?.email || "U").slice(0, 1).toUpperCase()}
            </Avatar>
            <Box sx={{ overflow: "hidden" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 140 }}>
                  {user?.name || "User"}
                </Typography>
                <RoleBadge role={user?.role} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 170 }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>
        )}

        <Divider sx={{ borderColor: "var(--border-subtle)" }} />

        {/* Categorized nav sections */}
        <Box sx={{ flex: 1, overflowY: "auto", px: 1, py: 1 }}>
          {drawerSections.map((section, sIdx) => (
            <Box key={section.heading} sx={{ mb: sIdx < drawerSections.length - 1 ? 1 : 0 }}>
              {/* Section heading */}
              <Typography
                variant="overline"
                sx={{
                  display: "block",
                  px: 1.5,
                  pt: sIdx > 0 ? 1 : 0.5,
                  pb: 0.5,
                  fontSize: "0.6rem",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  color: "var(--text-secondary)",
                  opacity: 0.7,
                  userSelect: "none",
                }}
              >
                {section.heading}
              </Typography>
              {section.items.map(({ to, icon, label }) => (
                <NavLink key={to} to={to} style={{ textDecoration: "none" }} onClick={() => setDrawerOpen(false)}>
                  {({ isActive }) => (
                    <ListItem disablePadding sx={{ mb: 0.25 }}>
                      <ListItemButton
                        sx={{
                          borderRadius: 2,
                          px: 1.5,
                          py: 0.85,
                          bgcolor: isActive ? "var(--bg-elevated)" : "transparent",
                          border: isActive ? "1px solid var(--border-brand)" : "1px solid transparent",
                          "&:hover": { bgcolor: "var(--brand-accent-soft)" },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32, color: isActive ? "var(--accent)" : "#6b7280" }}>
                          {icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={label}
                          primaryTypographyProps={{
                            fontWeight: isActive ? 800 : 600,
                            fontSize: "0.9rem",
                            color: isActive ? "var(--accent)" : "#6b7280",
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  )}
                </NavLink>
              ))}
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: "var(--border-subtle)" }} />

        {/* Drawer footer — Settings & Logout */}
        <Box sx={{ px: 1, py: 1 }}>
          {user ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => { setDrawerOpen(false); setEditOpen(true); }} 
                  sx={{ borderRadius: 2, px: 1.5, py: 0.85, "&:hover": { bgcolor: "var(--brand-accent-soft)" } }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: "#6b7280" }}><Settings fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }} />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={handleLogout} 
                  sx={{ borderRadius: 2, px: 1.5, py: 0.85, "&:hover": { bgcolor: "rgba(211, 47, 47, 0.08)" } }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: "error.main" }}><Logout fontSize="small" /></ListItemIcon>
                  <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 600, color: "error.main" }} />
                </ListItemButton>
              </ListItem>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, px: 1, pb: 1 }}>
              <Button variant="outline" onClick={() => { navigate("/login"); setDrawerOpen(false); }}>Log In</Button>
              <Button variant="primary" onClick={() => { navigate("/register"); setDrawerOpen(false); }}>Sign Up</Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Edit Profile modal */}
      {user && (
        <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle sx={{ m: 0, p: 2 }}>
            Edit Profile
            <IconButton aria-label="close" onClick={() => setEditOpen(false)} sx={{ position: "absolute", right: 8, top: 8 }}>
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
