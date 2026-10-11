# HiveTrack

A mobile-first web app for New Zealand beekeepers to track hives across sites and seasons. Built with React, Supabase, Tailwind CSS, and Recharts.

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In the SQL Editor, run the contents of `supabase.sql` to create the tables and RLS policies.
3. Go to **Settings → API** and copy your **Project URL** and **anon public key**.
4. In **Authentication → Providers**, make sure **Email** is enabled with magic-link sign-in.

### 2. Get a LINZ Basemaps API key (optional)

1. Go to [basemaps.linz.govt.nz](https://basemaps.linz.govt.nz) and sign up for a free API key.
2. This powers the aerial imagery on site detail pages. If you skip this, the app still runs — you'll see a placeholder instead of the map.

### 3. Configure environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LINZ_API_KEY=your-linz-basemaps-api-key
```

### 4. Install and run

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

### 5. Load sample data (optional)

After signing up via the app's magic-link login:

1. Find your user ID in Supabase Dashboard → Authentication → Users.
2. Open `supabase.sql`, uncomment the sample data block at the bottom, replace `REPLACE_WITH_YOUR_USER_ID` with your actual user ID, and run it in the SQL Editor.

## Features

- **Sites** — List, add, and edit bee sites with GPS pins, hive counts, and flowering info.
- **Aerial map** — LINZ Basemaps aerial imagery centred on each site's GPS pin.
- **Hives** — Track individual hives at each site. Hives can move between sites.
- **Log entries** — Record inspections at site or hive level: strength (frames of bees), treatments, feeding, brood:stores ratio, notes.
- **Harvests** — Record honey taken off at site or hive level with kilograms, season, and honey type.
- **Charts** — Strength over time (line chart) and harvest by site (bar chart).
- **Auth** — Email magic-link login via Supabase Auth, with row-level security on all data.

## Tech stack

- React + Vite + TypeScript
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS (mobile-first)
- Recharts
- MapLibre GL + LINZ Basemaps
