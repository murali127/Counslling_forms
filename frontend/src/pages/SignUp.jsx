import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserGraduate } from 'react-icons/fa';
import apiClient from '../apiClient';
import gvplog from '../images/gvplogo.jpg';

/* ── Demo accounts for presentation — update credentials here ── */
const DEMO_ACCOUNTS = [
  { role: 'Student',   email: '322103311040@gvpce.ac.in', password: '04e64929a342e02d', color: '#7c3aed' },
  { role: 'Faculty',   email: 'muralijay320@gmail.com',   password: 'yxVC9@EPnBpfj9g', color: '#047857' },
  { role: 'HOD',       email: 'muralijay340@gmail.com',   password: 'ac0b84b7d03b4c57', color: '#e11d48' },
  { role: 'Principal', email: 'majjiteja000@gmail.com',   password: 'principal123',     color: '#0e7490' },
  { role: 'Master',    email: 'master@gmail.com',         password: 'master@123',       color: '#b45309' },
];

const Auth = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);

  const images = [
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/18.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/19.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/20.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/21.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/22.jpg",
    "https://www.gvpce.ac.in/slideshow/home/Homepageslideshowphotos/2.College&Departments/23.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentImage((i) => (i + 1) % images.length), 4000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    formRef.current?.querySelectorAll('input')[0]?.focus();
  }, [isSignUp]);

  const autoLogin = async (email, password) => {
    try {
      setLoading(true);
      setError('');
      const { data } = await apiClient.post('/api/auth/signin', { email, password });
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.username);
      const map = { user: '/user-panel', mentor: '/user-panel', admin: '/admin-panel', superadmin: '/superadmin-panel', principal: '/principal-panel', master: '/master-panel' };
      navigate(map[data.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const inputs = formRef.current.querySelectorAll('input');
    const idx = Array.from(inputs).indexOf(document.activeElement);
    if (e.key === 'ArrowDown') inputs[(idx + 1) % inputs.length]?.focus();
    else inputs[(idx - 1 + inputs.length) % inputs.length]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (isSignUp && !/^\d+@gvpce\.ac\.in$/i.test(formData.email)) {
      setError('Please use your college email (e.g. 322103311030@gvpce.ac.in)');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const body = isSignUp
        ? { username: formData.fullName, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };
      const { data } = await apiClient.post(`/api/auth/${isSignUp ? 'signup' : 'signin'}`, body);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userName', data.username);
      const map = { user:'/user-panel', mentor:'/user-panel', admin:'/admin-panel', superadmin:'/superadmin-panel', principal:'/principal-panel', master:'/master-panel' };
      navigate(map[data.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Server error, please try again later');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Left — Image Panel */}
      <div style={imagePanelStyle}>
        {/* Image slideshow */}
        {images.map((src, i) => (
          <div
            key={i}
            style={{
              ...imageBgStyle,
              opacity: i === currentImage ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          >
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
        {/* Overlay content */}
        <div style={imageOverlayStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <img src={gvplog} alt="GVP Logo" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.6)', objectFit: 'cover' }} />
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>GVP-IT</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Student Portal</div>
            </div>
          </div>
          <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: '12px' }}>
            Shape your academic journey
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: 1.7, maxWidth: '320px' }}>
            Access your counselling forms, track attendance, view marks and connect with your mentor — all in one place.
          </p>
          {/* Dots */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '32px' }}>
            {images.map((_, i) => (
              <div key={i} style={{ width: i === currentImage ? '20px' : '6px', height: '6px', borderRadius: '3px', background: i === currentImage ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s ease' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div style={formPanelStyle}>
        <div style={formInnerStyle}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <FaUserGraduate size={20} color="#6d28d9" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#6d28d9' }}>LoginPortal</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup-header' : 'signin-header'}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                  {isSignUp ? 'Create account' : 'Welcome back'}
                </h1>
                <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {isSignUp ? 'Register with your college email to get started.' : 'Sign in to access your student dashboard.'}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#dc2626' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo accounts — only on sign-in */}
          {!isSignUp && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>
                  Note: Students can sign in only when the login window is open.
                </p>
              </div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Demo Accounts
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {DEMO_ACCOUNTS.map(({ role, email, password, color }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setActiveDemo(role);
                      autoLogin(email, password);
                    }}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      border: `1px solid ${activeDemo === role ? color : '#e2e8f0'}`,
                      background: activeDemo === role ? `${color}18` : '#f8fafc',
                      color: activeDemo === role ? color : '#475569',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 140ms ease',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => {
                      if (activeDemo !== role) {
                        e.currentTarget.style.borderColor = color;
                        e.currentTarget.style.color = color;
                        e.currentTarget.style.background = `${color}10`;
                      }
                    }}
                    onMouseLeave={e => {
                      if (activeDemo !== role) {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.color = '#475569';
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {activeDemo && (
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                  Credentials loaded for <span style={{ fontWeight: 600, color: DEMO_ACCOUNTS.find(d => d.role === activeDemo)?.color }}>{activeDemo}</span> — click Sign in
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={isSignUp ? 'signup-form' : 'signin-form'}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              onSubmit={handleSubmit}
              ref={formRef}
              onKeyDown={handleKeyDown}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {isSignUp && (
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="input-base"
                    required
                  />
                </div>
              )}
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={isSignUp ? "322103311030@gvpce.ac.in" : "your@email.com"}
                  className="input-base"
                  required
                />
                {isSignUp && (
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    Use your college email: rollno@gvpce.ac.in
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="input-base"
                  required
                />
              </div>
              {isSignUp && (
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="input-base"
                    required
                  />
                </div>
              )}
              {!isSignUp && (
                <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                  <Link to="/forgot-password" style={{ fontSize: '13px', color: '#6d28d9', textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '14px', marginTop: '4px' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (isSignUp ? 'Create account' : 'Sign in')}
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Toggle */}
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#475569' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp((v) => !v); setError(''); setActiveDemo(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6d28d9', fontWeight: 600, fontSize: '14px', padding: 0, fontFamily: 'inherit' }}
            >
              {isSignUp ? 'Sign in' : 'Create one'}
            </button>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

/* Styles */
const containerStyle = {
  display:        'flex',
  height:         'calc(100vh - 64px)',
  overflow:       'hidden',
  background:     '#f8fafc',
};

const imagePanelStyle = {
  flex:           '0 0 42%',
  position:       'relative',
  overflow:       'hidden',
  background:     '#0f172a',
};

const imageBgStyle = {
  position:   'absolute',
  inset:       0,
  zIndex:      0,
};

const imageOverlayStyle = {
  position:       'absolute',
  inset:          0,
  zIndex:         2,
  background:     'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.4) 60%, rgba(15,23,42,0.25) 100%)',
  display:        'flex',
  flexDirection:  'column',
  justifyContent: 'flex-end',
  padding:        '40px',
};

const formPanelStyle = {
  flex:             1,
  display:          'flex',
  alignItems:       'center',
  justifyContent:   'center',
  overflowY:        'auto',
  padding:          '40px 24px',
};

const formInnerStyle = {
  width:    '100%',
  maxWidth: '400px',
};

const labelStyle = {
  display:      'block',
  fontSize:     '13px',
  fontWeight:   500,
  color:        '#475569',
  marginBottom: '6px',
};

export default Auth;
