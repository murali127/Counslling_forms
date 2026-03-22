import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronRight } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.95 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};
const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

const PanelLayout = ({
  roleLabel    = 'Panel',
  roleColor    = '#818cf8',
  info         = {},
  stats        = [],
  sectionTitle = 'Quick Access',
  cards        = [],
  onLogout,
  loading,
  topContent,
  children,
}) => {
  if (loading) {
    return (
      <div style={wrapStyle}>
        <SceneBlobs roleColor={roleColor} />
        <aside style={sidebarStyle}>
          {[52, 70, 50].map((w, i) => (
            <div key={i} style={{ height: i === 0 ? 52 : 12, width: i === 0 ? 52 : `${w}%`, borderRadius: i === 0 ? '50%' : 6, background: 'rgba(255,255,255,0.08)', margin: i === 0 ? '28px auto 14px' : '0 24px 10px', animation: 'glassPulse 1.6s ease-in-out infinite' }} />
          ))}
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ margin: '6px 14px', height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'glassPulse 1.6s ease-in-out infinite' }} />
          ))}
        </aside>
        <main style={mainStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 88, borderRadius: 16, background: 'rgba(255,255,255,0.05)', animation: 'glassPulse 1.6s ease-in-out infinite' }} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ height: 128, borderRadius: 18, background: 'rgba(255,255,255,0.05)', animation: 'glassPulse 1.6s ease-in-out infinite' }} />)}
          </div>
        </main>
      </div>
    );
  }

  const initials = info.name
    ? info.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : roleLabel[0];

  return (
    <div style={wrapStyle}>
      {/* ── Background blobs — the magic behind glass ── */}
      <SceneBlobs roleColor={roleColor} />

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ x: -24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        style={sidebarStyle}
      >
        <div style={{ padding: '26px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Avatar */}
          <div style={{
            width: 50, height: 50, borderRadius: '50%', marginBottom: 14,
            background: info.profilePicture ? `url(${info.profilePicture}) center/cover no-repeat` : `linear-gradient(135deg, ${roleColor}cc, ${roleColor}55)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em',
            boxShadow: `0 0 0 3px rgba(255,255,255,0.08), 0 0 24px ${roleColor}44`,
            flexShrink: 0,
          }}>
            {!info.profilePicture && initials}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {info.name || '—'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 10 }}>
            {info.email || ''}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: `${roleColor}18`,
            border: `1px solid ${roleColor}33`,
            color: roleColor, borderRadius: 99,
            padding: '3px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: roleColor, boxShadow: `0 0 5px ${roleColor}` }} />
            {roleLabel}
          </span>
          {info.dept && (
            <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{info.dept}</div>
          )}
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {cards.map(({ icon: Icon, title, onClick, color = roleColor }) => (
            <button
              key={title}
              onClick={onClick}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'rgba(255,255,255,0.72)', transition: 'all 150ms ease', marginBottom: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = `${color}15`; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {Icon && <Icon size={14} strokeWidth={2} style={{ flexShrink: 0 }} />}
              <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
              <ChevronRight size={10} style={{ opacity: 0.25, flexShrink: 0 }} />
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={onLogout}
            style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.07)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(252,165,165,0.8)', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 150ms ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.07)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)'; }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main style={mainStyle}>
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length},1fr)`, gap: 14, marginBottom: 22 }}
          >
            {stats.map(({ label, value, color }) => (
              <div key={label} style={{
                background: 'rgba(148,163,184,0.10)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 16, padding: '16px 20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color || roleColor}, transparent)` }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.60)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: color && color !== '#fff' ? color : '#fff', letterSpacing: '-0.02em' }}>{value}</div>
              </div>
            ))}
          </motion.div>
        )}

        {topContent && topContent}

        {!children && sectionTitle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>{sectionTitle}</p>
            <div style={{ width: 32, height: 2, background: `linear-gradient(90deg, ${roleColor}, transparent)`, borderRadius: 99 }} />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {children ? (
            <motion.div key="section" className="glass-section" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {children}
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}
            >
              {cards.map(({ icon: Icon, title, desc, onClick, color = roleColor }) => (
                <motion.div
                  key={title}
                  variants={cardVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onClick}
                  style={{
                    background: 'rgba(148,163,184,0.10)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 18, padding: '22px 20px', cursor: 'pointer',
                    position: 'relative', overflow: 'hidden',
                    transition: 'box-shadow 220ms ease, background 220ms ease, border-color 220ms ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(148,163,184,0.18)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)';
                    e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(148,163,184,0.10)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Top shimmer line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(226,232,240,0.5), transparent)' }} />

                  <div style={{
                    width: 44, height: 44, borderRadius: 13, marginBottom: 16,
                    background: 'rgba(71,85,105,0.18)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}>
                    {Icon && <Icon size={18} color={color} strokeWidth={1.8} />}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginBottom: 6, lineHeight: 1.3 }}>{title}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65 }}>{desc}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

/* ── Background — Pearl Frost palette ── */
const SceneBlobs = () => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,15,26,1)' }} />
    {/* Blob Primary — slate-400, top-left */}
    <div style={{ position: 'absolute', top: '-20%', left: '-15%', width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(148,163,184,0.70) 0%, rgba(148,163,184,0.25) 45%, transparent 70%)', filter: 'blur(120px)' }} />
    {/* Blob Secondary — slate-600, bottom-right */}
    <div style={{ position: 'absolute', bottom: '-20%', right: '-15%', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(71,85,105,0.70) 0%, rgba(71,85,105,0.22) 45%, transparent 70%)', filter: 'blur(130px)' }} />
    {/* Blob Accent — pearl white, top-right */}
    <div style={{ position: 'absolute', top: '-5%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(226,232,240,0.70) 0%, rgba(226,232,240,0.18) 45%, transparent 70%)', filter: 'blur(110px)' }} />
  </div>
);

const wrapStyle = {
  display: 'flex',
  minHeight: 'calc(100vh - 64px)',
  position: 'relative',
};

const sidebarStyle = {
  width: 224,
  flexShrink: 0,
  background: 'rgba(148,163,184,0.06)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderRight: '1px solid rgba(255,255,255,0.18)',
  display: 'flex',
  flexDirection: 'column',
  position: 'sticky',
  top: 64,
  height: 'calc(100vh - 64px)',
  overflowY: 'auto',
  zIndex: 2,
};

const mainStyle = {
  flex: 1,
  padding: '26px 28px',
  overflowX: 'hidden',
  minWidth: 0,
  position: 'relative',
  zIndex: 2,
};

export default PanelLayout;
