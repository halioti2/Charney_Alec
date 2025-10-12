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

### Feature Track Branches

| Track | Branch Prefix | Owners |
| ----- | ------------- | ------ |
| Track A – PDF Audit | `feature/pdf-` | Ethan, Ashley |
| Track B – Payments | `feature/payments-` | Erica |
| Track C – Commission Viz | `feature/commission-viz-` | Rad |

Always branch off `main`, keep your branch rebased, and open PRs for review.

### Dev & Test Commands

```bash
# Run full app
npm run dev

# Payments feature tests
npm run test -- --run src/features/payments/__tests__

# Commission visualization tests
npm run test -- --run src/features/commissionViz/__tests__

# PDF audit tests (once implemented)
npm run test -- --run src/features/pdfAudit/__tests__
```

## Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

## Current Status

The React components are being ported from the legacy HTML dashboard. Tailwind is configured with the same version that previously worked in `mm-store-mvp` (3.3.5). Chart.js is available for all analytics visualisations.
