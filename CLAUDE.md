# HiveTrack (hivehq)

Beekeeping management app for New Zealand commercial beekeepers. Tracks apiaries (sites), hives, inspections, harvests, inventory, economics, queen rearing, and compliance reporting. NZD currency throughout, NZ honey varieties, NZ-specific regulatory references.

Live at: https://brenton315.github.io/hivetrack/

## Tech Stack

- **Frontend:** React 19 SPA with Vite 8, TypeScript 6 (strict), react-router-dom v7
- **Styling:** Custom CSS design system with `hq-` class prefix. Tailwind v4 is imported (`@import "tailwindcss"` in index.css) but the app uses hand-written CSS classes, not Tailwind utilities. IBM Plex Sans font. Light/dark theme via `data-theme` attribute on `<html>`.
- **Database:** Supabase (PostgreSQL + Auth + RLS). Project: `puhxlfitwbvmzlbnzrhr.supabase.co`
- **AI:** Supabase Edge Functions (Deno) call Anthropic API (`claude-haiku-5-5`) for field note parsing and data Q&A. API key is a Supabase edge function secret, never exposed to the browser.
- **Maps:** MapLibre GL with Carto basemap tiles (light/dark) and OSM raster fallback. LINZ aerial tiles if `VITE_LINZ_API_KEY` is set.
- **Charts:** Recharts (BarChart, PieChart, etc.)
- **Hosting:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`)
- **Repo:** https://github.com/Brenton315/hivetrack

## Build & Deploy

```bash
npm ci
npm run build              # tsc -b && vite build
npm run dev                # local dev server
```

CI runs: `npm run build -- --base=/hivetrack/` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as env vars. Copies `dist/index.html` to `dist/404.html` for SPA routing fallback. Deploys to GitHub Pages on push to `main`.

**TypeScript is strict:** `noUnusedLocals: true`, `noUnusedParameters: true` in tsconfig.app.json. Unused imports will fail CI.

## Environment Variables

See `.env.example`:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous/public key (safe for browser)
- `VITE_LINZ_API_KEY` - (optional) LINZ API key for NZ aerial satellite tiles on maps

Edge function secret (set in Supabase dashboard, not in repo):
- `ANTHROPIC_API_KEY` - for Claude Haiku calls from edge functions

## Folder Structure

```
src/
  main.tsx                 # Entry point: StrictMode > ThemeProvider > App
  App.tsx                  # Routes (BrowserRouter with basename)
  index.css                # All styles (Tailwind import + hq-* custom classes)

  lib/
    supabase.ts            # Supabase client singleton
    hooks.ts               # React hooks: useAuth, useSites, useHives, useEvents, useOverviewData, useHarvests, useAllEvents
    org.tsx                 # OrgProvider context: org/membership/role state
    theme.tsx               # ThemeProvider: light/dark toggle
    ai.ts                   # Client helpers for edge functions (parse-note, ask-question)
    strength.ts             # Hive strength scoring (frames -> % -> strong/fair/weak)
    format.ts               # NZ date/currency formatting (fmtDateShort, fmtMoney, queenAge)
    settings.ts             # Constants: honey prices, queen breeds, feed types, treatments, shop products
    basemap.ts              # MapLibre styles: Carto light/dark + OSM fallback
    database.types.ts       # TypeScript interfaces for all DB entities
    marketplace.ts          # Types for tender/supplier quote system
    queens.ts               # Queen rearing hooks and pipeline stages

  components/
    layout/                 # AppShell, BottomNav, Logo
    auth/                   # AuthPage, AccountPage
    dashboard/              # OverviewPage, BossView, CalendarWidget, DashboardMap
    sites/                  # SiteList, SiteDetail, SiteForm, SiteMap, SiteMapInteractive
    hives/                  # HiveDetail, HiveForm, InspectionForm, BulkInspectionForm, DeleteHiveDialog, MoveHiveDialog, AIConfirmDialog
    economics/              # EconomicsPage, HarvestForm
    inventory/              # InventoryPage, InventoryForm, UseStockDialog
    charts/                 # ChartsPage, StrengthChart, HarvestChart, AskPanel
    queens/                 # QueenPage, QueenForm, QueenStats, QueenPipeline
    reports/                # ReportsPage, AdrForm
    shop/                   # ShopPage (demo marketplace with simulated quotes)
    map/                    # MapPage (standalone, not in nav)
    ai/                     # AIChatbot, BulkImport, QuickNote, NotesPage
    calendar/               # CalendarPage

supabase/
  functions/
    ask-question/index.ts   # Edge function: data Q&A via Claude Haiku 5.5
    parse-note/index.ts     # Edge function: parse field notes into structured events
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | OverviewPage | Dashboard: greeting, stats, map, calendar, tasks, sites overview |
| `/sites` | SiteList | All apiary sites with search |
| `/sites/:id` | SiteDetail | Single site: interactive map, hive list, inspections, actions |
| `/hives/:id` | HiveDetail | Single hive: timeline, strength, inspections |
| `/economics` | EconomicsPage | Costs/harvests tabs, revenue charts, harvest recording |
| `/inventory` | InventoryPage | Equipment/supplies tracking, stock usage |
| `/shop` | ShopPage | Demo marketplace (simulated quotes, no real orders) |
| `/analysis` | ChartsPage | Strength and harvest charts with AI Q&A |
| `/queens` | QueenPage | Queen tracking and rearing pipeline |
| `/reports` | ReportsPage | Compliance: ADR forms, export-ready reports |
| `/account` | AccountPage | User settings, theme toggle |

Bottom nav: Overview, Sites, Economics, More (Inventory, Queens, Marketplace, Analysis, Reports).

## Design System

- **Prefix:** All custom CSS classes use `hq-` prefix
- **Colours:** `--accent: #E9A820` (gold), `--brand: #1D4A38` (dark green), light/dark theme tokens on `:root` and `[data-theme="dark"]`
- **Font:** IBM Plex Sans 400/500/600
- **Cards:** `.hq-card` with `.hq-card-head`
- **Forms:** `.hq-input`, `.hq-select`, `.hq-label`, `.hq-field`
- **Buttons:** `.hq-btn-primary`, `.hq-btn-danger`, `.hq-btn-sm`
- **Layout:** `.hq-header`, `.hq-tabbar`, `.hq-overlay`, `.hq-modal`
- **Tables:** `.hq-trow`, `.hq-thead` (grid-based, not `<table>`)
- **Status:** `.hq-status.hq-st-strong/fair/weak` badges

## Database Tables (Supabase)

All tables have RLS policies scoped to `auth.uid()`.

- `sites` - Apiary locations (name, lat, lng, region, notes)
- `hives` - Individual hives (site_id, name, status, queen_year, hive_lat/lng, deletion fields)
- `hive_events` - Inspections, feeds, treatments, costs (hive_id, event_type, event_date, data JSONB, notes)
- `harvests` - Honey harvest records (site_id, hive_id, honey_type, weight_kg, season, revenue)
- `inventory` - Equipment/supplies (product_name, category, quantity, unit, min_stock, supplier, cost_per_unit)
- `inventory_usage` - Stock usage log (inventory_id, quantity_used, site_id)
- `queens` - Queen tracking (hive_id, breed, source, status, grafted_date, mated_date, introduced_date)
- `organizations` - Multi-user orgs (name, slug)
- `memberships` - Org membership (org_id, user_id, role: owner/manager/worker)

## What Is Finished

- All 6 original build phases (sites, hives, inspections, economics, queens, marketplace)
- 5 redesign phases:
  - Phase 1: Dashboard rewrite, global AI chatbot, nav cleanup, calendar widget
  - Phase 2: Interactive satellite maps, bulk inspection with voice+AI, hive deletion/movement
  - Phase 3: Inventory management with stock tracking
  - Phase 4: Harvest revenue tracking with charts
  - Phase 5: Marketplace redesign with product grid and simulated quotes
- GitHub Pages deployment pipeline
- Light/dark theme
- Edge functions for AI features (ask-question, parse-note)
- Basemap fallback (Carto -> OSM) for map reliability

## What Is Not Finished / Known Issues

- **Org/membership system:** Database tables exist but the multi-user UI (Boss view, Operations view, role-based access) is scaffolded, not complete
- **Queen rearing pipeline:** UI exists but may need polish and testing
- **Marketplace:** Demo mode only - uses seeded suppliers and simulated quotes, no real orders
- **LINZ aerial tiles:** Require API key that the user hasn't set up yet
- **ADR/compliance reports:** Skeleton exists, may need more form fields
- **Voice-to-text:** Uses Web Speech API (en-NZ locale), browser support varies

## Security Rules

- Do not put secrets, API keys or credentials in the repo. Use environment variables only.
- Call the Anthropic API from server-side (edge functions) only. NEVER expose the API key in the browser.
- NEVER save without the user tapping confirm.
- NEVER submit anything to an external system without an explicit confirmation step.
- Do not delete existing user data. Write database migrations.
- Use seeded demo suppliers and simulated quotes. Do not send real emails or notifications without confirmation.
- Flag any products that may be ACVM-registered. Do not list them in the marketplace until confirmed.
- If a requirement is unclear or conflicts with another requirement, ask before guessing.
