import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../apiClient';
import gvplog from '../images/gvplogo.jpg';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignupPage = location.pathname === '/signup';
  const isAuthenticated = localStorage.getItem('authToken');
  const [user, setUser] = useState({ name: '', email: '', profilePicture: '', profileCompletion: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Fetch user details
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUser = async () => {
      try {
        const res = await apiClient.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        });
        setUser({
          name: res.data.username || 'User',
          email: res.data.email || '',
          profilePicture: res.data.profilePicture || '',
          profileCompletion: res.data.role === 'master' ? 100 : (res.data.profileCompletion || 0),
        });
      } catch (err) {
        console.error('Header: failed to fetch user', err);
      }
    };
    fetchUser();
  }, [isAuthenticated]);

  const handleLogoClick = () => {
    if (!isAuthenticated) { navigate('/landingpage'); return; }
    const role = localStorage.getItem('userRole') || localStorage.getItem('role');
    const map = {
      superadmin: '/superadmin-panel',
      principal:  '/principal-panel',
      master:     '/master-panel',
      admin:      '/admin-panel',
    };
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

  const completion = Math.min(user.profileCompletion || 0, 100);
  // Conic gradient for profile ring: primary color fills based on %
  const ringGradient = `conic-gradient(#6366f1 ${completion}%, #e2e8f0 ${completion}%)`;

  return (
    <header style={headerStyle}>
      {/* Logo + Name */}
      <div style={logoContainerStyle} onClick={handleLogoClick} role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleLogoClick()}
      >
        <img src={gvplog} alt="GVP Logo" style={logoImgStyle} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
            GVPCE
          </span>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>
            Student Portal
          </span>
        </div>
      </div>

      {/* Title — hidden on small screens via inline media workaround */}
      <h1 style={titleStyle}>
        Gayatri Vidyaparishad College of Engineering
      </h1>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Auth section */}
        {isSignupPage ? (
          <img src={gvplog} alt="GVP Logo" style={logoImgStyle} />
        ) : !isAuthenticated ? (
          <button className="btn btn-primary" onClick={() => navigate('/signup')} style={{ fontSize: '13px', padding: '8px 16px' }}>
            Sign In
          </button>
        ) : (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Avatar with completion ring */}
            <button
              onClick={() => setIsDropdownOpen((o) => !o)}
              style={avatarBtnStyle}
              title={`Profile ${completion}% complete`}
            >
              <div style={{ ...ringWrapStyle, background: ringGradient }}>
                <div style={ringInnerStyle}>
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  ) : (
                    <div style={avatarFallbackStyle}>
                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                  style={dropdownStyle}
                >
                  {/* User info */}
                  <div style={dropdownHeaderStyle}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', marginBottom: '2px' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                      {user.email}
                    </div>
                    {/* Completion bar */}
                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Profile completion</span>
                      <span style={{ fontWeight: 600, color: '#6366f1' }}>{completion}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completion}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                        style={{ height: '100%', background: '#6366f1', borderRadius: '9999px' }}
                      />
                    </div>
                  </div>

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                  {[
                    { label: 'My Profile',  action: () => { navigate('/profile'); setIsDropdownOpen(false); } },
                    { label: 'Dashboard',   action: () => { handleLogoClick(); setIsDropdownOpen(false); } },
                  ].map(({ label, action }) => (
                    <button key={label} onClick={action} style={dropdownItemStyle}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {label}
                    </button>
                  ))}

                  <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />

                  <button
                    onClick={handleLogout}
                    style={{ ...dropdownItemStyle, color: '#ef4444' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    Sign out
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

/* ---- Styles ---- */
const headerStyle = {
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'space-between',
  padding:         '0 24px',
  height:          '64px',
  backgroundColor: '#ffffff',
  borderBottom:    '1px solid #e2e8f0',
  boxShadow:       '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  position:        'sticky',
  top:             0,
  zIndex:          1000,
};

const logoContainerStyle = {
  display:    'flex',
  alignItems: 'center',
  gap:        '10px',
  cursor:     'pointer',
  flexShrink: 0,
  userSelect: 'none',
};

const logoImgStyle = {
  width:        '48px',
  height:       '48px',
  objectFit:    'cover',
  borderRadius: '50%',
  border:       '2px solid #e2e8f0',
  boxShadow:    '0 2px 6px rgb(0 0 0 / 0.12)',
};

const titleStyle = {
  flex:         1,
  textAlign:    'center',
  fontSize:     '14px',
  fontWeight:   600,
  color:        '#475569',
  letterSpacing:'-0.01em',
  margin:       '0 24px',
  whiteSpace:   'nowrap',
  overflow:     'hidden',
  textOverflow: 'ellipsis',
};

const avatarBtnStyle = {
  background: 'none',
  border:     'none',
  padding:    '2px',
  cursor:     'pointer',
  borderRadius:'50%',
  display:    'flex',
  alignItems: 'center',
  justifyContent:'center',
};

const ringWrapStyle = {
  width:        '40px',
  height:       '40px',
  borderRadius: '50%',
  padding:      '2px',
  display:      'flex',
  alignItems:   'center',
  justifyContent:'center',
};

const ringInnerStyle = {
  width:           '34px',
  height:          '34px',
  borderRadius:    '50%',
  backgroundColor: '#ffffff',
  overflow:        'hidden',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
};

const avatarFallbackStyle = {
  width:           '100%',
  height:          '100%',
  borderRadius:    '50%',
  background:      'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color:           '#fff',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  fontWeight:      700,
  fontSize:        '14px',
};

const dropdownStyle = {
  position:        'absolute',
  top:             'calc(100% + 10px)',
  right:           0,
  backgroundColor: '#ffffff',
  border:          '1px solid #e2e8f0',
  borderRadius:    '12px',
  boxShadow:       '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
  minWidth:        '220px',
  zIndex:          1001,
  overflow:        'hidden',
  transformOrigin: 'top right',
};

const dropdownHeaderStyle = {
  padding: '14px 16px 10px',
};

const dropdownItemStyle = {
  display:    'block',
  width:      '100%',
  padding:    '9px 16px',
  border:     'none',
  background: 'transparent',
  textAlign:  'left',
  cursor:     'pointer',
  fontSize:   '14px',
  color:      '#0f172a',
  fontFamily: "'Inter', sans-serif",
  fontWeight: 400,
  transition: 'background 100ms ease',
};

export default Header;
