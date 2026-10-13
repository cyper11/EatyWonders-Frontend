import React from "react";
import { IconButton } from "@mui/material";
import { Twitter, Facebook, Instagram } from "@mui/icons-material";

const Footer = () => {
  return (
    <footer className="text-center p-6 mt-12 bg-background-secondary border-t border-background-tertiary">
      <div className="max-w-7xl mx-auto flex flex-col items-center gap-4">
        <p className="text-sm font-medium text-content-secondary">
          © {new Date().getFullYear()} Eaty Wonders. All rights reserved.
        </p>
        <div className="flex gap-4">
          <IconButton
            component="a"
            href="https://x.com/eatywonders"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            className="text-content-secondary hover:text-brand-accent transition-colors"
          >
            <Twitter />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.facebook.com/profile.php?id=61584021676163"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="text-content-secondary hover:text-brand-accent transition-colors"
          >
            <Facebook />
          </IconButton>
          <IconButton
            component="a"
            href="https://www.instagram.com/eatywonders/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-content-secondary hover:text-brand-accent transition-colors"
          >
            <Instagram />
          </IconButton>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
