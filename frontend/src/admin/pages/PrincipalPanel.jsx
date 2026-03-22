import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import PanelLayout from '../components/PanelLayout';
import PrincipalDashboard from '../components/PrincipalDashboard';

const PrincipalPanel = () => {
  const navigate = useNavigate();
  const [info,    setInfo]    = useState({ name: '', email: '', dept: '' });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null); // null = home (cards view)

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'principal') { navigate('/signup'); return; }

    (async () => {
      try {
        const { data } = await apiClient.get('/api/auth/user', { headers: { Authorization: `Bearer ${token}` } });
        setInfo({ name: data.username, email: data.email, dept: data.department || 'Main Campus' });
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
    { icon: '🏢', title: 'Departments',       desc: 'Create, update and manage all college departments',    onClick: () => setActiveSection('departments'), color: '#06b6d4' },
    { icon: '👨‍💼', title: 'Manage HODs',       desc: 'Assign and manage HOD accounts per department',        onClick: () => setActiveSection('superadmins'), color: '#8b5cf6' },
    { icon: '🛡️', title: 'Manage Faculty',    desc: 'View and manage faculty accounts across departments',  onClick: () => setActiveSection('admins'),      color: '#6366f1' },
    { icon: '🎓', title: 'Student Overview',  desc: 'Institution-wide student records and profiles',         onClick: () => setActiveSection('students'),    color: '#ec4899' },
    { icon: '📋', title: 'Counselling Forms', desc: 'Access and print counselling forms for all students',  onClick: () => setActiveSection('counseling'),  color: '#10b981' },
    { icon: '📊', title: 'Analytics',         desc: 'View institution-wide academic analytics and reports', onClick: () => setActiveSection('analytics'),   color: '#f59e0b' },
    { icon: '🗂️', title: 'All Batches',       desc: 'Year-wise student list across all departments',        onClick: () => navigate('/all-batches'),         color: '#0ea5e9' },
    { icon: '✅', title: 'Attendance Reports',desc: 'View attendance data across the institution',          onClick: () => navigate('/attendance'),          color: '#ef4444' },
  ];

  return (
    <PanelLayout
      roleLabel="Principal Panel"
      roleColor="#06b6d4"
      info={info}
      stats={[
        { label: 'Role',   value: 'Principal',              color: '#06b6d4' },
        { label: 'Campus', value: info.dept || 'Main Campus' },
        { label: 'Status', value: 'Active',                 color: '#10b981' },
      ]}
      sectionTitle={activeSection ? '' : 'Principal Features'}
      cards={CARDS}
      onLogout={handleLogout}
      loading={loading}
    >
      {activeSection && (
        <PrincipalDashboard
          section={activeSection}
          onBack={() => setActiveSection(null)}
        />
      )}
    </PanelLayout>
  );
};

export default PrincipalPanel;
