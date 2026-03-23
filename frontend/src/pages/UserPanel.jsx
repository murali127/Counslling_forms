import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, CalendarCheck, BookOpen, Star, FileText, Sparkles } from 'lucide-react';
import apiClient from '../apiClient';
import PanelLayout from '../admin/components/PanelLayout';

const CARDS = [
  { icon: User,         title: 'My Profile',       desc: 'View and update your personal information',       path: '/profile',         color: '#818cf8' },
  { icon: CalendarCheck,title: 'Attendance',        desc: 'Track your monthly attendance records',           path: '/attendance',       color: '#60a5fa' },
  { icon: BookOpen,     title: 'Semester Marks',    desc: 'View mid and external examination results',       path: '/semester',         color: '#a78bfa' },
  { icon: Star,         title: 'Mentor Grading',    desc: 'See evaluations from your assigned mentor',       path: '/mentorgrade',      color: '#c084fc' },
  { icon: FileText,     title: 'Counselling Forms', desc: 'Download and view your counselling form data',    path: '/counseling-forms', color: '#38bdf8' },
];

const UserPanel = () => {
  const navigate = useNavigate();
  const [user, setUser]       = useState({ name: '', email: '', profilePicture: '', profileCompletion: 0, assignedMentor: null });
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
    localStorage.clear(); sessionStorage.clear();
    navigate('/signup');
  };

  const completion = Math.min(user.profileCompletion || 0, 100);
  const initials   = user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'S';
  const firstName  = user.name ? user.name.split(' ')[0] : 'Student';

  return (
    <PanelLayout
      roleLabel="Student Portal"
      roleColor="#818cf8"
      info={{ name: user.name, email: user.email, profilePicture: user.profilePicture }}
      stats={[
        { label: 'Role',               value: 'Student',             color: '#818cf8' },
        { label: 'Profile',            value: `${completion}%`,      color: '#a78bfa' },
        { label: 'Status',             value: 'Active',              color: '#047857' },
      ]}
      sectionTitle="Quick Access"
      cards={CARDS.map(c => ({ ...c, onClick: () => navigate(c.path) }))}
      onLogout={handleLogout}
      loading={loading}
      topContent={
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        style={{ ...glassCard, marginBottom: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, padding: '24px 28px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
            background: user.profilePicture ? `url(${user.profilePicture}) center/cover` : 'rgba(148,163,184,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
            border: '2px solid rgba(255,255,255,0.22)',
            boxShadow: '0 0 20px rgba(226,232,240,0.15)',
          }}>
            {!user.profilePicture && initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Sparkles size={13} color="#fbbf24" />
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Welcome back</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{firstName}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>{user.email}</div>
            {user.assignedMentor && (
              <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, marginTop: 4 }}>
                Mentor: {user.assignedMentor.username}
              </div>
            )}
          </div>
        </div>
      </motion.div>}
    />
  );
};

const glassCard = {
  background:           'rgba(148,163,184,0.10)',
  backdropFilter:       'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border:               '1px solid rgba(255,255,255,0.18)',
  borderRadius:         16,
  boxShadow:            '0 4px 24px rgba(0,0,0,0.25)',
};

export default UserPanel;
