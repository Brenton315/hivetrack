import { useState } from 'react';
import { useOverviewData, useAllEvents } from '../../lib/hooks';
import { askQuestion } from '../../lib/ai';
import type { DataSummary } from '../../lib/ai';

const EXAMPLE_QUESTIONS = [
  'Which sites are overdue for inspection?',
  'What is my strongest performing site?',
  'How much have I spent on treatments this season?',
  'Which hives need the most attention?',
  'Compare revenue vs costs across my sites.',
];

export default function AskPanel() {
  const overview = useOverviewData();
  const { events } = useAllEvents();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildSummary(): DataSummary {
    return {
      sites: overview.sites.map(s => ({
        name: s.name,
        hive_count: s.hiveCount,
        strength: s.strength,
        last_checked: s.lastChecked,
        overdue: s.overdue,
      })),
      total_hives: overview.totalHives,
      total_revenue: overview.totalRevenue,
      total_costs: overview.totalCosts,
      recent_events: (events ?? []).slice(0, 50).map(e => ({
        type: e.event_type,
        date: e.event_date,
        site: e.site_id,
        notes: e.notes,
      })),
    };
  }

  async function handleAsk(q?: string) {
    const query = q ?? question;
    if (!query.trim()) return;
    setError(null);
    setAnswer(null);
    setLoading(true);
    if (q) setQuestion(q);
    try {
      const result = await askQuestion(query.trim(), buildSummary());
      setAnswer(result.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  }

  if (overview.loading) {
    return <div style={{ padding: 20, color: 'var(--muted)', textAlign: 'center' }}>Loading data...</div>;
  }

  return (
    <div className="hq-card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAsk(); }}
          placeholder="Ask about your hive data..."
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)',
            background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit',
          }}
          maxLength={500}
        />
        <button className="hq-btn-primary" onClick={() => handleAsk()} disabled={loading || !question.trim()}>
          {loading ? '...' : 'Ask'}
        </button>
      </div>

      {!answer && !loading && !error && (
        <div style={{ marginTop: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Try:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {EXAMPLE_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => handleAsk(q)}
                style={{
                  padding: '4px 10px', borderRadius: 16, border: '1px solid var(--line)',
                  background: 'var(--surface)', color: 'var(--ink)', fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--weak-text)', color: '#fff', borderRadius: 8, fontSize: 13 }}>
          {error}
        </div>
      )}

      {answer && (
        <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--surface)', borderRadius: 8, fontSize: 14, lineHeight: 1.7, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
          {answer}
        </div>
      )}
    </div>
  );
}
