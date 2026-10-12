import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOverviewData } from '../../lib/hooks';
import { useTheme } from '../../lib/theme';
import { statusLabel, STRONG_MIN, FAIR_MIN } from '../../lib/strength';
import type { SiteOverview, HiveWithStrength } from '../../lib/hooks';
import Logo from '../layout/Logo';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

function formatDate(iso: string | null): string {
  if (!iso) return '--';
  const p = iso.split('-');
  return `${Number(p[2])} ${MONTHS[Number(p[1]) - 1]} ${p[0]}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`hq-status hq-st-${status}`}>
      <span className={`hq-swatch ${status}`} />
      {statusLabel(status as 'strong' | 'fair' | 'weak')}
    </span>
  );
}

function KpiStrip({ data }: { data: ReturnType<typeof useOverviewData> }) {
  const share = (n: number) => data.totalHives ? (n / data.totalHives) * 100 : 0;

  return (
    <div className="hq-card hq-kpis">
      <div className="hq-kpi">
        <span className="hq-kpi-label">Overall strength</span>
        <span className="hq-kpi-value">{data.overallStrength}%</span>
        <span className="hq-kpi-sub">{data.counts.strong} of {data.totalHives} hives are strong.</span>
        <div className="hq-split" role="img" aria-label={`${data.counts.strong} strong, ${data.counts.fair} fair, ${data.counts.weak} weak`}>
          <div className="strong" style={{ width: `${share(data.counts.strong)}%` }} />
          <div className="fair" style={{ width: `${share(data.counts.fair)}%` }} />
          <div className="weak" style={{ width: `${share(data.counts.weak)}%` }} />
        </div>
        <div className="hq-legend">
          <span><span className="hq-swatch strong" />{data.counts.strong} strong</span>
          <span><span className="hq-swatch fair" />{data.counts.fair} fair</span>
          <span><span className="hq-swatch weak" />{data.counts.weak} weak</span>
        </div>
      </div>
      <div className="hq-kpi">
        <span className="hq-kpi-label">Total hives</span>
        <span className="hq-kpi-value">{data.totalHives}</span>
        <span className="hq-kpi-sub">Across {data.sites.length} sites</span>
      </div>
      <div className="hq-kpi">
        <span className="hq-kpi-label">Sites</span>
        <span className="hq-kpi-value">{data.sites.length}</span>
        <span className="hq-kpi-sub">{data.sites.filter(s => s.status !== 'strong').length} below strong</span>
      </div>
      <div className="hq-kpi">
        <span className="hq-kpi-label">Last harvest</span>
        <span className="hq-kpi-value date">{formatDate(data.lastHarvestDate)}</span>
        <span className="hq-kpi-sub">{data.lastHarvestSite ?? '--'}</span>
      </div>
    </div>
  );
}

function SitesTable({ sites }: { sites: SiteOverview[] }) {
  const navigate = useNavigate();

  return (
    <div className="hq-card hq-sites-card">
      <div className="hq-card-head">
        <h2>Your sites</h2>
        <button className="hq-link" onClick={() => navigate('/sites')}>View all</button>
      </div>
      <div className="hq-trow hq-cols-sites hq-thead">
        <div>Site</div>
        <div className="hq-num">Hives</div>
        <div>Strength</div>
        <div>Status</div>
        <div>Last harvest</div>
      </div>
      {sites.map((s) => (
        <button key={s.id} className="hq-trow hq-cols-sites" onClick={() => navigate(`/sites/${s.id}`)}>
          <div className="hq-c-site">
            <span className="hq-site-name">{s.name}</span>
            <span className="hq-site-flower">
              <span className="hq-hives-inline">{s.hiveCount} hives, </span>
              {s.main_flowering ?? ''}
            </span>
          </div>
          <div className="hq-c-hives hq-num">{s.hiveCount}</div>
          <div className="hq-c-str">
            <div className="hq-track">
              <div className={`hq-bar ${s.status}`} style={{ width: `${s.strength}%` }} />
            </div>
            <span className="hq-pct">{s.strength}%</span>
          </div>
          <div className="hq-c-stat">
            <StatusBadge status={s.status} />
          </div>
          <div className="hq-c-harv hq-muted">{formatDate(s.lastHarvest)}</div>
        </button>
      ))}
      {sites.length === 0 && <p className="hq-empty">No sites yet. Add your first site.</p>}
    </div>
  );
}

function SiteMap({ sites }: { sites: SiteOverview[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { theme } = useTheme();

  const sitesWithCoords = sites.filter(s => s.lat != null && s.lng != null);

  useEffect(() => {
    if (!containerRef.current || sitesWithCoords.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const bounds = new maplibregl.LngLatBounds();
    sitesWithCoords.forEach(s => bounds.extend([s.lng!, s.lat!]));

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://basemaps.cartocdn.com/gl/${theme === 'dark' ? 'dark-matter' : 'positron'}-gl-style/style.json`,
      bounds,
      fitBoundsOptions: { padding: 50, maxZoom: 12 },
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on('load', () => {
      sitesWithCoords.forEach(s => {
        const color = s.status === 'strong' ? '#2F7D5B' : s.status === 'fair' ? '#E9A820' : '#B4441C';
        const el = document.createElement('div');
        el.style.cssText = `width:32px;height:32px;border-radius:50%;background:${color};border:2.5px solid ${theme === 'dark' ? '#0C1C16' : '#fff'};display:flex;align-items:center;justify-content:center;font:600 13px 'IBM Plex Sans',system-ui;color:${theme === 'dark' ? '#0C1C16' : '#fff'};cursor:pointer;`;
        el.textContent = String(s.hiveCount);
        new maplibregl.Marker({ element: el })
          .setLngLat([s.lng!, s.lat!])
          .addTo(map);
      });
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [sitesWithCoords.length, theme]);

  return (
    <div className="hq-card hq-map-card">
      <div className="hq-card-head"><h2>Site map</h2></div>
      <div className="hq-map-wrap" ref={containerRef}>
        {sitesWithCoords.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--muted)', fontSize: 14 }}>
            No sites with coordinates
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', padding: '12px 20px 0', fontSize: 13, color: 'var(--ink-2)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="hq-swatch strong" />Strong, {STRONG_MIN}% and up</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="hq-swatch fair" />Fair, {FAIR_MIN} to {STRONG_MIN - 1}%</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span className="hq-swatch weak" />Weak, under {FAIR_MIN}%</span>
      </div>
    </div>
  );
}

function CheckHives({ hives }: { hives: HiveWithStrength[] }) {
  const navigate = useNavigate();

  return (
    <div className="hq-card hq-check-card">
      <div className="hq-card-head"><h2>Check these hives</h2></div>
      {hives.length === 0 ? (
        <p className="hq-empty">All hives are strong.</p>
      ) : (
        hives.map((h) => (
          <button key={h.id} className="hq-trow hq-cols-check" onClick={() => navigate(`/hives/${h.id}`)}>
            <div className="hq-site-name">{h.name}</div>
            <div className="hq-muted">{h.site_name}</div>
            <div className="hq-pct">{h.strength}%</div>
            <div><StatusBadge status={h.status!} /></div>
          </button>
        ))
      )}
    </div>
  );
}

export default function OverviewPage() {
  const data = useOverviewData();
  const { theme, setTheme } = useTheme();

  if (data.loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--muted)' }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Overview</h1>
          <span className="hq-subtitle">{data.totalHives} hives, {data.sites.length} sites</span>
        </div>
        <div className="hq-actions">
          <div className="hq-seg-group" role="group" aria-label="Colour theme">
            <button type="button" className="hq-seg" aria-pressed={theme === 'light'} aria-label="Light theme" onClick={() => setTheme('light')}>
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ strokeWidth: 2 }}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
              <span className="hq-seg-label">Light</span>
            </button>
            <button type="button" className="hq-seg" aria-pressed={theme === 'dark'} aria-label="Dark theme" onClick={() => setTheme('dark')}>
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" style={{ strokeWidth: 2 }}>
                <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
              </svg>
              <span className="hq-seg-label">Dark</span>
            </button>
          </div>
        </div>
      </header>

      <section className="hq-row" aria-label="Summary">
        <KpiStrip data={data} />
      </section>

      <section className="hq-row" aria-label="Sites">
        <SitesTable sites={data.sites} />
        <SiteMap sites={data.sites} />
      </section>

      <section className="hq-row" aria-label="Check hives">
        <CheckHives hives={data.checkHives} />
      </section>
    </>
  );
}
