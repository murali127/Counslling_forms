import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';
import './MasterDashboard.css';

const ROLES = ['principal', 'superadmin', 'admin', 'user'];

const MasterDashboard = ({ section: sectionProp, onBack }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedSection = sectionProp || searchParams.get('section') || 'manage';
  const showSection = (key) => selectedSection === key;

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [message, setMessage] = useState('');

  // Section-specific data — loaded only when needed
  const [overview,     setOverview]     = useState({ departments: [], stats: {}, principal: null });
  const [assignments,  setAssignments]  = useState({ departments: [], principals: [], superadmins: [], admins: [], students: [] });
  const [analytics,    setAnalytics]    = useState({});
  const [batches,      setBatches]      = useState([]);

  const [departmentForm,  setDepartmentForm]  = useState({ id: '', name: '', code: '' });
  const [createForm,      setCreateForm]      = useState({ username: '', email: '', role: 'superadmin', departmentId: '', yearOfStudy: '1', assignedMentorId: '' });
  const [assignmentForm,  setAssignmentForm]  = useState({ userId: '', departmentId: '', assignedMentorId: '', yearOfStudy: '' });
  const [panelRole,       setPanelRole]       = useState('user');
  const [notifyMessage,   setNotifyMessage]   = useState('Please complete your profile details.');
  const [selectedForNotify, setSelectedForNotify] = useState({ principal: new Set(), superadmin: new Set(), admin: new Set(), user: new Set() });

  const clearBanner = () => { setError(''); setMessage(''); };

  /* Load only the data the active section needs */
  const loadSection = useCallback(async (section) => {
    setLoading(true);
    setError('');
    try {
      if (section === 'manage') {
        const res = await apiClient.get('/api/master/overview');
        setOverview(res.data || {});

      } else if (section === 'create' || section === 'assign') {
        const [overviewRes, assignmentsRes] = await Promise.all([
          apiClient.get('/api/master/overview'),
          apiClient.get('/api/master/assignments'),
        ]);
        setOverview(overviewRes.data || {});
        setAssignments(assignmentsRes.data || {});

      } else if (section === 'analytics') {
        const res = await apiClient.get('/api/master/analytics/profiles');
        setAnalytics(res.data?.analytics || {});

      } else if (section === 'batches') {
        const res = await apiClient.get('/api/master/batches');
        setBatches(res.data?.batches || []);
      }
      // 'panel' and 'counseling' need no data
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSection(selectedSection);
  }, [selectedSection, loadSection]);

  /* ── Actions ── */
  const upsertDepartment = async () => {
    clearBanner();
    try {
      if (!departmentForm.name || !departmentForm.code) { setError('Department name and code are required.'); return; }
      if (departmentForm.id) {
        await apiClient.put(`/api/master/departments/${departmentForm.id}`, { name: departmentForm.name, code: departmentForm.code });
        setMessage('Department updated.');
      } else {
        await apiClient.post('/api/master/departments', { name: departmentForm.name, code: departmentForm.code });
        setMessage('Department created.');
      }
      setDepartmentForm({ id: '', name: '', code: '' });
      await loadSection('manage');
    } catch (err) { setError(err.response?.data?.error || 'Failed to save department.'); }
  };

  const removeDepartment = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    clearBanner();
    try {
      await apiClient.delete(`/api/master/departments/${id}`);
      setMessage('Department deleted.');
      await loadSection('manage');
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete department.'); }
  };

  const createRoleUser = async () => {
    clearBanner();
    try {
      if (!createForm.username || !createForm.email || !createForm.role) { setError('Username, email and role are required.'); return; }
      const payload = {
        username: createForm.username, email: createForm.email, role: createForm.role,
        departmentId: createForm.departmentId || undefined,
        yearOfStudy: createForm.role === 'user' ? Number(createForm.yearOfStudy || 1) : undefined,
      };
      const res = await apiClient.post('/api/master/users', payload);
      const newUserId = res.data?.user?._id;
      if (newUserId && (createForm.departmentId || createForm.assignedMentorId)) {
        await apiClient.patch(`/api/master/assignments/users/${newUserId}`, {
          departmentId: createForm.departmentId || undefined,
          assignedMentorId: createForm.role === 'user' ? (createForm.assignedMentorId || undefined) : undefined,
          yearOfStudy: createForm.role === 'user' ? Number(createForm.yearOfStudy || 1) : undefined,
        });
      }
      setMessage(`${createForm.role} created successfully.`);
      setCreateForm({ username: '', email: '', role: 'superadmin', departmentId: '', yearOfStudy: '1', assignedMentorId: '' });
      await loadSection('create');
    } catch (err) { setError(err.response?.data?.error || 'Failed to create user.'); }
  };

  const applyAssignment = async () => {
    clearBanner();
    try {
      if (!assignmentForm.userId) { setError('Please select a target user.'); return; }
      await apiClient.patch(`/api/master/assignments/users/${assignmentForm.userId}`, {
        departmentId: assignmentForm.departmentId || undefined,
        assignedMentorId: assignmentForm.assignedMentorId || undefined,
        yearOfStudy: assignmentForm.yearOfStudy ? Number(assignmentForm.yearOfStudy) : undefined,
      });
      setMessage('Assignment updated.');
      setAssignmentForm({ userId: '', departmentId: '', assignedMentorId: '', yearOfStudy: '' });
      await loadSection('assign');
    } catch (err) { setError(err.response?.data?.error || 'Failed to update assignment.'); }
  };

  const deleteManagedUser = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    clearBanner();
    try {
      await apiClient.delete(`/api/master/assignments/users/${userId}`);
      setMessage('User deleted.');
      await loadSection('assign');
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete user.'); }
  };

  const toggleNotifySelection = (role, userId) => {
    setSelectedForNotify(prev => {
      const copy = new Set(prev[role]);
      copy.has(userId) ? copy.delete(userId) : copy.add(userId);
      return { ...prev, [role]: copy };
    });
  };

  const sendRoleNotification = async (role, mode) => {
    clearBanner();
    try {
      await apiClient.post('/api/master/analytics/notify-role', {
        role, subject: `Profile completion reminder for ${role}`,
        message: notifyMessage,
        userIds: mode === 'selected' ? Array.from(selectedForNotify[role] || []) : undefined,
        onlyIncomplete: mode === 'incomplete',
      });
      setMessage(`Notification sent for ${role} (${mode}).`);
    } catch (err) { setError(err.response?.data?.error || 'Failed to send notification.'); }
  };

  const openPanel = (role) => {
    const map = { user: '/user-panel', admin: '/admin-panel', superadmin: '/superadmin-panel', principal: '/principal-panel', master: '/master-panel' };
    navigate(map[role] || '/dashboard');
  };

  const roleOptionsForAssignment = [
    ...(assignments.principals  || []),
    ...(assignments.superadmins || []),
    ...(assignments.admins      || []),
    ...(assignments.students    || []),
  ];
  const mentorOptions = assignments.admins || [];

  return (
    <div className="master-dashboard">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginBottom: 16, padding: '6px 14px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(148,163,184,0.10)',
            cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(16px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.18)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(148,163,184,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
        >
          ← Overview
        </button>
      )}

      {loading && (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          Loading…
        </div>
      )}

      {!loading && (error || message) && (
        <div style={{ marginBottom: 12 }}>
          {error   && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
        </div>
      )}

      {!loading && showSection('manage') && (
        <div className="section" id="manage-department">
          <h2>Manage Departments</h2>

          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><h3>Departments</h3><p className="stat-number">{overview.stats?.totalDepartments || 0}</p></div>
            <div className="stat-card"><h3>Students</h3><p className="stat-number">{overview.stats?.totalStudents || 0}</p></div>
            <div className="stat-card"><h3>Faculty</h3><p className="stat-number">{overview.stats?.totalAdmins || 0}</p></div>
            <div className="stat-card"><h3>HODs</h3><p className="stat-number">{overview.stats?.totalSuperadmins || 0}</p></div>
          </div>

          <div className="inline-form-grid">
            <input type="text" placeholder="Department Name" value={departmentForm.name} onChange={e => setDepartmentForm(p => ({ ...p, name: e.target.value }))} />
            <input type="text" placeholder="Code" value={departmentForm.code} onChange={e => setDepartmentForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <button className="btn-primary" onClick={upsertDepartment}>{departmentForm.id ? 'Update' : 'Add Department'}</button>
          </div>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr><th>Name</th><th>Code</th><th>HODs</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {(overview.departments || []).map(dept => (
                  <tr key={dept._id}>
                    <td>{dept.name}</td>
                    <td>{dept.code}</td>
                    <td>{(dept.assignedSuperadmins || []).length}</td>
                    <td>
                      <button className="btn-secondary" onClick={() => setDepartmentForm({ id: dept._id, name: dept.name, code: dept.code })}>Edit</button>
                      <button className="btn-danger" onClick={() => removeDepartment(dept._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && showSection('create') && (
        <div className="section" id="create-section">
          <h2>Create Users</h2>
          <p className="section-note">Create Principal, HOD, Faculty, or Student accounts.</p>
          <div className="create-grid">
            <input type="text" placeholder="Username / Roll No" value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))} />
            <input type="email" placeholder="Email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
            <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}>
              <option value="principal">Principal</option>
              <option value="superadmin">HOD</option>
              <option value="admin">Faculty</option>
              <option value="user">Student</option>
            </select>
            <select value={createForm.departmentId} onChange={e => setCreateForm(p => ({ ...p, departmentId: e.target.value }))}>
              <option value="">Optional Department</option>
              {(overview.departments || []).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select value={createForm.yearOfStudy} onChange={e => setCreateForm(p => ({ ...p, yearOfStudy: e.target.value }))} disabled={createForm.role !== 'user'}>
              <option value="1">Year 1</option><option value="2">Year 2</option>
              <option value="3">Year 3</option><option value="4">Year 4</option>
            </select>
            <select value={createForm.assignedMentorId} onChange={e => setCreateForm(p => ({ ...p, assignedMentorId: e.target.value }))} disabled={createForm.role !== 'user'}>
              <option value="">Optional Assigned Faculty</option>
              {mentorOptions.map(a => <option key={a._id} value={a._id}>{a.username} ({a.email})</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={createRoleUser}>Create</button>

          <h2 style={{ marginTop: 28 }}>Assign Users to Departments</h2>
          <p className="section-note">Assign or update department / mentor for any user.</p>
          <div className="create-grid">
            <select value={assignmentForm.userId} onChange={e => setAssignmentForm(p => ({ ...p, userId: e.target.value }))}>
              <option value="">Select User</option>
              {roleOptionsForAssignment.map(u => <option key={u._id} value={u._id}>{u.username} ({u.role})</option>)}
            </select>
            <select value={assignmentForm.departmentId} onChange={e => setAssignmentForm(p => ({ ...p, departmentId: e.target.value }))}>
              <option value="">Set / Clear Department</option>
              {(overview.departments || []).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select value={assignmentForm.assignedMentorId} onChange={e => setAssignmentForm(p => ({ ...p, assignedMentorId: e.target.value }))}>
              <option value="">Set / Clear Faculty</option>
              {mentorOptions.map(a => <option key={a._id} value={a._id}>{a.username}</option>)}
            </select>
            <select value={assignmentForm.yearOfStudy} onChange={e => setAssignmentForm(p => ({ ...p, yearOfStudy: e.target.value }))}>
              <option value="">Set Year (students only)</option>
              <option value="1">Year 1</option><option value="2">Year 2</option>
              <option value="3">Year 3</option><option value="4">Year 4</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={applyAssignment}>Apply Assignment</button>
            <button className="btn-danger" onClick={() => assignmentForm.userId && deleteManagedUser(assignmentForm.userId)} disabled={!assignmentForm.userId}>Delete Selected User</button>
          </div>
        </div>
      )}

      {!loading && showSection('analytics') && (
        <div className="section" id="analytics-section">
          <h2>Analytics</h2>
          <div className="departments-grid">
            {ROLES.map(role => {
              const d = analytics[role] || { total: 0, completed: 0, pending: 0, records: [] };
              return (
                <div key={role} className="department-card">
                  <h3>{role === 'superadmin' ? 'HOD' : role === 'admin' ? 'Faculty' : role === 'user' ? 'Student' : 'Principal'} Analytics</h3>
                  <p>Total: {d.total} &nbsp;|&nbsp; Completed: {d.completed} &nbsp;|&nbsp; Pending: {d.pending}</p>
                  <div className="notify-actions">
                    <button className="btn-secondary" onClick={() => sendRoleNotification(role, 'all')}>Notify All</button>
                    <button className="btn-secondary" onClick={() => sendRoleNotification(role, 'incomplete')}>Notify Pending</button>
                    <button className="btn-secondary" onClick={() => sendRoleNotification(role, 'selected')}>Notify Selected</button>
                  </div>
                  <div className="table-wrap slim-table-wrap">
                    <table className="simple-table slim-table">
                      <thead><tr><th>Select</th><th>Name</th><th>Status</th></tr></thead>
                      <tbody>
                        {(d.records || []).slice(0, 12).map(u => (
                          <tr key={u._id}>
                            <td><input type="checkbox" checked={(selectedForNotify[role] || new Set()).has(u._id)} onChange={() => toggleNotifySelection(role, u._id)} /></td>
                            <td>{u.username}</td>
                            <td>{u.profileCompleted ? 'Done' : 'Pending'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="inline-form-grid" style={{ marginTop: 10 }}>
            <input type="text" value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} placeholder="Notification message" />
          </div>
        </div>
      )}

      {!loading && showSection('panel') && (
        <div className="section" id="panel-view">
          <h2>Panel View</h2>
          <p className="section-note">Select any role to preview what that role sees.</p>
          <div className="inline-form-grid panel-preview-grid">
            <select value={panelRole} onChange={e => setPanelRole(e.target.value)}>
              <option value="user">Student</option>
              <option value="admin">Faculty</option>
              <option value="superadmin">HOD</option>
              <option value="principal">Principal</option>
              <option value="master">Master</option>
            </select>
            <button className="btn-primary" onClick={() => openPanel(panelRole)}>Open Panel</button>
          </div>
        </div>
      )}

      {!loading && showSection('counseling') && (
        <div className="section" id="counseling-section">
          <h2>Counselling Overview</h2>
          <p className="section-note">View existing counselling forms. Print is restricted by role in form page.</p>
          <button className="btn-primary" onClick={() => navigate('/counseling-forms')}>Open Counselling Forms</button>
        </div>
      )}

      {!loading && showSection('batches') && (
        <div className="section" id="all-batches-section">
          <h2>All Batches</h2>
          {(batches || []).length === 0 && <p>No active batches available.</p>}
          {(batches || []).map(batch => (
            <div key={batch.batchYear} className="batch-card">
              <h3>Batch {batch.batchYear}</h3>
              <div className="table-wrap">
                <table className="simple-table">
                  <thead><tr><th>Regd No</th><th>Name</th><th>Email</th><th>Department</th><th>Year</th><th>Form</th></tr></thead>
                  <tbody>
                    {(batch.students || []).map(s => (
                      <tr key={s._id}>
                        <td>{s.regdNo}</td>
                        <td>{s.profileName || s.regdNo}</td>
                        <td>{s.email || '-'}</td>
                        <td>{s.department || '-'}</td>
                        <td>{s.yearOfStudy || '-'}</td>
                        <td><button className="btn-secondary" onClick={() => navigate(`/counseling-form-download/${s.regdNo}`)}>Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MasterDashboard;
