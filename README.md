# Charney Dashboard

This project is the Vite + React migration of the original `test.html` dashboard.  
It mirrors the structure used in `mm-store-mvp`, including Tailwind CSS, React Router, Netlify configuration, and a serverless functions folder.

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` and provide your Supabase credentials when ready:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Current Status

The React components are being ported from the legacy HTML dashboard. Tailwind is configured with the same version that previously worked in `mm-store-mvp` (3.3.5). Chart.js is available for all analytics visualisations.
