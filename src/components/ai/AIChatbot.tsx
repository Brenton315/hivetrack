import { useState, useRef, useEffect } from 'react';
import { useOverviewData } from '../../lib/hooks';
import { askQuestion } from '../../lib/ai';
import type { DataSummary } from '../../lib/ai';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Which sites are overdue?',
  'How are my hives doing?',
  'What are my costs this season?',
];

export default function AIChatbot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const overview = useOverviewData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      recent_events: [],
    };
  }

  async function handleSend(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput('');

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: q };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await askQuestion(q, buildSummary());
      const aiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      const errMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="hq-chatbot-backdrop" onClick={onClose} />
      <aside className="hq-chatbot">
        <div className="hq-chatbot-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7l-3 4-3-4c-2-1.5-4-4-4-7a7 7 0 0 1 7-7z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Ask AI</span>
          </div>
          <button className="hq-chatbot-close" onClick={onClose} aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="hq-chatbot-messages">
          {messages.length === 0 && !loading && (
            <div className="hq-chatbot-empty">
              <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>
                Ask me anything about your hive data.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    className="hq-chatbot-suggestion"
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`hq-chatbot-msg hq-chatbot-msg-${msg.role}`}>
              <div className="hq-chatbot-bubble">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="hq-chatbot-msg hq-chatbot-msg-assistant">
              <div className="hq-chatbot-bubble hq-chatbot-typing">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="hq-chatbot-input-row">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Ask about your hives..."
            className="hq-chatbot-input"
            maxLength={500}
            disabled={loading}
          />
          <button
            className="hq-chatbot-send"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
}
