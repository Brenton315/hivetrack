import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSite, useHives, useEvents, useOverviewData, computeHiveData } from '../../lib/hooks';
import type { HiveWithStrength } from '../../lib/hooks';
import type { HiveEvent, Hive } from '../../lib/database.types';
import { statusLabel } from '../../lib/strength';
import { fmtDateShort, queenAge, fmtRatio, fmtMoney } from '../../lib/format';
import { SETTINGS } from '../../lib/settings';
import SiteForm from './SiteForm';
import SiteMap from './SiteMap';

type SortKey = 'name' | 'frames' | 'lastFed' | 'lastTreatment' | 'lastBoxAdded' | 'queenAge' | 'ratio';
type SortDir = 'asc' | 'desc';

function sortValue(h: HiveWithStrength, key: SortKey): string | number {
  switch (key) {
    case 'name': return h.name.toLowerCase();
    case 'frames': return h.strength ?? -1;
    case 'lastFed': return h.lastFed ?? '';
    case 'lastTreatment': return h.lastTreatment ?? '';
    case 'lastBoxAdded': return h.lastBoxAdded ?? '';
    case 'queenAge': return h.queen_year ?? 0;
    case 'ratio': return h.storesBroodRatio ?? -1;
  }
}

function compare(a: HiveWithStrength, b: HiveWithStrength, key: SortKey, dir: SortDir): number {
  const av = sortValue(a, key);
  const bv = sortValue(b, key);
  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return dir === 'asc' ? cmp : -cmp;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`hq-status hq-st-${status}`}>
      <span className={`hq-swatch ${status}`} />
      {statusLabel(status as 'strong' | 'fair' | 'weak')}
    </span>
  );
}

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { site, loading, refetch } = useSite(id);
  const { hives } = useHives(id);
  const { events } = useEvents(id);
  const overviewData = useOverviewData();
  const [editing, setEditing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const hiveData = useMemo(() => {
    return hives.map(h => computeHiveData(
      { ...h, site_name: site?.name ?? '' } as Hive & { site_name: string },
      events
    ));
  }, [hives, events, site]);

  const sorted = useMemo(() => {
    return [...hiveData].sort((a, b) => compare(a, b, sortKey, sortDir));
  }, [hiveData, sortKey, sortDir]);

  const siteOverview = useMemo(() => {
    return overviewData.sites.find(s => s.id === id) ?? null;
  }, [overviewData.sites, id]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
  }
  if (!site) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Site not found</div>;
  }

  const avgStrength = siteOverview?.strength ?? 0;
  const needingAttention = siteOverview?.hivesNeedingAttention ?? 0;
  const costPerHive = siteOverview?.costPerHive ?? 0;

  return (
    <>
      <button className="hq-back" onClick={() => navigate(-1)}>
        <svg className="icon" width="14" height="14" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        Back
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1>{site.name}</h1>
          <span className="hq-subtitle">
            {site.main_flowering ?? ''}{site.main_flowering && site.location_text ? ' · ' : ''}{site.location_text ?? ''}
          </span>
        </div>
        <button className="hq-btn-secondary" onClick={() => setEditing(true)}>Edit</button>
      </div>

      {site.lat != null && site.lng != null && (
        <SiteMap lat={site.lat} lng={site.lng} />
      )}

      {/* KPI strip */}
      <div className="hq-card hq-kpis" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Hives</span>
          <span className="hq-kpi-value">{hives.length}</span>
        </div>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Avg strength</span>
          <span className="hq-kpi-value">{avgStrength}%</span>
        </div>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Need attention</span>
          <span className="hq-kpi-value">{needingAttention}</span>
        </div>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Cost / hive</span>
          <span className="hq-kpi-value">{fmtMoney(costPerHive)}</span>
        </div>
      </div>

      {/* Hive table */}
      <div className="hq-card" style={{ paddingBottom: 8 }}>
        <div className="hq-card-head">
          <h2>Hives</h2>
        </div>

        {hiveData.length === 0 ? (
          <p className="hq-empty">No hives at this site.</p>
        ) : (
          <>
            <div
              className="hq-trow hq-thead"
              style={{ gridTemplateColumns: 'minmax(0,1.2fr) 72px 80px 80px 80px 60px minmax(70px,0.8fr)', cursor: 'default' }}
            >
              <div style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                Hive{arrow('name')}
              </div>
              <div style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('frames')}>
                Frames{arrow('frames')}
              </div>
              <div style={{ cursor: 'pointer' }} onClick={() => handleSort('lastFed')}>
                Last fed{arrow('lastFed')}
              </div>
              <div style={{ cursor: 'pointer' }} onClick={() => handleSort('lastTreatment')}>
                Treated{arrow('lastTreatment')}
              </div>
              <div style={{ cursor: 'pointer' }} onClick={() => handleSort('lastBoxAdded')}>
                Box added{arrow('lastBoxAdded')}
              </div>
              <div style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('queenAge')}>
                Queen{arrow('queenAge')}
              </div>
              <div style={{ cursor: 'pointer', textAlign: 'right' }} onClick={() => handleSort('ratio')}>
                S:B ratio{arrow('ratio')}
              </div>
            </div>

            {sorted.map((h) => {
              const lowRatio = h.storesBroodRatio != null && h.storesBroodRatio < SETTINGS.stores.lowRatio;
              return (
                <button
                  key={h.id}
                  className="hq-trow"
                  style={{ gridTemplateColumns: 'minmax(0,1.2fr) 72px 80px 80px 80px 60px minmax(70px,0.8fr)' }}
                  onClick={() => navigate(`/hives/${h.id}`)}
                >
                  {/* Desktop layout */}
                  <div className="hq-site-name hq-detail-cell">{h.name}</div>
                  <div className="hq-num hq-detail-cell">{h.strength != null ? `${h.strength}%` : '-'}</div>
                  <div className="hq-muted hq-detail-cell">{fmtDateShort(h.lastFed)}</div>
                  <div className="hq-muted hq-detail-cell">{fmtDateShort(h.lastTreatment)}</div>
                  <div className="hq-muted hq-detail-cell">{fmtDateShort(h.lastBoxAdded)}</div>
                  <div className="hq-num hq-detail-cell">{queenAge(h.queen_year)}</div>
                  <div
                    className="hq-num hq-detail-cell"
                    style={lowRatio ? { color: 'var(--weak-text)', fontWeight: 500 } : undefined}
                  >
                    {fmtRatio(h.storesBroodRatio)}{lowRatio ? ' Low' : ''}
                  </div>

                  {/* Mobile stacked card (visible when hq-thead is hidden) */}
                  <div className="hq-detail-mobile">
                    <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>{h.name}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13 }}>
                      <span className="hq-muted">Frames</span>
                      <span>{h.strength != null ? `${h.strength}%` : '-'}</span>
                      <span className="hq-muted">Last fed</span>
                      <span>{fmtDateShort(h.lastFed)}</span>
                      <span className="hq-muted">Treated</span>
                      <span>{fmtDateShort(h.lastTreatment)}</span>
                      <span className="hq-muted">Box added</span>
                      <span>{fmtDateShort(h.lastBoxAdded)}</span>
                      <span className="hq-muted">Queen</span>
                      <span>{queenAge(h.queen_year)}</span>
                      <span className="hq-muted">S:B ratio</span>
                      <span style={lowRatio ? { color: 'var(--weak-text)', fontWeight: 500 } : undefined}>
                        {fmtRatio(h.storesBroodRatio)}{lowRatio ? ' Low' : ''}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {editing && (
        <SiteForm
          site={site}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refetch(); }}
        />
      )}
    </>
  );
}
