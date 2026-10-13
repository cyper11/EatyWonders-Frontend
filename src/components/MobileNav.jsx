import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Avatar } from '@mui/material';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import DynamicFeedRoundedIcon from '@mui/icons-material/DynamicFeedRounded';
import DynamicFeedOutlinedIcon from '@mui/icons-material/DynamicFeedOutlined';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/backend';

/**
 * Floating, app-style bottom navigation for phones and small tablets.
 * Icon-only (with accessible labels); the active tab sits in a lighter pill.
 */
export default function MobileNav() {
  const location = useLocation();
  // Re-tapping the current tab scrolls back to its section, like native apps.
  const onTabClick = (to) => (e) => {
    const [path, id] = to.split('#');
    if ((path || '/') !== location.pathname) return;
    if (id && location.hash === `#${id}`) {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (!id && !location.hash) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const { user, isOwner, loading } = useAuth();
  const avatarSrc = user?.profile_url
    ? (user.profile_url.startsWith('http') ? user.profile_url : `${API_BASE_URL}${user.profile_url}`)
    : undefined;

  const onHome = location.pathname === '/';
  const hash = location.hash;

  const items = [
    { key: 'home', to: '/', label: 'Home', icon: HomeOutlinedIcon, activeIcon: HomeRoundedIcon, active: onHome && hash !== '#nearby' && hash !== '#map' },
  ];
  if (!isOwner) {
    items.push({ key: 'nearby', to: '/#nearby', label: 'Nearby restaurants', icon: PlaceOutlinedIcon, activeIcon: PlaceRoundedIcon, active: onHome && hash === '#nearby' });
  }
  items.push({ key: 'map', to: '/#map', label: 'Food map', icon: MapOutlinedIcon, activeIcon: MapRoundedIcon, active: onHome && hash === '#map' });
  if (user) {
    items.push({ key: 'feed', to: '/feed', label: 'Feed', icon: DynamicFeedOutlinedIcon, activeIcon: DynamicFeedRoundedIcon, active: ['/feed', '/user-page'].includes(location.pathname) });
  }
  if (user && isOwner) {
    items.push({ key: 'owner', to: '/owner', label: 'My posts', icon: AddPhotoAlternateOutlinedIcon, activeIcon: AddPhotoAlternateRoundedIcon, active: ['/owner', '/owner-page'].includes(location.pathname) });
  }

  const accountActive = user
    ? location.pathname.startsWith('/profile')
    : ['/login', '/register'].includes(location.pathname);

  const itemClass = (active) =>
    `relative flex-1 h-12 grid place-items-center rounded-full transition-[background-color,color,box-shadow] duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/60 ${
      active ? 'glass-pill' : 'glass-ink-muted hover:text-[color:var(--glass-ink)]'
    }`;

  return (
    <nav
      aria-label="Primary"
      className="min-[900px]:hidden fixed inset-x-0 z-[1090] px-3 pointer-events-none"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' }}
    >
      <ul className="glass relative pointer-events-auto mx-auto max-w-md flex items-center gap-1 p-1.5 list-none m-0 rounded-full">
        {items.map(({ key, to, label, icon: Icon, activeIcon: ActiveIcon, active }) => (
          <li key={key} className="flex-1 flex">
            <Link to={to} onClick={onTabClick(to)} aria-label={label} title={label} aria-current={active ? 'page' : undefined} className={itemClass(active)}>
              {active ? <ActiveIcon sx={{ fontSize: 26 }} /> : <Icon sx={{ fontSize: 26 }} />}
            </Link>
          </li>
        ))}
        {(loading || user) && (
        <li className="flex-1 flex">
          {loading ? (
            <span className={itemClass(false)} aria-hidden="true">
              <span className="w-8 h-8 rounded-full bg-content-muted/25" />
            </span>
          ) : (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('ew:open-account'))}
              aria-label="Account menu"
              aria-haspopup="dialog"
              title="Account"
              className={itemClass(accountActive)}
            >
              <Avatar
                src={avatarSrc}
                alt=""
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  bgcolor: 'var(--leaf-300)',
                  color: '#12251a',
                  border: '2px solid',
                  borderColor: 'var(--glass-pill-edge)',
                }}
              >
                {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
            </button>
          )}
        </li>
        )}
      </ul>
    </nav>
  );
}
