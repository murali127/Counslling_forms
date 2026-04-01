import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LayoutDashboard, LogOut } from 'lucide-react';
import apiClient from '../apiClient';
import gvplog from '../images/gvplogo.jpg';

const Header = () => {
  const navigate        = useNavigate();
  const location        = useLocation();
  const isSignupPage    = location.pathname === '/signup';
  const isAuthenticated = localStorage.getItem('authToken');
  const [user, setUser] = useState({ name: '', email: '', profilePicture: '', profileCompletion: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await apiClient.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        let name = res.data.username || 'User';
        let picture = res.data.profilePicture || '';
        try {
          const p = await apiClient.get('/api/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (p.data.success && p.data.profile) {
            if (p.data.profile.name)           name    = p.data.profile.name;
            if (p.data.profile.profilePicture) picture = p.data.profile.profilePicture;
          }
        } catch (_) {}
        setUser({
          name,
          email:             res.data.email || '',
          profilePicture:    picture,
          profileCompletion: res.data.role === 'master' ? 100 : (res.data.profileCompletion || 0),
        });
      } catch (err) {
        console.error('Header fetch failed', err);
      }
    })();
  }, [isAuthenticated, location.pathname]);

  const handleLogoClick = () => {
    navigate('/landingpage');
  };

  const handleDashboardClick = () => {
    if (!isAuthenticated) { navigate('/dashboard'); return; }
    const role = localStorage.getItem('userRole') || localStorage.getItem('role');
    const map  = { superadmin: '/superadmin-panel', principal: '/principal-panel', master: '/master-panel', admin: '/admin-panel' };
    navigate(map[role] || '/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('role');
    setIsDropdownOpen(false);
    navigate('/landingpage');
    window.location.reload();
  };

  const completion   = Math.min(user.profileCompletion || 0, 100);
  const ringGradient = `conic-gradient(rgba(226,232,240,0.9) ${completion}%, rgba(255,255,255,0.12) ${completion}%)`;
  const initials     = user.name ? user.name.charAt(0).toUpperCase() : '?';

  return (
    <header style={headerStyle}>
      {/* Pearl Frost border bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.18)' }} />

      {/* Logo */}
      <div style={logoContainerStyle} onClick={handleLogoClick} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
      >
        <div style={logoWrapStyle}>
          <img src={gvplog} alt="GVPCE Logo" style={logoImgStyle} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>GVPCE</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}>Student Portal</span>
        </div>
      </div>

      {/* Center title */}
      <h1 style={titleStyle}>
        Gayatri Vidyaparishad College of Engineering
      </h1>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {isSignupPage ? (
          <div style={logoWrapStyle}>
            <img src={gvplog} alt="GVPCE" style={logoImgStyle} />
          </div>
        ) : !isAuthenticated ? (
          <button
            onClick={() => navigate('/signup')}
            style={signInBtnStyle}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(226,232,240,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)'; }}
          >
            Sign In
          </button>
        ) : (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Avatar ring button */}
            <button
              onClick={() => setIsDropdownOpen(o => !o)}
              style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title={`Profile ${completion}% complete`}
            >
              <div style={{ width: 42, height: 42, borderRadius: '50%', padding: '2.5px', background: ringGradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 35, height: 35, borderRadius: '50%', background: 'rgba(10,15,26,1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(148,163,184,0.25)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                      {initials}
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94, y: -8 }}
                  animate={{ opacity: 1, scale: 1,    y: 0 }}
                  exit={  { opacity: 0, scale: 0.94, y: -8 }}
                  transition={{ duration: 0.16, ease: [0.23, 1, 0.32, 1] }}
                  style={dropdownStyle}
                >
                  {/* Header */}
                  <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginBottom: 12 }}>{user.email}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>
                      <span>Profile completion</span>
                      <span style={{ fontWeight: 700, color: 'rgba(226,232,240,0.9)' }}>{completion}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completion}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                        style={{ height: '100%', background: 'linear-gradient(90deg, rgba(148,163,184,0.8), rgba(226,232,240,1))', borderRadius: 99 }}
                      />
                    </div>
                  </div>

                  {/* Nav items */}
                  {[
                    { label: 'My Profile', icon: User,            action: () => { navigate('/profile');    setIsDropdownOpen(false); } },
                    { label: 'Dashboard',  icon: LayoutDashboard, action: () => { handleDashboardClick();  setIsDropdownOpen(false); } },
                  ].map(({ label, icon: Icon, action }) => (
                    <button key={label} onClick={action} style={dropdownItemStyle}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Icon size={13} style={{ opacity: 0.6 }} /> {label}
                    </button>
                  ))}

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    style={{ ...dropdownItemStyle, color: '#fca5a5' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={13} style={{ opacity: 0.7 }} /> Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

/* ── Styles ── */
const headerStyle = {
  display:              'flex',
  alignItems:           'center',
  justifyContent:       'space-between',
  padding:              '0 24px',
  height:               '64px',
  background:           'rgba(10,15,26,0.92)',
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  borderBottom:         '1px solid rgba(255,255,255,0.18)',
  boxShadow:            '0 4px 24px rgba(0,0,0,0.3)',
  position:             'sticky',
  top:                  0,
  zIndex:               1000,
};

const logoContainerStyle = {
  display:    'flex',
  alignItems: 'center',
  gap:        10,
  cursor:     'pointer',
  flexShrink: 0,
  userSelect: 'none',
};

const logoWrapStyle = {
  width:        48,
  height:       48,
  borderRadius: '50%',
  padding:      2,
  background:   'rgba(148,163,184,0.18)',
  border:       '1px solid rgba(255,255,255,0.22)',
  boxShadow:    '0 0 16px rgba(226,232,240,0.15)',
  flexShrink:   0,
};

const logoImgStyle = {
  width:        '100%',
  height:       '100%',
  objectFit:    'cover',
  borderRadius: '50%',
  display:      'block',
};

const titleStyle = {
  flex:          1,
  textAlign:     'center',
  fontSize:      16,
  fontWeight:    700,
  color:         'rgba(255,255,255,0.88)',
  letterSpacing: '-0.01em',
  margin:        '0 24px',
  whiteSpace:    'nowrap',
  overflow:      'hidden',
  textOverflow:  'ellipsis',
};

const signInBtnStyle = {
  padding:       '8px 20px',
  borderRadius:  10,
  border:        '1px solid rgba(255,255,255,0.28)',
  background:    'rgba(148,163,184,0.12)',
  cursor:        'pointer',
  fontSize:      13,
  fontWeight:    700,
  color:         '#fff',
  transition:    'all 160ms ease',
  letterSpacing: '0.02em',
};

const dropdownStyle = {
  position:             'absolute',
  top:                  'calc(100% + 10px)',
  right:                0,
  background:           'rgba(10,15,26,0.97)',
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border:               '1px solid rgba(255,255,255,0.18)',
  borderRadius:         14,
  boxShadow:            '0 20px 40px rgba(0,0,0,0.5)',
  minWidth:             230,
  zIndex:               1001,
  overflow:             'hidden',
  transformOrigin:      'top right',
};

const dropdownItemStyle = {
  display:     'flex',
  alignItems:  'center',
  gap:         9,
  width:       '100%',
  padding:     '10px 18px',
  border:      'none',
  background:  'transparent',
  textAlign:   'left',
  cursor:      'pointer',
  fontSize:    13,
  color:       'rgba(255,255,255,0.75)',
  fontWeight:  500,
  transition:  'background 120ms ease',
};

export default Header;
