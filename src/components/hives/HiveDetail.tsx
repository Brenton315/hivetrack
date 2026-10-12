import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHive, useEvents } from '../../lib/hooks';
import { useTheme } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { strengthFromFrames, status, statusLabel } from '../../lib/strength';
import { fmtDate, queenAge, fmtMoney, fmtRatio } from '../../lib/format';
import { SETTINGS } from '../../lib/settings';
import type { InspectionData, FeedData, TreatmentData, BoxAddedData, CostData, MoveData, EventType } from '../../lib/database.types';
import HiveForm from './HiveForm';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Tab = 'timeline' | 'trend' | 'quickadd';
type QuickAddType = 'feed' | 'treatment' | 'box_added' | 'inspection' | 'cost';

const EVENT_LABELS: Record<string, string> = {
  inspection: 'Inspection',
  feed: 'Feed',
  treatment: 'Treatment',
  box_added: 'Box added',
  cost: 'Cost',
  move: 'Move',
};

const EVENT_BADGE_CLASS: Record<string, string> = {
  inspection: 'brand',
  feed: 'fair',
  treatment: 'strong',
  box_added: 'muted',
  cost: 'weak',
  move: 'muted',
};

function eventDescription(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'inspection': {
      const d = data as unknown as InspectionData;
      return `${d.frames_of_bees} frames bees, ${d.frames_of_stores} stores, ${d.frames_of_brood} brood`;
    }
    case 'feed': {
      const d = data as unknown as FeedData;
      return `${d.amount} ${d.feed_type}`;
    }
    case 'treatment': {
      const d = data as unknown as TreatmentData;
      return d.product;
    }
    case 'box_added': {
      const d = data as unknown as BoxAddedData;
      return `Added ${d.box_type} box`;
    }
    case 'cost': {
      const d = data as unknown as CostData;
      return `${fmtMoney(d.amount)} ${d.category}`;
    }
    case 'move': {
      const d = data as unknown as MoveData;
      return `Moved from ${d.from_site_name ?? 'unknown'} to ${d.to_site_name ?? 'unknown'}`;
    }
    default:
      return '';
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HiveDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { hive, loading, refetch } = useHive(id);
  const { events, refetch: refetchEvents } = useEvents(undefined, id);
  const [tab, setTab] = useState<Tab>('timeline');
  const [editing, setEditing] = useState(false);

  // Quick Add state
  const [qaType, setQaType] = useState<QuickAddType>('feed');
  const [qaDate, setQaDate] = useState(today);
  const [qaSaving, setQaSaving] = useState(false);
  const [qaError, setQaError] = useState('');

  // Feed fields
  const [feedType, setFeedType] = useState(SETTINGS.feed.types[0]);
  const [feedAmount, setFeedAmount] = useState('');

  // Treatment fields
  const [treatProduct, setTreatProduct] = useState(SETTINGS.treatment.products[0]);

  // Box fields
  const [boxType, setBoxType] = useState<'brood' | 'super'>(SETTINGS.box.types[0]);

  // Inspection fields
  const [inspBees, setInspBees] = useState('');
  const [inspStores, setInspStores] = useState('');
  const [inspBrood, setInspBrood] = useState('');

  // Cost fields
  const [costCategory, setCostCategory] = useState(SETTINGS.cost.categories[0]);
  const [costAmount, setCostAmount] = useState('');

  // Derived data
  const lastInspection = useMemo(() => {
    const insp = events.find(e => e.event_type === 'inspection');
    return insp ? (insp.data as unknown as InspectionData) : null;
  }, [events]);

  const strength = lastInspection ? strengthFromFrames(lastInspection.frames_of_bees) : null;
  const hiveStatus = strength != null ? status(strength) : null;

  const boxCount = useMemo(() => {
    return events.filter(e => e.event_type === 'box_added').length + 1;
  }, [events]);

  const storesBroodRatio = useMemo(() => {
    if (!lastInspection) return null;
    const { frames_of_stores, frames_of_brood } = lastInspection;
    if (frames_of_brood > 0) return Math.round((frames_of_stores / frames_of_brood) * 100) / 100;
    return null;
  }, [lastInspection]);

  const trendData = useMemo(() => {
    return events
      .filter(e => e.event_type === 'inspection')
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .map(e => ({
        date: e.event_date,
        bees: (e.data as unknown as InspectionData).frames_of_bees,
        stores: (e.data as unknown as InspectionData).frames_of_stores,
        brood: (e.data as unknown as InspectionData).frames_of_brood,
      }));
  }, [events]);

  const lineColor = theme === 'dark' ? '#CFE8D8' : '#1D4A38';

  const resetQuickAddFields = () => {
    setQaDate(today());
    setFeedAmount('');
    setInspBees('');
    setInspStores('');
    setInspBrood('');
    setCostAmount('');
    setQaError('');
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hive || !id) return;
    setQaSaving(true);
    setQaError('');

    let data: Record<string, unknown> = {};
    switch (qaType) {
      case 'feed':
        data = { feed_type: feedType, amount: feedAmount };
        break;
      case 'treatment':
        data = { product: treatProduct };
        break;
      case 'box_added':
        data = { box_type: boxType };
        break;
      case 'inspection':
        data = {
          frames_of_bees: Number(inspBees),
          frames_of_stores: Number(inspStores),
          frames_of_brood: Number(inspBrood),
        };
        break;
      case 'cost':
        data = { category: costCategory, amount: Number(costAmount) };
        break;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setQaError('Not signed in'); setQaSaving(false); return; }

    const { error } = await supabase.from('hive_events').insert({
      user_id: user.id,
      hive_id: id,
      site_id: hive.site_id,
      event_type: qaType as EventType,
      event_date: qaDate,
      data,
    });

    if (error) {
      setQaError(error.message);
    } else {
      resetQuickAddFields();
      refetchEvents();
    }
    setQaSaving(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
  if (!hive) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)' }}>Hive not found</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'timeline', label: `Timeline (${events.length})` },
    { key: 'trend', label: 'Trend' },
    { key: 'quickadd', label: 'Quick Add' },
  ];

  const qaTypes: { key: QuickAddType; label: string }[] = [
    { key: 'feed', label: 'Feed' },
    { key: 'treatment', label: 'Treatment' },
    { key: 'box_added', label: 'Box' },
    { key: 'inspection', label: 'Inspection' },
    { key: 'cost', label: 'Cost' },
  ];

  return (
    <>
      {/* HEADER */}
      <button className="hq-back" onClick={() => navigate(-1)}>
        <svg className="icon" width="14" height="14" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
        Back
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1>{hive.name}</h1>
          {hive.site_name && <span className="hq-subtitle">at {hive.site_name}</span>}
        </div>
        <button className="hq-btn-secondary" onClick={() => setEditing(true)}>Edit</button>
      </div>

      {/* INFO CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, margin: '16px 0' }}>
        <div className="hq-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Queen</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{hive.queen_breed ?? '--'}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {hive.queen_year ? `${hive.queen_year} (${queenAge(hive.queen_year)})` : '--'}
          </div>
        </div>

        <div className="hq-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Strength</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {lastInspection ? `${lastInspection.frames_of_bees} frames` : '--'}
          </div>
          {hiveStatus && (
            <span className={`hq-status hq-st-${hiveStatus}`} style={{ marginTop: 2 }}>
              <span aria-hidden="true">●</span> {statusLabel(hiveStatus)}
            </span>
          )}
        </div>

        <div className="hq-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Boxes</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{boxCount}</div>
        </div>

        <div className="hq-card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Stores:brood</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{fmtRatio(storesBroodRatio)}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="hq-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`hq-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TIMELINE */}
      {tab === 'timeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {events.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No events recorded yet.</p>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="hq-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `var(--${EVENT_BADGE_CLASS[ev.event_type] ?? 'muted'})`,
                      color: '#fff',
                    }}
                  >
                    {EVENT_LABELS[ev.event_type] ?? ev.event_type}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{fmtDate(ev.event_date)}</span>
                </div>
                <div style={{ fontSize: 14 }}>
                  {eventDescription(ev.event_type, ev.data)}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TREND */}
      {tab === 'trend' && (
        <div>
          {trendData.length === 0 ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              No inspection data to chart.
            </div>
          ) : (
            <div className="hq-card" style={{ padding: 16 }}>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--line-2)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => {
                      const p = d.split('-');
                      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                      return `${Number(p[2])} ${months[Number(p[1]) - 1]}`;
                    }}
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: 'var(--muted)' }}
                    label={{ value: 'Frames', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'var(--muted)' } }}
                  />
                  <Tooltip
                    labelFormatter={(label) => {
                      const p = String(label).split('-');
                      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                      return `${Number(p[2])} ${months[Number(p[1]) - 1]} ${p[0]}`;
                    }}
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 6 }}
                  />
                  <Line type="monotone" dataKey="bees" name="Bees" stroke={lineColor} strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="stores" name="Stores" stroke="var(--fair)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="brood" name="Brood" stroke="var(--strong)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* QUICK ADD */}
      {tab === 'quickadd' && (
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {qaTypes.map((t) => (
              <button
                key={t.key}
                className={qaType === t.key ? 'hq-btn-primary' : 'hq-btn-secondary'}
                style={{ borderRadius: 20 }}
                onClick={() => { setQaType(t.key); setQaError(''); }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="hq-card" style={{ padding: 16 }}>
            <form onSubmit={handleQuickAdd}>
              <div className="hq-field">
                <label className="hq-label" htmlFor="qa-date">Date</label>
                <input
                  id="qa-date"
                  type="date"
                  value={qaDate}
                  onChange={(e) => setQaDate(e.target.value)}
                  required
                  className="hq-input"
                />
              </div>

              {qaType === 'feed' && (
                <>
                  <div className="hq-field">
                    <label className="hq-label" htmlFor="qa-feed-type">Feed type</label>
                    <select
                      id="qa-feed-type"
                      value={feedType}
                      onChange={(e) => setFeedType(e.target.value)}
                      className="hq-select"
                    >
                      {SETTINGS.feed.types.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hq-field">
                    <label className="hq-label" htmlFor="qa-feed-amount">Amount</label>
                    <input
                      id="qa-feed-amount"
                      value={feedAmount}
                      onChange={(e) => setFeedAmount(e.target.value)}
                      required
                      className="hq-input"
                      placeholder="e.g. 2L"
                    />
                  </div>
                </>
              )}

              {qaType === 'treatment' && (
                <div className="hq-field">
                  <label className="hq-label" htmlFor="qa-treat-product">Product</label>
                  <select
                    id="qa-treat-product"
                    value={treatProduct}
                    onChange={(e) => setTreatProduct(e.target.value)}
                    className="hq-select"
                  >
                    {SETTINGS.treatment.products.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {qaType === 'box_added' && (
                <div className="hq-field">
                  <label className="hq-label" htmlFor="qa-box-type">Box type</label>
                  <select
                    id="qa-box-type"
                    value={boxType}
                    onChange={(e) => setBoxType(e.target.value as 'brood' | 'super')}
                    className="hq-select"
                  >
                    {SETTINGS.box.types.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {qaType === 'inspection' && (
                <>
                  <div className="hq-field">
                    <label className="hq-label" htmlFor="qa-insp-bees">Frames of bees</label>
                    <input
                      id="qa-insp-bees"
                      type="number"
                      min="0"
                      max="20"
                      value={inspBees}
                      onChange={(e) => setInspBees(e.target.value)}
                      required
                      className="hq-input"
                    />
                  </div>
                  <div className="hq-field">
                    <label className="hq-label" htmlFor="qa-insp-stores">Frames of stores</label>
                    <input
                      id="qa-insp-stores"
                      type="number"
                      min="0"
                      max="20"
                      value={inspStores}
                      onChange={(e) => setInspStores(e.target.value)}
                      required
                      className="hq-input"
                    />
                  </div>
                  <div className="hq-field">
                    <label className="hq-label" htmlFor="qa-insp-brood">Frames of brood</label>
                    <input
                      id="qa-insp-brood"
                      type="number"
                      min="0"
                      max="20"
                      value={inspBrood}
                      onChange={(e) => setInspBrood(e.target.value)}
                      required
                      className="hq-input"
                    />
                  </div>
                </>
              )}

              {qaType === 'cost' && (
                <>
                  <div className="hq-field">
                    <label className="hq-label" htmlFor="qa-cost-cat">Category</label>
                    <select
                      id="qa-cost-cat"
                      value={costCategory}
                      onChange={(e) => setCostCategory(e.target.value)}
                      className="hq-select"
                    >
                      {SETTINGS.cost.categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hq-field">
                    <label className="hq-label" htmlFor="qa-cost-amount">Amount ($)</label>
                    <input
                      id="qa-cost-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={costAmount}
                      onChange={(e) => setCostAmount(e.target.value)}
                      required
                      className="hq-input"
                    />
                  </div>
                </>
              )}

              {qaError && <p className="hq-error" style={{ marginBottom: 12 }}>{qaError}</p>}

              <button type="submit" disabled={qaSaving} className="hq-btn-primary" style={{ width: '100%', minHeight: 44 }}>
                {qaSaving ? 'Saving...' : 'Save'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editing && hive.site_id && (
        <HiveForm
          siteId={hive.site_id}
          hive={hive}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); refetch(); }}
        />
      )}
    </>
  );
}
