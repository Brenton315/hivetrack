import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SETTINGS } from '../../lib/settings';
import { useSites } from '../../lib/hooks';
import Logo from '../layout/Logo';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export default function CalendarPage() {
  const { sites, loading } = useSites();
  const navigate = useNavigate();

  const { plants, months: _monthNames } = SETTINGS.flowering;

  const sitesByFlowering = useMemo(() => {
    const grouped: Record<string, typeof sites> = {};
    for (const plant of plants) {
      grouped[plant.name] = [];
    }
    for (const site of sites) {
      const key = site.main_flowering;
      if (key && grouped[key]) {
        grouped[key].push(site);
      }
    }
    return grouped;
  }, [sites, plants]);

  // Determine current month (1-indexed)
  const currentMonth = new Date().getMonth() + 1;

  return (
    <>
      <header className="hq-header">
        <div className="hq-brand">
          <Logo size={26} />
          <span className="hq-wordmark">hivehq</span>
        </div>
        <div className="hq-title">
          <h1>Flowering Calendar</h1>
          <span className="hq-subtitle">Seasonal flowering periods for the Wairarapa region</span>
        </div>
      </header>

      {/* Calendar grid */}
      <section className="hq-row" aria-label="Flowering calendar">
        <div className="hq-card" style={{ padding: 16, overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: 13,
              minWidth: 480,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    color: 'var(--muted)',
                    fontWeight: 500,
                    borderBottom: '1px solid var(--line)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Plant
                </th>
                {MONTH_LABELS.map((label, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: 'center',
                      padding: '6px 2px',
                      color: currentMonth === i + 1 ? 'var(--brand)' : 'var(--muted)',
                      fontWeight: currentMonth === i + 1 ? 700 : 500,
                      borderBottom: '1px solid var(--line)',
                      width: '6%',
                      minWidth: 28,
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plants.map((plant) => (
                <tr key={plant.name}>
                  <td
                    style={{
                      padding: '8px 10px',
                      fontWeight: 500,
                      color: 'var(--ink)',
                      borderBottom: '1px solid var(--line)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: plant.colour,
                        marginRight: 8,
                        verticalAlign: 'middle',
                      }}
                    />
                    {plant.name}
                  </td>
                  {MONTH_LABELS.map((_, i) => {
                    const monthNum = i + 1;
                    const active = (plant.months as readonly number[]).includes(monthNum);
                    return (
                      <td
                        key={i}
                        style={{
                          padding: '8px 2px',
                          borderBottom: '1px solid var(--line)',
                          textAlign: 'center',
                        }}
                      >
                        {active ? (
                          <div
                            style={{
                              height: 12,
                              borderRadius: 3,
                              backgroundColor: plant.colour,
                              opacity: currentMonth === monthNum ? 1 : 0.7,
                              margin: '0 1px',
                            }}
                          />
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sites by flowering type */}
      <section className="hq-row" aria-label="Sites by flowering type">
        <div className="hq-card" style={{ paddingBottom: 8 }}>
          <div className="hq-card-head">
            <h2>Sites by flowering type</h2>
          </div>

          {loading ? (
            <p className="hq-empty">Loading...</p>
          ) : (
            plants.map((plant) => {
              const plantSites = sitesByFlowering[plant.name] ?? [];
              if (plantSites.length === 0) return null;
              return (
                <div
                  key={plant.name}
                  className="hq-trow"
                  style={{
                    gridTemplateColumns: '120px minmax(0,1fr)',
                    cursor: 'default',
                    alignItems: 'start',
                  }}
                >
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: plant.colour,
                        flexShrink: 0,
                      }}
                    />
                    {plant.name}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                    {plantSites.map((site) => (
                      <button
                        key={site.id}
                        className="hq-link"
                        onClick={() => navigate(`/sites/${site.id}`)}
                        style={{ fontSize: 13 }}
                      >
                        {site.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {!loading && plants.every(p => (sitesByFlowering[p.name] ?? []).length === 0) && (
            <p className="hq-empty">No sites linked to flowering types yet.</p>
          )}
        </div>
      </section>
    </>
  );
}
