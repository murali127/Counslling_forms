import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <div style={leftStyle}>
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.80)' }}>GVP-IT</span>
          <span style={{ color: '#94a3b8', margin: '0 6px' }}>·</span>
          <span>Gayatri Vidyaparishad College of Engineering (Autonomous)</span>
        </div>
        <div style={rightStyle}>
          <span>© {year} All rights reserved</span>
          <span style={{ color: '#e2e8f0', margin: '0 8px' }}>|</span>
          <a
            href="https://gvpce.ac.in"
            target="_blank"
            rel="noreferrer"
            style={linkStyle}
            onMouseEnter={(e) => e.target.style.color = '#6366f1'}
            onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
          >
            Website
          </a>
        </div>
      </div>
    </footer>
  );
};

const footerStyle = {
  backgroundColor: 'rgba(10,15,26,0.90)',
  borderTop:       '1px solid rgba(255,255,255,0.08)',
  padding:         '16px 24px',
  marginTop:       'auto',
  backdropFilter:  'blur(12px)',
};

const containerStyle = {
  maxWidth:        '1280px',
  margin:          '0 auto',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'space-between',
  flexWrap:        'wrap',
  gap:             '8px',
};

const leftStyle = {
  fontSize: '13px',
  color:    'rgba(255,255,255,0.50)',
};

const rightStyle = {
  fontSize:   '13px',
  color:      'rgba(255,255,255,0.45)',
  display:    'flex',
  alignItems: 'center',
};

const linkStyle = {
  color:          '#94a3b8',
  textDecoration: 'none',
  fontSize:       '13px',
  transition:     'color 150ms ease',
};

export default Footer;
