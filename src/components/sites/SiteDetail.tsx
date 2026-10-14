import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSite, useHives, useEvents, useOverviewData, computeHiveData } from '../../lib/hooks';
import type { HiveWithStrength } from '../../lib/hooks';
import type { Hive } from '../../lib/database.types';
import { fmtDate, fmtDateShort, queenAge, fmtRatio, fmtMoney } from '../../lib/format';
import { SETTINGS } from '../../lib/settings';
import { supabase } from '../../lib/supabase';
import SiteForm from './SiteForm';
import SiteMapInteractive from './SiteMapInteractive';
import HiveForm from '../hives/HiveForm';
import InspectionForm from '../hives/InspectionForm';
import DeleteHiveDialog from '../hives/DeleteHiveDialog';
import MoveHiveDialog from '../hives/MoveHiveDialog';
import BulkInspectionForm from '../hives/BulkInspectionForm';

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

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { site, loading, refetch } = useSite(id);
  const { hives, refetch: refetchHives } = useHives(id);
  const { events, refetch: refetchEvents } = useEvents(id);
  const overviewData = useOverviewData();
  const [editing, setEditing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [mapEditMode, setMapEditMode] = useState(false);
  const [showAddHive, setShowAddHive] = useState(false);
  const [inspectingHive, setInspectingHive] = useState<Hive | null>(null);
  const [deletingHive, setDeletingHive] = useState<Hive | null>(null);
  const [movingHive, setMovingHive] = useState<Hive | null>(null);
  const [showBulkInspection, setShowBulkInspection] = useState(false);
  const [selectedHiveId, setSelectedHiveId] = useState<string | null>(null);
  const [hiveAction, setHiveAction] = useState<string | null>(null);

  const activeHives = useMemo(() => hives.filter(h => h.status === 'active'), [hives]);

  const hiveData = useMemo(() => {
    return activeHives.map(h => computeHiveData(
      { ...h, site_name: site?.name ?? '' } as Hive & { site_name: string },
      events
    ));
  }, [activeHives, events, site]);

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

  const handleHiveMoved = async (hiveId: string, lat: number, lng: number) => {
    await supabase.from('hives').update({ hive_lat: lat, hive_lng: lng }).eq('id', hiveId);
    refetchHives();
  };

  const handleMapHiveClick = (hive: Hive) => {
    setSelectedHiveId(hive.id);
    setHiveAction(null);
  };

  const selectedHive = activeHives.find(h => h.id === selectedHiveId) ?? null;
  const selectedHiveData = hiveData.find(h => h.id === selectedHiveId) ?? null;

  const refetchAll = () => {
    refetch();
    refetchHives();
    refetchEvents();
  };

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
          {site.location_text && <span className="hq-subtitle">{site.location_text}</span>}
        </div>
        <button className="hq-btn-secondary" onClick={() => setEditing(true)}>Edit</button>
      </div>

      {/* Interactive map with hive markers */}
      {site.lat != null && site.lng != null && (
        <div style={{ position: 'relative' }}>
          <SiteMapInteractive
            siteLat={site.lat}
            siteLng={site.lng}
            hives={hives}
            onHiveClick={handleMapHiveClick}
            onHiveMoved={handleHiveMoved}
            editMode={mapEditMode}
          />
          <button
            type="button"
            className={`hq-map-edit-btn ${mapEditMode ? 'active' : ''}`}
            onClick={() => setMapEditMode(!mapEditMode)}
            title={mapEditMode ? 'Lock hive positions' : 'Drag hives to reposition'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mapEditMode ? (
                <><path d="M12 2v20M2 12h20" /><circle cx="12" cy="12" r="3" /></>
              ) : (
                <><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></>
              )}
            </svg>
            {mapEditMode ? 'Done' : 'Place hives'}
          </button>
        </div>
      )}

      {/* Selected hive panel (from map click) */}
      {selectedHive && selectedHiveData && (
        <div className="hq-card hq-selected-hive-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>{selectedHive.name}</h3>
            <button
              type="button"
              className="hq-modal-close"
              style={{ position: 'static', fontSize: 18 }}
              onClick={() => setSelectedHiveId(null)}
            >
              &times;
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12, fontSize: 13 }}>
            <div>
              <span className="hq-muted">Strength</span>
              <div style={{ fontWeight: 600 }}>{selectedHiveData.strength != null ? `${selectedHiveData.strength}%` : '--'}</div>
            </div>
            <div>
              <span className="hq-muted">Queen</span>
              <div style={{ fontWeight: 600 }}>{queenAge(selectedHive.queen_year)}</div>
            </div>
            <div>
              <span className="hq-muted">S:B Ratio</span>
              <div style={{ fontWeight: 600 }}>{fmtRatio(selectedHiveData.storesBroodRatio)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="hq-btn-primary hq-btn-sm" onClick={() => setInspectingHive(selectedHive)}>
              Inspect
            </button>
            <button className="hq-btn-secondary hq-btn-sm" onClick={() => navigate(`/hives/${selectedHive.id}`)}>
              Details
            </button>
            <button className="hq-btn-secondary hq-btn-sm" onClick={() => setMovingHive(selectedHive)}>
              Move
            </button>
            <button className="hq-btn-secondary hq-btn-sm" style={{ color: 'var(--weak-text)' }} onClick={() => setDeletingHive(selectedHive)}>
              Remove
            </button>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="hq-card hq-kpis" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
        <div className="hq-kpi">
          <span className="hq-kpi-label">Hives</span>
          <span className="hq-kpi-value">{activeHives.length}</span>
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

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
        <button className="hq-btn-primary hq-btn-sm" onClick={() => setShowAddHive(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add hive
        </button>
        <button className="hq-btn-secondary hq-btn-sm" onClick={() => setShowBulkInspection(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
          Bulk inspection
        </button>
      </div>

      {/* Hive table */}
      <div className="hq-card" style={{ paddingBottom: 8 }}>
        <div className="hq-card-head">
          <h2>Hives</h2>
        </div>

        {hiveData.length === 0 ? (
          <p className="hq-empty">
            No hives at this site.{' '}
            <button className="hq-link" onClick={() => setShowAddHive(true)}>Add your first hive</button>
          </p>
        ) : (
          <>
            <div
              className="hq-trow hq-thead"
              style={{ gridTemplateColumns: 'minmax(0,1.2fr) 72px 80px 80px 80px 60px minmax(70px,0.8fr) 40px', cursor: 'default' }}
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
              <div></div>
            </div>

            {sorted.map((h) => {
              const lowRatio = h.storesBroodRatio != null && h.storesBroodRatio < SETTINGS.stores.lowRatio;
              const hiveObj = activeHives.find(hv => hv.id === h.id);
              return (
                <div
                  key={h.id}
                  className="hq-trow"
                  style={{
                    gridTemplateColumns: 'minmax(0,1.2fr) 72px 80px 80px 80px 60px minmax(70px,0.8fr) 40px',
                    background: selectedHiveId === h.id ? 'var(--hover)' : undefined,
                  }}
                >
                  {/* Desktop layout */}
                  <button className="hq-site-name hq-detail-cell" onClick={() => navigate(`/hives/${h.id}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, color: 'var(--text)' }}>
                    {h.name}
                  </button>
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
                  <div className="hq-detail-cell" style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      className="hq-icon-btn"
                      title="Actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHiveId(selectedHiveId === h.id ? null : h.id);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>
                  </div>

                  {/* Mobile stacked card */}
                  <div className="hq-detail-mobile">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <button onClick={() => navigate(`/hives/${h.id}`)} style={{ fontWeight: 500, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text)' }}>
                        {h.name}
                      </button>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {hiveObj && (
                          <button className="hq-btn-primary hq-btn-xs" onClick={() => setInspectingHive(hiveObj)}>
                            Inspect
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13 }}>
                      <span className="hq-muted">Frames</span>
                      <span>{h.strength != null ? `${h.strength}%` : '-'}</span>
                      <span className="hq-muted">Last fed</span>
                      <span>{fmtDateShort(h.lastFed)}</span>
                      <span className="hq-muted">Treated</span>
                      <span>{fmtDateShort(h.lastTreatment)}</span>
                      <span className="hq-muted">Queen</span>
                      <span>{queenAge(h.queen_year)}</span>
                      <span className="hq-muted">S:B ratio</span>
                      <span style={lowRatio ? { color: 'var(--weak-text)', fontWeight: 500 } : undefined}>
                        {fmtRatio(h.storesBroodRatio)}{lowRatio ? ' Low' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Visit history */}
      <div className="hq-card" style={{ paddingBottom: 8 }}>
        <div className="hq-card-head">
          <h2>Site history</h2>
        </div>
        {events.length === 0 ? (
          <p className="hq-empty">No events recorded for this site.</p>
        ) : (
          events.slice(0, 20).map((e) => (
            <div
              key={e.id}
              className="hq-trow"
              style={{ gridTemplateColumns: '80px 90px minmax(0,1fr)', cursor: 'default' }}
            >
              <div className="hq-muted" style={{ fontSize: 13 }}>{fmtDate(e.event_date)}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {e.event_type === 'box_added' ? 'Box change' : e.event_type.charAt(0).toUpperCase() + e.event_type.slice(1)}
              </div>
              <div className="hq-muted" style={{ fontSize: 13 }}>
                {e.notes ?? ''}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {editing && (
        <SiteForm
          site={site}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refetch(); }}
        />
      )}

      {showAddHive && (
        <HiveForm
          siteId={id!}
          onClose={() => setShowAddHive(false)}
          onSaved={() => { setShowAddHive(false); refetchAll(); }}
        />
      )}

      {inspectingHive && (
        <InspectionForm
          hive={inspectingHive}
          onClose={() => setInspectingHive(null)}
          onSaved={() => { setInspectingHive(null); refetchAll(); }}
        />
      )}

      {deletingHive && (
        <DeleteHiveDialog
          hive={deletingHive}
          onClose={() => setDeletingHive(null)}
          onDeleted={() => { setDeletingHive(null); refetchAll(); }}
        />
      )}

      {movingHive && (
        <MoveHiveDialog
          hive={movingHive}
          currentSiteName={site.name}
          onClose={() => setMovingHive(null)}
          onMoved={() => { setMovingHive(null); refetchAll(); }}
        />
      )}

      {showBulkInspection && (
        <BulkInspectionForm
          siteId={id!}
          hives={hives}
          onClose={() => setShowBulkInspection(false)}
          onSaved={() => { setShowBulkInspection(false); refetchAll(); }}
        />
      )}
    </>
  );
}
