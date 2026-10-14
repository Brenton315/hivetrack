import { useState, useRef, useEffect } from 'react';
import { parseNotes } from '../../lib/ai';
import type { ParsedEvent } from '../../lib/ai';
import type { Hive } from '../../lib/database.types';
import AIConfirmDialog from './AIConfirmDialog';

interface Props {
  siteId: string;
  hives: Hive[];
  onClose: () => void;
  onSaved: () => void;
}

interface SpeechRecognitionEvent {
  results: { [key: number]: { [key: number]: { transcript: string } } };
  resultIndex: number;
}

export default function BulkInspectionForm({ siteId, hives, onClose, onSaved }: Props) {
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [parsedEvents, setParsedEvents] = useState<ParsedEvent[] | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<unknown>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hiveMap = new Map<string, string>();
  for (const h of hives) {
    hiveMap.set(h.name.toLowerCase(), h.id);
  }

  const hasSpeech = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const toggleVoice = () => {
    if (listening) {
      stopListening();
      return;
    }

    try {
      const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition
        || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
      if (!SpeechRecognition) return;

      const recognition = new (SpeechRecognition as new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (event: SpeechRecognitionEvent) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
        stop: () => void;
      })();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-NZ';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = 0; i < Object.keys(event.results).length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setText(prev => {
          const base = prev.endsWith('\n') || prev === '' ? prev : prev + ' ';
          return base + transcript;
        });
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      setError('Voice input not available in this browser');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
    }
    setListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        (recognitionRef.current as { stop: () => void }).stop();
      }
    };
  }, []);

  const handleParse = async () => {
    if (!text.trim()) { setError('Enter some notes to parse'); return; }
    setParsing(true);
    setError('');
    stopListening();

    try {
      const result = await parseNotes([text.trim()]);
      if (result.events.length === 0) {
        setError('Could not parse any events from the text. Try being more specific.');
        setParsing(false);
        return;
      }
      setParsedEvents(result.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse notes');
    }
    setParsing(false);
  };

  if (parsedEvents) {
    return (
      <AIConfirmDialog
        events={parsedEvents}
        siteId={siteId}
        hiveMap={hiveMap}
        onClose={() => setParsedEvents(null)}
        onSaved={onSaved}
      />
    );
  }

  return (
    <div className="hq-overlay">
      <div className="hq-modal" style={{ maxWidth: 520 }}>
        <div className="hq-modal-head">
          <h2>Bulk Inspection</h2>
          <button type="button" onClick={onClose} className="hq-modal-close">&times;</button>
        </div>

        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 12 }}>
          Describe your inspections in natural language. AI will parse them into structured events for you to confirm.
        </p>

        <div className="hq-field">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Hives at site:</span>
            {hives.filter(h => h.status === 'active').slice(0, 20).map(h => (
              <span key={h.id} style={{ fontSize: 12, padding: '1px 6px', borderRadius: 4, background: 'var(--hover)', color: 'var(--text)' }}>
                {h.name}
              </span>
            ))}
            {hives.filter(h => h.status === 'active').length > 20 && (
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>+{hives.filter(h => h.status === 'active').length - 20} more</span>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            className="hq-input"
            rows={6}
            placeholder={`e.g. "Checked V1 through V12 today. All looking strong, 8-10 frames of bees. V3 and V7 got Apivar treatments. Fed V5 and V6 sugar syrup 2L each. V9 queen not seen, only 4 frames - needs attention."`}
            style={{ fontSize: 14 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {hasSpeech && (
            <button
              type="button"
              onClick={toggleVoice}
              className={listening ? 'hq-btn-danger' : 'hq-btn-secondary'}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              {listening ? 'Stop recording' : 'Voice input'}
            </button>
          )}
          {listening && (
            <span className="hq-recording-indicator">
              <span className="hq-recording-dot" />
              Listening...
            </span>
          )}
        </div>

        {error && <p className="hq-error" style={{ marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onClose} className="hq-btn-secondary" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleParse}
            disabled={parsing || !text.trim()}
            className="hq-btn-primary"
            style={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {parsing ? (
              <>
                <span className="hq-spinner" />
                Parsing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M9 18h6" />
                  <path d="M12 18v4" />
                </svg>
                Parse with AI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
