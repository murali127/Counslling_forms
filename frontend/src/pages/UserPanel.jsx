import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar, LinearProgress } from '@mui/material';
import apiClient from '../apiClient';

/* ─── Feature card data ──────────────────────────────────── */
const CARDS = [
  { icon: "📚", title: "My Profile",       desc: "View and update your personal information",          path: "/profile",          color: "#6366f1" },
  { icon: "✅", title: "Attendance",        desc: "Track your monthly attendance records",              path: "/attendance",        color: "#8b5cf6" },
  { icon: "📝", title: "Semester Marks",   desc: "View mid and external examination results",          path: "/semester",          color: "#06b6d4" },
  { icon: "⭐", title: "Mentor Grading",   desc: "See evaluations from your assigned mentor",          path: "/mentorgrade",       color: "#10b981" },
  { icon: "📄", title: "Counselling Forms",desc: "Download and view your counselling form data",       path: "/counseling-forms",  color: "#f59e0b" },
];

/* ─── Animation variants ─────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

/* ─── Component ─────────────────────────────────────────── */
const UserPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '', profilePicture: '', profileCompletion: 0, assignedMentor: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'user') { navigate('/signup'); return; }

    (async () => {
      try {
        const { data } = await apiClient.get('/api/auth/user', { headers: { Authorization: `Bearer ${token}` } });
        let name = data.username || 'Student';
        let pic  = '';
        try {
          const p = await apiClient.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } });
          if (p.data.success && p.data.profile) {
            if (p.data.profile.name)           name = p.data.profile.name;
            if (p.data.profile.profilePicture) pic  = p.data.profile.profilePicture;
          }
        } catch (_) {}
        setUser({ name, email: data.email || '', profilePicture: pic, profileCompletion: data.profileCompletion || 0, assignedMentor: data.assignedMentor });
      } catch (err) {
        if (err.response?.status === 401) navigate('/signup');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleLogout = async () => {
    try { await apiClient.post('/api/auth/logout'); } catch (_) {}
    localStorage.clear();
    sessionStorage.clear();
    navigate('/signup');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '14px' }} />
          ))}
        </div>
      </div>
    );
  }

  const completion = Math.min(user.profileCompletion || 0, 100);
  const initials   = user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'S';

  return (
    <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 64px)', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Welcome banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px 32px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', boxShadow: '0 1px 3px rgb(0 0 0/0.07)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Avatar
              src={user.profilePicture || undefined}
              sx={{ width: 64, height: 64, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 700, fontSize: '22px' }}
            >
              {!user.profilePicture && initials}
            </Avatar>
            <div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Hello, {user.name.split(' ')[0]} 👋
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>{user.email}</div>
              {user.assignedMentor && (
                <div style={{ fontSize: '12px', color: '#6366f1', fontWeight: 500, marginTop: '4px' }}>
                  Mentor: {user.assignedMentor.username}
                </div>
              )}
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ fontSize: '13px' }}>
            Sign out
          </button>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: [0.4, 0, 0.2, 1] }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}
        >
          {/* Profile completion */}
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Profile Completion</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#6366f1', letterSpacing: '-0.02em', marginBottom: '8px' }}>{completion}%</div>
            <LinearProgress variant="determinate" value={completion} sx={{ height: 5, borderRadius: '9999px', backgroundColor: '#eef2ff', '& .MuiLinearProgress-bar': { backgroundColor: '#6366f1' } }} />
          </div>
          {/* Status */}
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Account Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>Active</span>
            </div>
          </div>
          {/* Role */}
          <div style={statCardStyle}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Role</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eef2ff', color: '#6366f1', borderRadius: '9999px', padding: '4px 12px', fontSize: '13px', fontWeight: 600 }}>
              🎓 Student
            </div>
          </div>
        </motion.div>

        {/* ── Section heading ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
          style={{ marginBottom: '18px' }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>Quick Access</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>Navigate to any section of your portal</p>
        </motion.div>

        {/* ── Feature cards ── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}
        >
          {CARDS.map(({ icon, title, desc, path, color }) => (
            <motion.div
              key={path}
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: '0 12px 20px -4px rgb(0 0 0 / 0.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(path)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', cursor: 'pointer', transition: 'border-color 200ms ease' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = color}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '14px' }}>
                {icon}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>{title}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.55 }}>{desc}</div>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </div>
  );
};

const statCardStyle = {
  background:   '#fff',
  border:       '1px solid #e2e8f0',
  borderRadius: '12px',
  padding:      '18px 20px',
  boxShadow:    '0 1px 3px rgb(0 0 0/0.05)',
};

export default UserPanel;
