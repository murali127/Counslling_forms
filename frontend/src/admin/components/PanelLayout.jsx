import React from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@mui/material';

/**
 * PanelLayout — sidebar shell for HOD, Faculty, Principal & Master panels.
 *
 * Props:
 *   roleLabel    string   Display label, e.g. "HOD Panel"
 *   roleColor    string   Accent color
 *   homeRoute    string   Route of the panel home (for active-state detection)
 *   info         { name, email, dept? }
 *   stats        Array<{ label, value, color? }>
 *   sectionTitle string
 *   cards        Array<{ icon, title, desc, onClick, color? }>
 *   onLogout     function
 *   loading      boolean
 *   children     ReactNode — slot for role-specific modals / extras
 */

const cardVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.24, ease: [0.4, 0, 0.2, 1] } },
};

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.055 } },
};

const PanelLayout = ({
  roleLabel   = 'Panel',
  roleColor   = '#6366f1',
  homeRoute   = '',
  info        = {},
  stats       = [],
  sectionTitle = 'Quick Access',
  cards       = [],
  onLogout,
  loading,
  children,
}) => {

  /* ── skeleton ── */
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: '#f8fafc' }}>
        <aside style={sidebarBase}>
          <div style={{ padding: '20px' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', marginBottom: 10 }} className="skeleton" />
            <div style={{ height: 12, borderRadius: 6, marginBottom: 8, width: '75%' }} className="skeleton" />
            <div style={{ height: 10, borderRadius: 6, width: '55%' }} className="skeleton" />
          </div>
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} style={{ margin: '6px 12px', height: 36, borderRadius: 8 }} className="skeleton" />
          ))}
        </aside>
        <main style={mainBase}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[1,2,3].map(i => <div key={i} style={{ height: 70, borderRadius: 10 }} className="skeleton" />)}
          </div>
          <div style={{ height: 16, width: '20%', borderRadius: 6, marginBottom: 14 }} className="skeleton" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ height: 104, borderRadius: 12 }} className="skeleton" />)}
          </div>
        </main>
      </div>
    );
  }

  const initials = info.name
    ? info.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : roleLabel[0];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)', background: '#f8fafc' }}>

      {/* ── Sidebar ── */}
      <aside style={sidebarBase}>
        {/* User info block */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <Avatar sx={{
            width: 44, height: 44, mb: '10px',
            background: `${roleColor}20`, color: roleColor,
            fontWeight: 700, fontSize: '16px',
            border: `2px solid ${roleColor}35`,
          }}>
            {initials}
          </Avatar>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {info.name || '—'}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 8 }}>
            {info.email || ''}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            background: `${roleColor}15`, color: roleColor,
            borderRadius: 9999, padding: '3px 10px',
            fontSize: '11px', fontWeight: 600,
          }}>
            {roleLabel}
          </span>
          {info.dept && (
            <div style={{ marginTop: 6, fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
              {info.dept}
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {cards.map(({ icon, title, onClick, color = roleColor }) => (
            <button
              key={title}
              onClick={onClick}
              style={navItem(color)}
              onMouseEnter={e => {
                e.currentTarget.style.background = `${color}10`;
                e.currentTarget.style.color = color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#475569';
              }}
            >
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: '12.5px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </span>
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #f1f5f9' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
              background: 'transparent', cursor: 'pointer', fontSize: '12.5px', fontWeight: 500,
              color: '#ef4444', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 120ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fff1f0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span>↪</span> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={mainBase}>

        {/* Stats row */}
        {stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.05 }}
            style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 12, marginBottom: 18 }}
          >
            {stats.map(({ label, value, color }) => (
              <div key={label} style={{
                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '12px 16px', boxShadow: '0 1px 2px rgb(0 0 0/0.04)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                  {label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: color || '#0f172a', letterSpacing: '-0.02em' }}>
                  {value}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          style={{ marginBottom: 14 }}
        >
          <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {sectionTitle}
          </h2>
        </motion.div>

        {/* If a section is active, render it; otherwise show the cards grid */}
        {children ? (
          <motion.div
            key="section-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}
          >
            {cards.map(({ icon, title, desc, onClick, color = roleColor }) => (
              <motion.div
                key={title}
                variants={cardVariants}
                whileHover={{ y: -4, boxShadow: '0 8px 18px -4px rgb(0 0 0/0.10)' }}
                whileTap={{ scale: 0.97 }}
                onClick={onClick}
                style={{
                  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                  padding: '16px', cursor: 'pointer', transition: 'border-color 150ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = color}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '17px', marginBottom: 10,
                }}>
                  {icon}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: 4, lineHeight: 1.3 }}>
                  {title}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.5 }}>
                  {desc}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
};

/* ── Style constants ── */
const sidebarBase = {
  width:          '220px',
  flexShrink:     0,
  background:     '#fff',
  borderRight:    '1px solid #e2e8f0',
  display:        'flex',
  flexDirection:  'column',
  position:       'sticky',
  top:            '64px',
  height:         'calc(100vh - 64px)',
  overflowY:      'auto',
};

const mainBase = {
  flex:       1,
  padding:    '20px 22px',
  overflowX:  'hidden',
  minWidth:   0,
};

const navItem = (color) => ({
  display:        'flex',
  alignItems:     'center',
  gap:            10,
  width:          '100%',
  padding:        '8px 10px',
  borderRadius:   8,
  border:         'none',
  background:     'transparent',
  cursor:         'pointer',
  textAlign:      'left',
  color:          '#475569',
  transition:     'background 120ms, color 120ms',
  marginBottom:   2,
});

export default PanelLayout;
