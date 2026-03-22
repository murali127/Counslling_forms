import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import PanelLayout from '../components/PanelLayout';
import AdminUserManagement from './AdminUserManagement';
import AdminAccessControl from './AdminAccessControl';
import AdminDataOverview from './AdminDataOverview';

const SectionShell = ({ onBack, children }) => (
  <div>
    <button
      onClick={onBack}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        marginBottom: 16, padding: '6px 14px', borderRadius: 8,
        border: '1px solid #e2e8f0', background: '#fff',
        cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: '#475569',
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
      onMouseLeave={e => e.currentTarget.style.background = '#fff'}
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
    { icon: '👥', title: 'Manage Students',   desc: 'Create, update and delete students assigned to you',    onClick: () => setActiveSection('users'),          color: '#8b5cf6' },
    { icon: '📋', title: 'Counselling Forms', desc: 'View and print counselling forms of assigned students', onClick: () => setActiveSection('counselling'),    color: '#6366f1' },
    { icon: '🔒', title: 'Access Control',    desc: 'Configure year-wise login windows and notify students', onClick: () => setActiveSection('access'),         color: '#ec4899' },
    { icon: '📝', title: 'Semester Marks',    desc: 'View and update semester marks for assigned students',  onClick: () => navigate('/semester'),              color: '#06b6d4' },
    { icon: '⭐', title: 'Mentor Grading',    desc: 'Grade assigned students across all years',              onClick: () => navigate('/mentorgrade'),           color: '#10b981' },
    { icon: '✅', title: 'Attendance',         desc: 'View monthly attendance of assigned students',          onClick: () => navigate('/attendance'),            color: '#f59e0b' },
    { icon: '🗂️', title: 'All Batches',       desc: 'Year-wise student list with counselling form access',   onClick: () => navigate('/all-batches'),           color: '#0ea5e9' },
  ];

  const sectionMap = {
    users:       <AdminUserManagement />,
    counselling: <AdminDataOverview />,
    access:      <AdminAccessControl />,
  };

  return (
    <PanelLayout
      roleLabel="Faculty Panel"
      roleColor="#8b5cf6"
      info={info}
      stats={[
        { label: 'Role',       value: 'Faculty',      color: '#8b5cf6' },
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
