import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Link2, BarChart3, FileText, Star, Layers, CalendarRange } from 'lucide-react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, CircularProgress, Typography } from '@mui/material';
import apiClient from '../../apiClient';
import PanelLayout from '../components/PanelLayout';
import ManageAdmins from '../components/ManageAdmins';
import StudentsList from '../components/StudentsList';
import MentorAllocation from '../components/MentorAllocation';
import OverallReports from '../components/OverallReports';

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

const SuperAdminPanel = () => {
  const navigate = useNavigate();
  const [info,    setInfo]    = useState({ name: '', email: '', dept: '' });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  /* Shift Years modal state */
  const [modalOpen,      setModalOpen]      = useState(false);
  const [shiftLoading,   setShiftLoading]   = useState(false);
  const [revertLoading,  setRevertLoading]  = useState(false);
  const [statusMessage,  setStatusMessage]  = useState('');
  const [statusSeverity, setStatusSeverity] = useState('success');
  const [allStudents,    setAllStudents]    = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const role  = localStorage.getItem('userRole');
    if (!token || role !== 'superadmin') { navigate('/signup'); return; }

    (async () => {
      try {
        const cfg = { headers: { Authorization: `Bearer ${token}` } };
        const { data } = await apiClient.get('/api/auth/user', cfg);
        let dept = '';
        if (data.departmentId) {
          try { const d = await apiClient.get(`/api/principal/departments/${data.departmentId}`, cfg); dept = d.data?.name || ''; } catch (_) {}
        }
        setInfo({ name: data.username, email: data.email, dept });

        try {
          const res = await apiClient.get('/api/admin/users?role=user', cfg);
          const list = Array.isArray(res.data) ? res.data : [];
          const transformed = list.map(s => ({ _id: s._id, regdNo: s.username, name: s.name || s.username, yearOfStudy: Number(s.yearOfStudy) || 1, relieved: Boolean(s.relieved) }));
          setAllStudents(transformed);
          if (!localStorage.getItem('shiftedStudentsSnapshot')) localStorage.setItem('shiftedStudentsSnapshot', JSON.stringify(transformed));
        } catch (_) {}
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

  const shiftYears = async () => {
    if (shiftLoading || revertLoading) return;
    setShiftLoading(true); setStatusMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await apiClient.post('/api/superadmin/shift-years', null, { headers: { Authorization: `Bearer ${token}` } });
      setStatusMessage(`Shift complete: ${res.data.promoted || 0} promoted, ${res.data.relieved || 0} relieved.`);
      setStatusSeverity('success');
      const r2 = await apiClient.get('/api/admin/all-batches-students', { headers: { Authorization: `Bearer ${token}` } });
      setAllStudents(r2.data || []);
    } catch (err) {
      setStatusMessage(err.response?.data?.error || 'Failed to shift years.');
      setStatusSeverity('error');
    } finally { setShiftLoading(false); }
  };

  const revertShiftYears = async () => {
    if (shiftLoading || revertLoading) return;
    setRevertLoading(true); setStatusMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await apiClient.post('/api/superadmin/revert-shift-years', null, { headers: { Authorization: `Bearer ${token}` } });
      setStatusMessage(`Revert complete: ${res.data.reverted || 0} students restored.`);
      setStatusSeverity('success');
      localStorage.removeItem('superadminLastShiftSnapshot');
      const r2 = await apiClient.get('/api/admin/all-batches-students', { headers: { Authorization: `Bearer ${token}` } });
      setAllStudents(r2.data || []);
    } catch (err) {
      setStatusMessage(err.response?.data?.error || 'Failed to revert shift.');
      setStatusSeverity('error');
    } finally { setRevertLoading(false); }
  };

  const CARDS = [
    { icon: Users,         title: 'Manage Faculty',     desc: 'Create and manage faculty accounts in your department',  onClick: () => setActiveSection('admins'),     color: '#6366f1' },
    { icon: GraduationCap, title: 'Student Records',    desc: 'View and manage all student records department-wide',    onClick: () => setActiveSection('students'),   color: '#8b5cf6' },
    { icon: Link2,         title: 'Mentor Allocation',  desc: 'Assign students to mentors within the department',       onClick: () => setActiveSection('allocation'), color: '#a78bfa' },
    { icon: BarChart3,     title: 'Overall Reports',    desc: 'View department-wide analytics and counselling reports', onClick: () => setActiveSection('reports'),    color: '#60a5fa' },
    { icon: FileText,      title: 'Counselling Forms',  desc: 'Access counselling forms for all assigned students',     onClick: () => navigate('/counseling-forms'),  color: '#818cf8' },
    { icon: Star,          title: 'Mentor Grading',     desc: 'View mentor grading records across the department',      onClick: () => navigate('/mentorgrade'),       color: '#c084fc' },
    { icon: Layers,        title: 'All Batches',        desc: 'Year-wise student list with counselling form access',    onClick: () => navigate('/all-batches'),       color: '#38bdf8' },
    { icon: CalendarRange, title: 'Shift Academic Year',desc: 'Promote all students to next year of study',             onClick: () => setModalOpen(true),            color: '#f472b6' },
  ];

  const sectionMap = {
    admins:     <ManageAdmins />,
    students:   <StudentsList />,
    allocation: <MentorAllocation />,
    reports:    <OverallReports />,
  };

  const ShiftModal = (
    <Dialog open={modalOpen} onClose={() => { setModalOpen(false); setStatusMessage(''); }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Shift Academic Year</DialogTitle>
      <DialogContent>
        {statusMessage && <Alert severity={statusSeverity} sx={{ mb: 2 }}>{statusMessage}</Alert>}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Promote all students to the next year of study. Year 4 students will be marked as relieved.
          This action can be reverted.
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Total students loaded: {allStudents.length}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ padding: '16px 24px', gap: '8px' }}>
        <Button onClick={() => { setModalOpen(false); setStatusMessage(''); }} variant="outlined">Close</Button>
        <Button onClick={revertShiftYears} variant="outlined" color="warning" disabled={revertLoading || shiftLoading}>
          {revertLoading ? <CircularProgress size={18} /> : 'Revert Shift'}
        </Button>
        <Button onClick={shiftYears} variant="contained" color="error" disabled={shiftLoading || revertLoading}>
          {shiftLoading ? <CircularProgress size={18} color="inherit" /> : 'Shift Now'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <PanelLayout
        roleLabel="HOD Panel"
        roleColor="#e11d48"
        info={info}
        stats={[
          { label: 'Role',       value: 'HOD',          color: '#e11d48' },
          { label: 'Department', value: info.dept || 'N/A' },
          { label: 'Status',     value: 'Active',       color: '#10b981' },
        ]}
        sectionTitle={activeSection ? '' : 'HOD Features'}
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
      {ShiftModal}
    </>
  );
};

export default SuperAdminPanel;
