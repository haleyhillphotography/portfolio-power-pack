# Haley Hill Photography — Portfolio Pricing App

## Overview
A photography portfolio pricing page where clients can browse project images, select favorites, and request photo packages via email.

## Architecture
- **Frontend**: React + React Router DOM, inline styles (no Tailwind), served by Vite
- **Backend**: Express (minimal, serves static files and SPA routing)
- **No database** — project data lives in static JSON config files

## Key Files
- `client/src/main.tsx` — Entry point with BrowserRouter (routes: `/` and `/:projectSlug`)
- `client/src/pages/project-page.tsx` — Main project page with all sections
- `client/public/projects/torrey-reserve/config.json` — Project configuration
- `client/public/logo.png` — Haley Hill Photography logo
- `client/src/index.css` — Minimal global reset styles

## Routes
- `/` — Home page with simple message
- `/:projectSlug` — Loads project config from `/projects/{slug}/config.json`

## Config.json Format
```json
{
  "project": "SkyLINE",
  "city": "San Diego",
  "launchEnd": "2026-03-24",
  "images": [{"id": "DJI_0051", "file": "DJI_filename.jpg"}, ...]
}
```
- `launchEnd` — Date string (YYYY-MM-DD) controlling the countdown timer. Edit this to change when launch pricing expires.

## Features
- **Lightbox**: Clicking an image opens a full-size modal view. Selection checkbox in corner of both thumbnails and lightbox.
- **Auto-tier pricing**: 3-pack ($645), 5-pack ($995), 8-pack ($1,295) with auto-selection based on number of favorites
- **Manual tier override**: Users can click a tier card to override auto-selection
- **Bonus image logic**: +1 free for 5-pack and 8-pack when base count reached
- **Custom quote**: "Need more images? Get a Custom Quote" link below pricing. Overflow mode (10+ images) automatically switches CTA.
- **Configurable countdown**: Reads `launchEnd` from config.json. Shows "LAUNCH PRICING HAS ENDED" when expired.
- **Mailto CTA**: Sends pre-filled email to haley@haleyhillphotography.com
- **Responsive**: Single column on mobile

## Design
- Primary color: #CB9B4B (gold)
- Font: system font stack (-apple-system, etc.)
- Clean, minimal, professional aesthetic

## Dependencies
- react-router-dom (client-side routing)
