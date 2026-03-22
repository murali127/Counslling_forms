import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Lock, BookOpen, Star, CalendarCheck, Layers } from 'lucide-react';
import apiClient from '../../apiClient';
import PanelLayout from '../components/PanelLayout';
import AdminUserManagement from './AdminUserManagement';
import AdminAccessControl from './AdminAccessControl';
import AdminDataOverview from './AdminDataOverview';

const SectionShell = ({ onBack, children }) => (
  <div className="glass-section">
    <button
      onClick={onBack}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 16, padding: '8px 16px', borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(12px)',
        cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; }}
    >
      ← Overview
    </button>
    {children}
  </div>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const [info, setInfo]           = useState({ name: '', email: '', dept: '' });
  const [loading, setLoading]     = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'admin') { navigate('/signup'); return; }

    (async () => {
      try {
        const cfg = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await apiClient.get('/api/auth/user', cfg);
        let dept = '';
        if (data.departmentId) {
          try {
            const d = await apiClient.get(`/api/principal/departments/${data.departmentId}`, cfg);
            dept = d.data?.name || '';
          } catch (_) {}
        }
        setInfo({ name: data.username, email: data.email, dept });
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
    { icon: Users,         title: 'Manage Students',   desc: 'Create, update and delete students assigned to you',    onClick: () => setActiveSection('users'),       color: '#818cf8' },
    { icon: FileText,      title: 'Counselling Forms', desc: 'View and print counselling forms of assigned students', onClick: () => setActiveSection('counselling'), color: '#6366f1' },
    { icon: Lock,          title: 'Access Control',    desc: 'Configure year-wise login windows and notify students', onClick: () => setActiveSection('access'),      color: '#f472b6' },
    { icon: BookOpen,      title: 'Semester Marks',    desc: 'View and update semester marks for assigned students',  onClick: () => navigate('/semester'),           color: '#60a5fa' },
    { icon: Star,          title: 'Mentor Grading',    desc: 'Grade assigned students across all years',              onClick: () => navigate('/mentorgrade'),        color: '#a78bfa' },
    { icon: CalendarCheck, title: 'Attendance',        desc: 'View monthly attendance of assigned students',          onClick: () => navigate('/attendance'),         color: '#c084fc' },
    { icon: Layers,        title: 'All Batches',       desc: 'Year-wise student list with counselling form access',   onClick: () => navigate('/all-batches'),        color: '#38bdf8' },
  ];

  const sectionMap = {
    users:       <AdminUserManagement />,
    counselling: <AdminDataOverview />,
    access:      <AdminAccessControl />,
  };

  return (
    <PanelLayout
      roleLabel="Faculty Panel"
      roleColor="#7c3aed"
      info={info}
      stats={[
        { label: 'Role',       value: 'Faculty',      color: '#7c3aed' },
        { label: 'Department', value: info.dept || 'N/A' },
        { label: 'Status',     value: 'Active',       color: '#10b981' },
      ]}
      sectionTitle={activeSection ? '' : 'Faculty Features'}
      cards={CARDS}
      onLogout={handleLogout}
      loading={loading}
    >
      {activeSection && sectionMap[activeSection] && (
        <SectionShell onBack={() => setActiveSection(null)}>
          {sectionMap[activeSection]}
        </SectionShell>
      )}
    </PanelLayout>
  );
};

export default AdminPanel;
