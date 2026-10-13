# Eaty Wonders — Frontend

React (Create React App) frontend for [eatywonders.com](https://eatywonders.com/), a food guide to Cavite.
MUI v5 + Tailwind CSS v3, Mapbox GL (react-map-gl 7), React Router 6. The backend (API, auth, database) is unchanged and lives elsewhere.

> This source was recovered from the production site's public source maps and then redesigned.
> `git diff` shows every change against the recovered original (the original is staged as the baseline; nothing has been committed).

## Run locally

```bash
npm install
npm start
```

For local preview against the live API, create `.env.development.local` (gitignored):

```
REACT_APP_ENV=development
REACT_APP_API_URL=https://eaty-wonders-v2-2y44.onrender.com
REACT_APP_MAPBOX_TOKEN=<public Mapbox token>
```

Turnstile is domain-locked to eatywonders.com, so log in / sign up challenges only work on the real domain.

## Build & deploy

```bash
npm run build
```

`.env.production` holds the public client config that the live bundle already used (API URL, public Mapbox token, Turnstile site key, `REACT_APP_ENV=production`) and sets `GENERATE_SOURCEMAP=false` so source code is no longer published.
Deploy the `build/` folder the same way as before (Cloudflare Pages). Keep the existing SPA fallback and security headers (CSP) configured in Cloudflare; they were not part of this repo.

`public/mapbox-worker.js` must match the installed `mapbox-gl` version: copy `node_modules/mapbox-gl/dist/mapbox-gl-csp-worker.js` over it after upgrading mapbox-gl.

## Design system

- Tokens: `src/style/global.css` (CSS variables for light/dark), mirrored for MUI in `src/theme/muiTheme.js` and exposed to Tailwind in `tailwind.config.js`.
- Type: Fraunces (headings) + Figtree (body), loaded from Google Fonts.
- Shared UI: `src/components/ui/*` (Button, Card, Input, Select, Textarea, SectionHeader, EmptyState), `AuthShell`, `MediaPicker`, `MenuItemList`.
- Images: only real dish photos in `src/background/`; fallbacks use the local logo (external placeholder hosts are blocked by the site's CSP).
