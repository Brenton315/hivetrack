# HiveHQ Tab Audit

## Current Tabs and Routes

### 1. Overview (Dashboard) — `/`
**What it shows now:**
- KPI strip: overall strength %, total hives, site count, last harvest date
- Sites table: name, hive count, strength bar, status badge, last harvest
- Map: all sites plotted on Carto basemap, colour-coded by strength
- Check Hives: list of hives not rated "strong"

**What it lacks:**
- No economics / profit-loss data
- No cost tracking or cost-per-hive
- No revenue or harvest-value figures
- No event timeline or recent activity feed
- No seasonal comparison or trends on the dashboard itself

### 2. Sites List — `/sites`
**What it shows now:**
- List of sites with name, hive count, main flowering type

**What it lacks:**
- No strength indicator per site
- No last-inspected or last-harvested date shown in the list
- No sortable columns
- No search or filter

### 3. Site Detail — `/sites/:id`
**What it shows now:**
- Site name, hive count, flowering, location text
- Map (LINZ aerial or Carto fallback)
- Tabs: Hives (list), Logs (list), Harvests (list)
- Edit site, add hive/log/harvest modals

**What it lacks:**
- No strength summary for the site
- No per-hive strength in the hive list
- No event timeline (unified log of all event types)
- No trend line or chart for the site
- No cost tracking at site level
- Hive list doesn't show queen info, last inspection, or status

### 4. Hives List — `/hives`
**What it shows now:**
- All hives with name, site name, strength %, status badge

**What it lacks:**
- No queen breed or queen year
- No last-inspected date
- No event count or recent activity
- No filter by site or status
- No sort options

### 5. Hive Detail — `/hives/:id`
**What it shows now:**
- Hive name, current site
- Tabs: Logs (list), Harvests (list), Site History
- Edit hive, add log/harvest modals

**What it lacks:**
- No queen breed, queen year, or notes fields on hive
- No event timeline (Feed, Treatment, Box added, Inspection, Move, Cost — all as one stream)
- No strength trend line chart
- No quick-add forms for each event type
- No current strength display or status badge

### 6. Harvests List — `/harvests`
**What it shows now:**
- All harvests with date, site, hive, kg, honey type
- Total kg at top

**What it lacks:**
- No season grouping or filtering
- No revenue/value calculation
- No chart or visual summary
- No drill-down to harvest detail

### 7. Reports (Charts) — `/reports`
**What it shows now:**
- Two tabs: Strength chart (line), Harvest chart (bar by site)
- Strength: per-site average or per-hive lines
- Harvest: grouped bar by season, site-level only

**What it lacks:**
- No economics/cost charts
- No profit-loss view
- No cost breakdown by category
- No filtering by date range
- No export

### 8. Account — `/account`
**What it shows now:**
- User email, avatar initial, theme toggle, sign-out

**What it lacks:**
- Nothing significant — this is fine as-is

## Tabs the User Wants Added

### Dashboard / Economics
- Profit/loss per site
- Cost per hive
- Cost breakdown (feed, treatment, transport, equipment, labour)
- Drill down: summary → site costs → individual cost entries (add/edit)

### Map (standalone)
- Site markers with hive count and strength
- Popup with site summary
- Click through to site page
- Show hive move history on the map

### Flowering / Calendar
- Flowering periods by plant type
- Which sites/hives are on each flow
- Hive moves in and out of flowering areas
- Calendar view of the beekeeping season

### Shop
- Products by category (feed, treatments, equipment)
- Product detail with suppliers and prices
- Simple order list with running total

## Summary of Missing Data Model

The current model stores inspections as flat `hive_logs` rows with text fields for treatments and feeding. The user wants a unified **event log** where every action is a typed event:

| Event Type | Fields |
|---|---|
| Feed | type (sugar syrup / pollen patty / dry sugar), amount |
| Treatment | product (bayvarol / apivar / oxalic / formic / thymol) |
| Box added | type (brood / super) |
| Inspection | frames of bees, frames of stores, frames of brood |
| Move | from site, to site |
| Cost | category, amount, site, optional hive |

Hives also need: queen breed (Carniolan / Italian), queen year, notes.

Realistic demo data needed: 4+ sites, 20-30 hives per site, several events per hive.
