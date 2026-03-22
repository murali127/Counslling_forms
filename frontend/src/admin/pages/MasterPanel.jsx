import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import PanelLayout from '../components/PanelLayout';
import MasterDashboard from '../components/MasterDashboard';

const MasterPanel = () => {
  const navigate = useNavigate();
  const [info,    setInfo]    = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null); // null = home (cards view)

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'master') { navigate('/signup'); return; }

    (async () => {
      try {
        const { data } = await apiClient.get('/api/auth/user', { headers: { Authorization: `Bearer ${token}` } });
        setInfo({ name: data.username, email: data.email });
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

  // Cards — sections rendered inline; external pages still navigate
  const CARDS = [
    { icon: '🏛️', title: 'Manage Departments',   desc: 'Create and configure all college departments',              onClick: () => setActiveSection('manage'),     color: '#0ea5e9' },
    { icon: '👑', title: 'Manage Users & Roles',  desc: 'Create the Principal account and assign HODs to departments', onClick: () => setActiveSection('create'),     color: '#6366f1' },
    { icon: '📊', title: 'Analytics',             desc: 'Institution-wide analytics and reports',                    onClick: () => setActiveSection('analytics'), color: '#06b6d4' },
    { icon: '👁️', title: 'Panel Overview',        desc: 'View any role panel from a single interface',               onClick: () => setActiveSection('panel'),     color: '#ec4899' },
    { icon: '📋', title: 'Counselling Overview',  desc: 'Institution-wide counselling forms and data',               onClick: () => setActiveSection('counseling'), color: '#10b981' },
    { icon: '🗂️', title: 'All Batches',           desc: 'Year-wise student list across all departments',             onClick: () => navigate('/all-batches'),       color: '#f59e0b' },
    { icon: '✅', title: 'Attendance Reports',    desc: 'Attendance data across the entire institution',              onClick: () => navigate('/attendance'),        color: '#ef4444' },
  ];

  return (
    <PanelLayout
      roleLabel="Master Panel"
      roleColor="#0ea5e9"
      info={info}
      stats={[
        { label: 'Role',   value: 'Master',             color: '#0ea5e9' },
        { label: 'Access', value: 'Institution-Wide' },
        { label: 'Status', value: 'Active',             color: '#10b981' },
      ]}
      sectionTitle={activeSection ? '' : 'Master Features'}
      cards={CARDS}
      onLogout={handleLogout}
      loading={loading}
    >
      {activeSection && (
        <MasterDashboard
          section={activeSection}
          onBack={() => setActiveSection(null)}
        />
      )}
    </PanelLayout>
  );
};

export default MasterPanel;
