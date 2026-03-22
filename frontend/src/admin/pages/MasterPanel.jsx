import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Users, BarChart3, Eye, FileText, Layers, CalendarCheck,
} from 'lucide-react';
import apiClient from '../../apiClient';
import PanelLayout from '../components/PanelLayout';
import MasterDashboard from '../components/MasterDashboard';

const MasterPanel = () => {
  const navigate = useNavigate();
  const [info,    setInfo]    = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'master') { navigate('/signup'); return; }

    (async () => {
      try {
        const cfg = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await apiClient.get('/api/auth/user', cfg);
        let name = data.username, profilePicture = '';
        try {
          const p = await apiClient.get('/api/profile', cfg);
          if (p.data.success && p.data.profile) {
            if (p.data.profile.name)           name           = p.data.profile.name;
            if (p.data.profile.profilePicture) profilePicture = p.data.profile.profilePicture;
          }
        } catch (_) {}
        setInfo({ name, email: data.email, profilePicture });
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

  const CARDS = [
    { icon: Building2,    title: 'Manage Departments',  desc: 'Create and configure all college departments',               onClick: () => setActiveSection('manage'),     color: '#38bdf8' },
    { icon: Users,        title: 'Manage Users & Roles', desc: 'Create Principal, HOD, Faculty and Student accounts',        onClick: () => setActiveSection('create'),     color: '#a78bfa' },
    { icon: BarChart3,    title: 'Analytics',            desc: 'Institution-wide analytics and profile reports',             onClick: () => setActiveSection('analytics'), color: '#818cf8' },
    { icon: Eye,          title: 'Panel Overview',       desc: 'View any role panel from a single interface',                onClick: () => setActiveSection('panel'),     color: '#6366f1' },
    { icon: FileText,     title: 'Counselling Overview', desc: 'Institution-wide counselling forms and data',                onClick: () => setActiveSection('counseling'), color: '#c084fc' },
    { icon: Layers,       title: 'All Batches',          desc: 'Year-wise student list across all departments',              onClick: () => navigate('/all-batches'),       color: '#60a5fa' },
    { icon: CalendarCheck,title: 'Attendance Reports',   desc: 'Attendance data across the entire institution',              onClick: () => navigate('/attendance'),        color: '#f472b6' },
  ];

  return (
    <PanelLayout
      roleLabel="Master"
      roleColor="#1d4ed8"
      info={info}
      stats={[
        { label: 'Role',   value: 'Master',            color: '#1d4ed8' },
        { label: 'Access', value: 'Institution-Wide',  color: '#7c3aed' },
        { label: 'Status', value: 'Active',            color: '#047857' },
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
