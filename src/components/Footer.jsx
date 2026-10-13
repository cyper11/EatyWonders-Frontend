import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Facebook, Instagram } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";

const socials = [
  { href: "https://www.facebook.com/profile.php?id=61584021676163", label: "Eaty Wonders on Facebook", icon: <Facebook fontSize="small" /> },
  { href: "https://www.instagram.com/eatywonders/", label: "Eaty Wonders on Instagram", icon: <Instagram fontSize="small" /> },
  { href: "https://x.com/eatywonders", label: "Eaty Wonders on X (Twitter)", icon: <Twitter fontSize="small" /> },
];

const linkClass =
  "inline-flex items-center min-h-[36px] text-[0.95rem] text-content-secondary no-underline hover:text-brand-accent transition-colors";

function FooterColumn({ title, children }) {
  return (
    <nav aria-label={title}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-content-muted mb-3">{title}</p>
      <ul className="list-none p-0 m-0 space-y-1">{children}</ul>
    </nav>
  );
}

const Footer = () => {
  const { user, isOwner } = useAuth();

  return (
    <footer className="mt-8 bg-background-secondary border-t border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-28 min-[900px]:pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center gap-3 no-underline" aria-label="Eaty Wonders home">
              <img src="/GreenSimpleCleanVeganFoodLogo.png" alt="" width="48" height="48" className="w-12 h-12 rounded-full" />
              <span className="font-display text-2xl font-semibold text-content-primary">Eaty Wonders</span>
            </Link>
            <p className="mt-4 text-content-secondary leading-relaxed">
              Your digital gateway to Cavite's local flavors.
            </p>
          </div>

          <FooterColumn title="Explore">
            <li><Link className={linkClass} to="/#nearby">Nearby restaurants</Link></li>
            <li><Link className={linkClass} to="/#map">Food map</Link></li>
            <li><Link className={linkClass} to="/#discover">Community posts</Link></li>
          </FooterColumn>

          <FooterColumn title="Account">
            {user ? (
              <>
                <li><Link className={linkClass} to="/feed">Feed</Link></li>
                <li><Link className={linkClass} to="/profile">My profile</Link></li>
                {isOwner && <li><Link className={linkClass} to="/owner">My posts</Link></li>}
                {isOwner && <li><Link className={linkClass} to="/support">Help &amp; support</Link></li>}
              </>
            ) : (
              <>
                <li><Link className={linkClass} to="/login">Log in</Link></li>
                <li><Link className={linkClass} to="/register">Create an account</Link></li>
              </>
            )}
          </FooterColumn>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-content-muted mb-3">Follow us</p>
            <ul className="flex gap-2 list-none p-0 m-0">
              {socials.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${s.label} (opens in new tab)`}
                    className="w-11 h-11 grid place-items-center rounded-full bg-surface border border-subtle text-content-secondary hover:text-brand-accent hover:border-strong transition-colors"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-subtle flex flex-col sm:flex-row gap-2 justify-between text-sm text-content-secondary">
          <p className="m-0">© {new Date().getFullYear()} Eaty Wonders. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
