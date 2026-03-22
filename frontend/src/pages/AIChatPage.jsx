import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Bot, User, Trash2, Copy, Check, Zap, Globe, MapPin, Layers, StopCircle } from 'lucide-react';

const LIGHTRAG_BASE = '/api/ai';

const MODES = [
  { key: 'hybrid',  label: 'Hybrid',  icon: Layers,  color: '#818cf8', desc: 'Best overall — combines local + global' },
  { key: 'local',   label: 'Local',   icon: MapPin,   color: '#60a5fa', desc: 'Focused, entity-level answers' },
  { key: 'global',  label: 'Global',  icon: Globe,    color: '#a78bfa', desc: 'Broad, theme-level answers' },
  { key: 'naive',   label: 'Naive',   icon: Zap,      color: '#38bdf8', desc: 'Fast, direct retrieval' },
];

const QUICK_PROMPTS = [
  'What counselling forms are required?',
  'How is profile completion calculated?',
  'Explain the mentor grading system',
  'What are the attendance requirements?',
  'How do I update my academic details?',
];

/* ── Markdown-lite renderer ── */
const renderText = (text) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={j} style={{ color: '#e2e8f0', fontWeight: 700 }}>{part.slice(2, -2)}</strong>
        : part
    );
    return <span key={i}>{parts}{i < lines.length - 1 && <br />}</span>;
  });
};

const AIChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hello! I\'m your GVPCE AI assistant powered by LightRAG. I have deep knowledge of the student portal — ask me about profiles, forms, attendance, grading, or anything about the system.', ts: Date.now() }
  ]);
  const [input, setInput]         = useState('');
  const [mode, setMode]           = useState('hybrid');
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied]       = useState(null);
  const [error, setError]         = useState('');
  const messagesEndRef             = useRef(null);
  const inputRef                   = useRef(null);
  const abortRef                   = useRef(null);
  const role = localStorage.getItem('userRole') || localStorage.getItem('role') || 'user';
  const homeMap = { user: '/user-panel', admin: '/admin-panel', superadmin: '/superadmin-panel', principal: '/principal-panel', master: '/master-panel' };

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, streaming]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const stopStream = () => { abortRef.current?.abort(); };

  const sendMessage = useCallback(async (text) => {
    const q = (text || input).trim();
    if (!q || streaming) return;

    const userMsg = { id: Date.now(), role: 'user', content: q, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setError('');
    setStreaming(true);

    const assistantId = Date.now() + 1;
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', ts: Date.now(), loading: true }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${LIGHTRAG_BASE}/query/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ query: q, mode, stream: true }),
      });

      if (!res.ok) {
        throw new Error(`LightRAG responded with ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              const token = parsed.response ?? parsed.text ?? parsed.content ?? parsed.delta ?? '';
              accumulated += token;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulated, loading: false } : m
              ));
            } catch {
              // plain text chunk
              accumulated += data;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulated, loading: false } : m
              ));
            }
          }
        }
      }

      // If nothing came through streaming, fall back to non-stream
      if (!accumulated) {
        const fallback = await fetch(`${LIGHTRAG_BASE}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, mode, stream: false }),
        });
        const json = await fallback.json();
        accumulated = json.response ?? json.result ?? json.answer ?? 'No response received.';
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: accumulated, loading: false } : m
        ));
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content || '*(stopped)*', loading: false } : m
        ));
      } else {
        setError(err.message || 'Could not reach the LightRAG server.');
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: `⚠️ Error: ${err.message || 'Connection failed. Make sure LightRAG is running.'}`, loading: false }
            : m
        ));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, mode, streaming]);

  const copyMessage = (content, id) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearChat = () => {
    setMessages([{ id: Date.now(), role: 'assistant', content: 'Chat cleared. How can I help you?', ts: Date.now() }]);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectedMode = MODES.find(m => m.key === mode);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', background: 'rgba(10,15,26,1)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,26,1)' }} />
        <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(148,163,184,0.55) 0%, rgba(148,163,184,0.18) 45%, transparent 70%)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(71,85,105,0.55) 0%, rgba(71,85,105,0.18) 45%, transparent 70%)', filter: 'blur(130px)' }} />
        <div style={{ position: 'absolute', top: '-5%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(129,140,248,0.30) 0%, transparent 70%)', filter: 'blur(110px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, width: '100%', margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => navigate(homeMap[role] || '/dashboard')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(148,163,184,0.10)', backdropFilter: 'blur(16px)', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.80)', transition: 'all 140ms ease' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.18)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, #4338ca, #818cf8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(129,140,248,0.35)' }}>
                <Bot size={20} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>GVPCE AI Assistant</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block' }} />
                  Powered by LightRAG · {selectedMode?.label} mode
                </div>
              </div>
            </div>
          </div>

          <button onClick={clearChat}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: '1px solid rgba(248,113,113,0.22)', background: 'rgba(248,113,113,0.08)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(252,165,165,0.85)', transition: 'all 140ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.16)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
          >
            <Trash2 size={13} /> Clear
          </button>
        </motion.div>

        {/* ── Mode selector ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }}
          style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
        >
          {MODES.map(({ key, label, icon: Icon, color, desc }) => {
            const active = mode === key;
            return (
              <button key={key} onClick={() => setMode(key)} title={desc}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.12)'}`, background: active ? `${color}18` : 'rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500, color: active ? color : 'rgba(255,255,255,0.60)', transition: 'all 140ms ease', boxShadow: active ? `0 0 16px ${color}22` : 'none' }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; } }}
              >
                <Icon size={12} /> {label}
              </button>
            );
          })}
        </motion.div>

        {/* ── Messages ── */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4, marginBottom: 14, scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.25) transparent' }}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div key={msg.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 }}
              >
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? 'linear-gradient(135deg, #6d28d9, #818cf8)' : 'linear-gradient(135deg, #0e7490, #38bdf8)', boxShadow: msg.role === 'user' ? '0 0 12px rgba(129,140,248,0.35)' : '0 0 12px rgba(56,189,248,0.30)' }}>
                  {msg.role === 'user' ? <User size={15} color="#fff" /> : <Bot size={15} color="#fff" />}
                </div>

                {/* Bubble */}
                <div style={{ maxWidth: '76%', position: 'relative' }}>
                  <div style={{
                    padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, rgba(67,56,202,0.55), rgba(109,40,217,0.45))' : 'rgba(148,163,184,0.11)',
                    backdropFilter: 'blur(20px)',
                    border: msg.role === 'user' ? '1px solid rgba(129,140,248,0.30)' : '1px solid rgba(255,255,255,0.14)',
                    fontSize: 13.5, lineHeight: 1.7, color: msg.loading ? 'rgba(255,255,255,0.50)' : 'rgba(255,255,255,0.92)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.20)',
                  }}>
                    {msg.loading
                      ? <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                          <span>Thinking</span>
                          {[0, 1, 2].map(i => (
                            <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                              style={{ width: 4, height: 4, borderRadius: '50%', background: '#818cf8', display: 'inline-block' }}
                            />
                          ))}
                        </span>
                      : renderText(msg.content)
                    }
                  </div>

                  {/* Copy button */}
                  {!msg.loading && msg.content && (
                    <button onClick={() => copyMessage(msg.content, msg.id)}
                      style={{ position: 'absolute', top: 6, right: msg.role === 'user' ? 'auto' : 6, left: msg.role === 'user' ? 6 : 'auto', padding: '3px 6px', borderRadius: 6, border: 'none', background: 'rgba(71,85,105,0.35)', cursor: 'pointer', opacity: 0, transition: 'opacity 120ms', fontSize: 10, color: 'rgba(255,255,255,0.65)' }}
                      className="copy-btn"
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                      {copied === msg.id ? <Check size={11} color="#4ade80" /> : <Copy size={11} />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick prompts ── */}
        {messages.length <= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}
          >
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => sendMessage(p)} disabled={streaming}
                style={{ padding: '7px 13px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(148,163,184,0.08)', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.75)', transition: 'all 130ms ease', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(129,140,248,0.15)'; e.currentTarget.style.borderColor = 'rgba(129,140,248,0.35)'; e.currentTarget.style.color = '#a5b4fc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
              >
                {p}
              </button>
            ))}
          </motion.div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ marginBottom: 10, padding: '8px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', fontSize: 12, color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {/* ── Input ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
          style={{ background: 'rgba(148,163,184,0.10)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 16, padding: '10px 10px 10px 16px', display: 'flex', alignItems: 'flex-end', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the GVPCE portal…"
            rows={1}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: '#ffffff', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto', fontFamily: 'Inter, sans-serif', paddingTop: 4 }}
          />
          {streaming ? (
            <button onClick={stopStream}
              style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 140ms ease' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.20)'}
            >
              <StopCircle size={17} color="#fca5a5" />
            </button>
          ) : (
            <button onClick={() => sendMessage()} disabled={!input.trim()}
              style={{ width: 40, height: 40, borderRadius: 11, background: input.trim() ? 'linear-gradient(135deg, #4338ca, #818cf8)' : 'rgba(71,85,105,0.25)', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 140ms ease', boxShadow: input.trim() ? '0 4px 16px rgba(129,140,248,0.35)' : 'none' }}
              onMouseEnter={e => { if (input.trim()) e.currentTarget.style.boxShadow = '0 6px 22px rgba(129,140,248,0.50)'; }}
              onMouseLeave={e => { if (input.trim()) e.currentTarget.style.boxShadow = '0 4px 16px rgba(129,140,248,0.35)'; }}
            >
              <Send size={16} color={input.trim() ? '#fff' : 'rgba(255,255,255,0.30)'} />
            </button>
          )}
        </motion.div>
        <div style={{ textAlign: 'center', fontSize: 10.5, color: 'rgba(255,255,255,0.28)', marginTop: 8 }}>
          Press Enter to send · Shift+Enter for new line · Mode: <span style={{ color: selectedMode?.color }}>{selectedMode?.label}</span>
        </div>

      </div>
    </div>
  );
};

export default AIChatPage;
