import { useState, useMemo } from 'react';
import { useOverviewData, useAllEvents, useSites, useHives } from '../../lib/hooks';
import { fmtMoney, fmtDate } from '../../lib/format';
import type { CostData } from '../../lib/database.types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Logo from '../layout/Logo';

export default function EconomicsPage() {
  const data = useOverviewData();
  const { events } = useAllEvents();
  const { sites } = useSites();
  const { hives } = useHives();
  const [filterSiteId, setFilterSiteId] = useState<string | null>(null);

  const siteMap = useMemo(() => new Map(sites.map(s => [s.id, s.name])), [sites]);
  const hiveMap = useMemo(() => new Map(hives.map(h => [h.id, h.name])), [hives]);

  const costEvents = useMemo(
    () => events.filter(e => e.event_type === 'cost'),
    [events],
  );

  const chartData = useMemo(
    () => Object.entries(data.costByCategory).map(([category, amount]) => ({ category, amount })),
    [data.costByCategory],
  );

  const profitLoss = data.totalRevenue - data.totalCosts;
  const costPerHive = data.totalHives ? data.totalCosts / data.totalHives : 0;

  const filteredSiteCosts = useMemo(() => {
    if (!filterSiteId) return null;
    const siteCosts: Record<string, number> = {};
    for (const e of costEvents) {
      if (e.site_id === filterSiteId) {
        const d = e.data as CostData;
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
      </header>

      {/* KPI strip */}
      <section className="hq-row" aria-label="Financial summary">
        <div className="hq-card hq-kpis">
          <div className="hq-kpi">
            <span className="hq-kpi-label">Total revenue</span>
            <span className="hq-kpi-value">{fmtMoney(data.totalRevenue)}</span>
            <span className="hq-kpi-sub">Harvests at $25/kg</span>
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
            <span className="hq-kpi-label">Cost per hive</span>
            <span className="hq-kpi-value">{fmtMoney(costPerHive)}</span>
            <span className="hq-kpi-sub">{data.totalHives} hives</span>
          </div>
        </div>
      </section>

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
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: 'var(--muted)' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--muted)' }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  formatter={(value: number) => [fmtMoney(value), 'Amount']}
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                  }}
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
            {filterSiteId && (
              <button className="hq-link" onClick={() => setFilterSiteId(null)}>
                Show all sites
              </button>
            )}
          </div>

          {filterSiteId && filteredSiteCosts ? (
            <>
              <div className="hq-trow hq-thead" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px' }}>
                <div>Category</div>
                <div style={{ textAlign: 'right' }}>Amount</div>
              </div>
              {filteredSiteCosts.length === 0 ? (
                <p className="hq-empty">No costs for this site.</p>
              ) : (
                filteredSiteCosts.map((row) => (
                  <div
                    key={row.category}
                    className="hq-trow"
                    style={{ gridTemplateColumns: 'minmax(0,1fr) 100px', cursor: 'default' }}
                  >
                    <div style={{ textTransform: 'capitalize' }}>{row.category}</div>
                    <div style={{ textAlign: 'right', fontWeight: 500 }}>{fmtMoney(row.amount)}</div>
                  </div>
                ))
              )}
            </>
          ) : (
            <>
              <div className="hq-trow hq-thead" style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 100px 60px' }}>
                <div>Site</div>
                <div style={{ textAlign: 'right' }}>Total cost</div>
                <div style={{ textAlign: 'right' }}>Cost/hive</div>
                <div style={{ textAlign: 'right' }}>Hives</div>
              </div>
              {data.sites.length === 0 ? (
                <p className="hq-empty">No sites yet.</p>
              ) : (
                data.sites.map((s) => (
                  <button
                    key={s.id}
                    className="hq-trow"
                    style={{ gridTemplateColumns: 'minmax(0,1fr) 100px 100px 60px' }}
                    onClick={() => setFilterSiteId(s.id)}
                  >
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
          <div className="hq-card-head">
            <h2>Recent cost entries</h2>
          </div>
          <div className="hq-trow hq-thead" style={{ gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 90px 80px' }}>
            <div>Date</div>
            <div>Site</div>
            <div>Hive</div>
            <div>Category</div>
            <div style={{ textAlign: 'right' }}>Amount</div>
          </div>
          {costEvents.length === 0 ? (
            <p className="hq-empty">No cost entries yet.</p>
          ) : (
            costEvents.slice(0, 50).map((e) => {
              const d = e.data as CostData;
              return (
                <div
                  key={e.id}
                  className="hq-trow"
                  style={{ gridTemplateColumns: '90px minmax(0,1fr) minmax(0,1fr) 90px 80px', cursor: 'default' }}
                >
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
  );
}
