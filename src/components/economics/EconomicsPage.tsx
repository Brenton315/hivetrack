import { useState, useMemo } from 'react';
import { useOverviewData, useAllEvents, useSites, useHives, useHarvests } from '../../lib/hooks';
import { fmtMoney, fmtDate } from '../../lib/format';
import type { CostData, Harvest } from '../../lib/database.types';
import { SETTINGS } from '../../lib/settings';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Logo from '../layout/Logo';
import HarvestForm from './HarvestForm';

const PIE_COLORS = ['#1D4A38', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#B7E4C7', '#D8F3DC'];

export default function EconomicsPage() {
  const data = useOverviewData();
  const { events } = useAllEvents();
  const { sites } = useSites();
  const { hives } = useHives();
  const { harvests, refetch: refetchHarvests } = useHarvests();
  const [filterSiteId, setFilterSiteId] = useState<string | null>(null);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'harvests'>('overview');

  const siteMap = useMemo(() => new Map(sites.map(s => [s.id, s.name])), [sites]);
  const hiveMap = useMemo(() => new Map(hives.map(h => [h.id, h.name])), [hives]);

  const costEvents = useMemo(() => events.filter(e => e.event_type === 'cost'), [events]);

  const chartData = useMemo(
    () => Object.entries(data.costByCategory).map(([category, amount]) => ({ category, amount })),
    [data.costByCategory],
  );

  const totalHarvestKg = useMemo(() => harvests.reduce((s, h) => s + h.kg, 0), [harvests]);
  const harvestRevenue = totalHarvestKg * SETTINGS.revenue.honeyPricePerKg;
  const profitLoss = harvestRevenue - data.totalCosts;
  const costPerHive = data.totalHives ? data.totalCosts / data.totalHives : 0;
  const revenuePerHive = data.totalHives ? harvestRevenue / data.totalHives : 0;

  const harvestByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of harvests) {
      const t = h.honey_type ?? 'Unspecified';
      map.set(t, (map.get(t) ?? 0) + h.kg);
    }
    return Array.from(map.entries()).map(([name, kg]) => ({ name, kg })).sort((a, b) => b.kg - a.kg);
  }, [harvests]);

  const harvestBySite = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of harvests) {
      const name = siteMap.get(h.site_id) ?? 'Unknown';
      map.set(name, (map.get(name) ?? 0) + h.kg);
    }
    return Array.from(map.entries()).map(([site, kg]) => ({ site, kg, revenue: kg * SETTINGS.revenue.honeyPricePerKg })).sort((a, b) => b.kg - a.kg);
  }, [harvests, siteMap]);

  const harvestBySeason = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of harvests) {
      map.set(h.season, (map.get(h.season) ?? 0) + h.kg);
    }
    return Array.from(map.entries()).map(([season, kg]) => ({ season, kg, revenue: kg * SETTINGS.revenue.honeyPricePerKg })).sort((a, b) => b.season.localeCompare(a.season));
  }, [harvests]);

  const filteredSiteCosts = useMemo(() => {
    if (!filterSiteId) return null;
    const siteCosts: Record<string, number> = {};
    for (const e of costEvents) {
      if (e.site_id === filterSiteId) {
        const d = e.data as unknown as CostData;
        siteCosts[d.category] = (siteCosts[d.category] ?? 0) + (d.amount ?? 0);
      }
    }
    return Object.entries(siteCosts).map(([category, amount]) => ({ category, amount }));
  }, [filterSiteId, costEvents]);

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
          <h1>Economics</h1>
        </div>
        <div className="hq-actions">
          <button type="button" className="hq-btn-primary hq-add-btn" onClick={() => { setEditingHarvest(null); setShowHarvestForm(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            <span className="hq-add-label">Harvest</span>
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <section className="hq-row" aria-label="Financial summary">
        <div className="hq-card hq-kpis">
          <div className="hq-kpi">
            <span className="hq-kpi-label">Revenue</span>
            <span className="hq-kpi-value">{fmtMoney(harvestRevenue)}</span>
            <span className="hq-kpi-sub">{totalHarvestKg.toFixed(0)} kg @ ${SETTINGS.revenue.honeyPricePerKg}/kg</span>
          </div>
          <div className="hq-kpi">
            <span className="hq-kpi-label">Total costs</span>
            <span className="hq-kpi-value">{fmtMoney(data.totalCosts)}</span>
          </div>
          <div className="hq-kpi">
            <span className="hq-kpi-label">Profit / loss</span>
            <span className="hq-kpi-value" style={{ color: profitLoss >= 0 ? 'var(--brand)' : 'var(--danger)' }}>
              {profitLoss >= 0 ? '+' : ''}{fmtMoney(profitLoss)}
            </span>
          </div>
          <div className="hq-kpi">
            <span className="hq-kpi-label">Revenue/hive</span>
            <span className="hq-kpi-value">{fmtMoney(revenuePerHive)}</span>
            <span className="hq-kpi-sub">Cost: {fmtMoney(costPerHive)}</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, margin: '12px 0 8px' }}>
        <button
          className={activeTab === 'overview' ? 'hq-btn-primary hq-btn-sm' : 'hq-btn-secondary hq-btn-sm'}
          onClick={() => setActiveTab('overview')}
        >Costs</button>
        <button
          className={activeTab === 'harvests' ? 'hq-btn-primary hq-btn-sm' : 'hq-btn-secondary hq-btn-sm'}
          onClick={() => setActiveTab('harvests')}
        >Harvests ({harvests.length})</button>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Cost breakdown chart */}
          <section className="hq-row" aria-label="Cost breakdown">
            <div className="hq-card" style={{ padding: 16 }}>
              <div className="hq-card-head" style={{ padding: '0 0 12px' }}>
                <h2>Cost by category</h2>
              </div>
              {chartData.length === 0 ? (
                <p className="hq-empty">No costs recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line-2)" />
                    <XAxis dataKey="category" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => [fmtMoney(Number(value ?? 0)), 'Amount']}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 6 }}
                    />
                    <Bar dataKey="amount" fill="#1D4A38" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Cost by site table */}
          <section className="hq-row" aria-label="Cost by site">
            <div className="hq-card" style={{ paddingBottom: 8 }}>
              <div className="hq-card-head">
                <h2>{filterSiteId ? `${siteMap.get(filterSiteId) ?? 'Site'} costs` : 'Cost by site'}</h2>
                {filterSiteId && <button className="hq-link" onClick={() => setFilterSiteId(null)}>Show all sites</button>}
              </div>

              {filterSiteId && filteredSiteCosts ? (
                <>
                  <div className="hq-trow hq-thead" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px' }}>
                    <div>Category</div><div style={{ textAlign: 'right' }}>Amount</div>
                  </div>
                  {filteredSiteCosts.length === 0 ? (
                    <p className="hq-empty">No costs for this site.</p>
                  ) : (
                    filteredSiteCosts.map((row) => (
                      <div key={row.category} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px', cursor: 'default' }}>
                        <div style={{ textTransform: 'capitalize' }}>{row.category}</div>
                        <div style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(row.amount)}</div>
                      </div>
                    ))
                  )}
                </>
              ) : (
                <>
                  <div className="hq-trow hq-thead" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 100px 60px' }}>
                    <div>Site</div><div style={{ textAlign: 'right' }}>Total cost</div><div style={{ textAlign: 'right' }}>Cost/hive</div><div style={{ textAlign: 'right' }}>Hives</div>
                  </div>
                  {data.sites.length === 0 ? (
                    <p className="hq-empty">No sites yet.</p>
                  ) : (
                    data.sites.map((s) => (
                      <button key={s.id} className="hq-trow" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 100px 60px' }} onClick={() => setFilterSiteId(s.id)}>
                        <div className="hq-site-name">{s.name}</div>
                        <div style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(s.totalCost)}</div>
                        <div style={{ textAlign: 'right' }} className="hq-muted">{fmtMoney(s.costPerHive)}</div>
                        <div style={{ textAlign: 'right' }} className="hq-muted">{s.hiveCount}</div>
                      </button>
                    ))
                  )}
                </>
              )}
            </div>
          </section>

          {/* Recent cost entries */}
          <section className="hq-row" aria-label="Recent costs">
            <div className="hq-card" style={{ paddingBottom: 8 }}>
              <div className="hq-card-head"><h2>Recent cost entries</h2></div>
              <div className="hq-trow hq-thead" style={{ gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 90px 80px' }}>
                <div>Date</div><div>Site</div><div>Hive</div><div>Category</div><div style={{ textAlign: 'right' }}>Amount</div>
              </div>
              {costEvents.length === 0 ? (
                <p className="hq-empty">No cost entries yet.</p>
              ) : (
                costEvents.slice(0, 50).map((e) => {
                  const d = e.data as unknown as CostData;
                  return (
                    <div key={e.id} className="hq-trow" style={{ gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 90px 80px', cursor: 'default' }}>
                      <div className="hq-muted">{fmtDate(e.event_date)}</div>
                      <div>{siteMap.get(e.site_id) ?? 'Unknown'}</div>
                      <div className="hq-muted">{e.hive_id ? (hiveMap.get(e.hive_id) ?? '--') : '--'}</div>
                      <div style={{ textTransform: 'capitalize' }}>{d.category}</div>
                      <div style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(d.amount ?? 0)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </>
      )}

      {activeTab === 'harvests' && (
        <>
          {/* Harvest by honey type pie chart */}
          {harvestByType.length > 0 && (
            <section className="hq-row" aria-label="Harvest by type">
              <div className="hq-card" style={{ padding: 16 }}>
                <div className="hq-card-head" style={{ padding: '0 0 12px' }}>
                  <h2>Yield by honey type</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={harvestByType} dataKey="kg" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {harvestByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(1)} kg`, 'Yield']}
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 6 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {harvestByType.map((t, i) => (
                      <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span>{t.name}</span>
                        <span className="hq-muted">{t.kg.toFixed(1)} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Revenue by site */}
          {harvestBySite.length > 0 && (
            <section className="hq-row" aria-label="Revenue by site">
              <div className="hq-card" style={{ padding: 16 }}>
                <div className="hq-card-head" style={{ padding: '0 0 12px' }}>
                  <h2>Revenue by site</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={harvestBySite} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line-2)" />
                    <XAxis dataKey="site" tick={{ fontSize: 12, fill: 'var(--muted)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--muted)' }} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip
                      formatter={(value) => [fmtMoney(Number(value ?? 0)), 'Revenue']}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 6 }}
                    />
                    <Bar dataKey="revenue" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* Revenue by season */}
          {harvestBySeason.length > 0 && (
            <section className="hq-row" aria-label="Revenue by season">
              <div className="hq-card" style={{ paddingBottom: 8 }}>
                <div className="hq-card-head"><h2>Revenue by season</h2></div>
                <div className="hq-trow hq-thead" style={{ gridTemplateColumns: '1fr 80px 100px' }}>
                  <div>Season</div><div style={{ textAlign: 'right' }}>Yield (kg)</div><div style={{ textAlign: 'right' }}>Revenue</div>
                </div>
                {harvestBySeason.map(s => (
                  <div key={s.season} className="hq-trow" style={{ gridTemplateColumns: '1fr 80px 100px', cursor: 'default' }}>
                    <div style={{ fontWeight: 500 }}>{s.season}</div>
                    <div style={{ textAlign: 'right' }} className="hq-muted">{s.kg.toFixed(1)}</div>
                    <div style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(s.revenue)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Harvest records table */}
          <section className="hq-row" aria-label="Harvest records">
            <div className="hq-card" style={{ paddingBottom: 8 }}>
              <div className="hq-card-head"><h2>Harvest records</h2></div>
              <div className="hq-trow hq-thead" style={{ gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 80px 60px 40px' }}>
                <div>Date</div><div>Site</div><div>Hive</div><div>Type</div><div style={{ textAlign: 'right' }}>kg</div><div></div>
              </div>
              {harvests.length === 0 ? (
                <p className="hq-empty">No harvests recorded yet. Click + Harvest to add one.</p>
              ) : (
                harvests.slice(0, 100).map(h => (
                  <div key={h.id} className="hq-trow" style={{ gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 80px 60px 40px', cursor: 'default' }}>
                    <div className="hq-muted">{fmtDate(h.harvest_date)}</div>
                    <div>{siteMap.get(h.site_id) ?? 'Unknown'}</div>
                    <div className="hq-muted">{h.hive_id ? (hiveMap.get(h.hive_id) ?? '--') : 'Site-wide'}</div>
                    <div className="hq-muted" style={{ fontSize: 12 }}>{h.honey_type ?? '--'}</div>
                    <div style={{ textAlign: 'right', fontWeight: 500 }}>{h.kg}</div>
                    <div>
                      <button
                        className="hq-icon-btn"
                        title="Edit"
                        onClick={() => { setEditingHarvest(h); setShowHarvestForm(true); }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {showHarvestForm && (
        <HarvestForm
          harvest={editingHarvest}
          onClose={() => { setShowHarvestForm(false); setEditingHarvest(null); }}
          onSaved={() => { setShowHarvestForm(false); setEditingHarvest(null); refetchHarvests(); data.refetch(); }}
        />
      )}
    </>
  );
}
