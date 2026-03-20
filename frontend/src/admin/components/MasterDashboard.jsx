import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';
import './MasterDashboard.css';

const ROLES = ['principal', 'superadmin', 'admin', 'user'];

const MasterDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [masterInfo, setMasterInfo] = useState({ name: '', email: '' });

  const [overview, setOverview] = useState({ departments: [], stats: {}, principal: null });
  const [assignments, setAssignments] = useState({ departments: [], principals: [], superadmins: [], admins: [], students: [] });
  const [analytics, setAnalytics] = useState({});
  const [batches, setBatches] = useState([]);

  const [departmentForm, setDepartmentForm] = useState({ id: '', name: '', code: '' });
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    role: 'superadmin',
    departmentId: '',
    yearOfStudy: '1',
    assignedMentorId: ''
  });
  const [assignmentForm, setAssignmentForm] = useState({ userId: '', departmentId: '', assignedMentorId: '', yearOfStudy: '' });
  const [panelRole, setPanelRole] = useState('user');
  const [notifyMessage, setNotifyMessage] = useState('Please complete your profile details.');
  const [selectedForNotify, setSelectedForNotify] = useState({
    principal: new Set(),
    superadmin: new Set(),
    admin: new Set(),
    user: new Set()
  });

  const selectedSection = searchParams.get('section') || 'manage';
  const showSection = (sectionKey) => selectedSection === sectionKey;

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [userRes, overviewRes, assignmentsRes, analyticsRes, batchesRes] = await Promise.all([
        apiClient.get('/api/auth/user'),
        apiClient.get('/api/master/overview'),
        apiClient.get('/api/master/assignments'),
        apiClient.get('/api/master/analytics/profiles'),
        apiClient.get('/api/master/batches')
      ]);

      setMasterInfo({
        name: userRes.data?.username || 'Master',
        email: userRes.data?.email || ''
      });
      setOverview(overviewRes.data || {});
      setAssignments(assignmentsRes.data || {});
      setAnalytics(analyticsRes.data?.analytics || {});
      setBatches(batchesRes.data?.batches || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load master dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const clearBanner = () => {
    setError('');
    setMessage('');
  };

  const upsertDepartment = async () => {
    clearBanner();
    try {
      if (!departmentForm.name || !departmentForm.code) {
        setError('Department name and code are required.');
        return;
      }

      if (departmentForm.id) {
        await apiClient.put(`/api/master/departments/${departmentForm.id}`, {
          name: departmentForm.name,
          code: departmentForm.code
        });
        setMessage('Department updated successfully.');
      } else {
        await apiClient.post('/api/master/departments', {
          name: departmentForm.name,
          code: departmentForm.code
        });
        setMessage('Department created successfully.');
      }

      setDepartmentForm({ id: '', name: '', code: '' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save department.');
    }
  };

  const removeDepartment = async (departmentId) => {
    if (!window.confirm('Delete this department?')) return;
    clearBanner();
    try {
      await apiClient.delete(`/api/master/departments/${departmentId}`);
      setMessage('Department deleted successfully.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete department.');
    }
  };

  const createRoleUser = async () => {
    clearBanner();
    try {
      if (!createForm.username || !createForm.email || !createForm.role) {
        setError('Username, email and role are required.');
        return;
      }

      const payload = {
        username: createForm.username,
        email: createForm.email,
        role: createForm.role,
        departmentId: createForm.departmentId || undefined,
        yearOfStudy: createForm.role === 'user' ? Number(createForm.yearOfStudy || 1) : undefined
      };

      const createRes = await apiClient.post('/api/master/users', payload);
      const newUserId = createRes.data?.user?._id;

      if (newUserId && (createForm.departmentId || createForm.assignedMentorId)) {
        await apiClient.patch(`/api/master/assignments/users/${newUserId}`, {
          departmentId: createForm.departmentId || undefined,
          assignedMentorId: createForm.role === 'user' ? (createForm.assignedMentorId || undefined) : undefined,
          yearOfStudy: createForm.role === 'user' ? Number(createForm.yearOfStudy || 1) : undefined
        });
      }

      setMessage(`${createForm.role} created successfully.`);
      setCreateForm({ username: '', email: '', role: 'superadmin', departmentId: '', yearOfStudy: '1', assignedMentorId: '' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  const applyAssignment = async () => {
    clearBanner();
    try {
      if (!assignmentForm.userId) {
        setError('Please select a target user to assign.');
        return;
      }

      await apiClient.patch(`/api/master/assignments/users/${assignmentForm.userId}`, {
        departmentId: assignmentForm.departmentId || undefined,
        assignedMentorId: assignmentForm.assignedMentorId || undefined,
        yearOfStudy: assignmentForm.yearOfStudy ? Number(assignmentForm.yearOfStudy) : undefined
      });

      setMessage('Assignment updated successfully.');
      setAssignmentForm({ userId: '', departmentId: '', assignedMentorId: '', yearOfStudy: '' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update assignment.');
    }
  };

  const deleteManagedUser = async (userId) => {
    if (!window.confirm('Delete this user from system?')) return;
    clearBanner();
    try {
      await apiClient.delete(`/api/master/assignments/users/${userId}`);
      setMessage('User deleted successfully.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const toggleNotifySelection = (role, userId) => {
    setSelectedForNotify((prev) => {
      const copy = new Set(prev[role]);
      if (copy.has(userId)) copy.delete(userId);
      else copy.add(userId);
      return { ...prev, [role]: copy };
    });
  };

  const sendRoleNotification = async (role, mode) => {
    clearBanner();
    try {
      const selectedIds = Array.from(selectedForNotify[role] || []);
      await apiClient.post('/api/master/analytics/notify-role', {
        role,
        subject: `Profile completion reminder for ${role}`,
        message: notifyMessage,
        userIds: mode === 'selected' ? selectedIds : undefined,
        onlyIncomplete: mode === 'incomplete'
      });
      setMessage(`Notification sent for ${role} (${mode}).`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send notification.');
    }
  };

  const openPanel = (role) => {
    const map = {
      user: '/user-panel',
      admin: '/admin-panel',
      superadmin: '/superadmin-panel',
      principal: '/principal-panel',
      master: '/master-panel'
    };
    navigate(map[role] || '/dashboard');
  };

  const roleOptionsForAssignment = [
    ...(assignments.principals || []),
    ...(assignments.superadmins || []),
    ...(assignments.admins || []),
    ...(assignments.students || [])
  ];

  const mentorOptions = assignments.admins || [];

  if (loading) {
    return <div className="loading">Loading master dashboard...</div>;
  }

  return (
    <div className="master-dashboard">
      <div className="dashboard-header">
        <h1>Master Dashboard</h1>
        <p>Centralized governance for all roles and college batches</p>
      </div>

      <div className="section">
        <h2>Profile Section</h2>
        <div className="profile-minimal-card">
          <p><strong>Name:</strong> {masterInfo.name || '-'}</p>
          <p><strong>Email:</strong> {masterInfo.email || '-'}</p>
        </div>
      </div>

      {(error || message) && (
        <div className="section">
          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card"><h3>Departments</h3><p className="stat-number">{overview.stats?.totalDepartments || 0}</p></div>
        <div className="stat-card"><h3>Students</h3><p className="stat-number">{overview.stats?.totalStudents || 0}</p></div>
        <div className="stat-card"><h3>Admins</h3><p className="stat-number">{overview.stats?.totalAdmins || 0}</p></div>
        <div className="stat-card"><h3>Super Admins</h3><p className="stat-number">{overview.stats?.totalSuperadmins || 0}</p></div>
      </div>

      {showSection('manage') && (
      <div className="section" id="manage-department">
        <h2>Manage Department (CRUD)</h2>
        <div className="inline-form-grid">
          <input
            type="text"
            placeholder="Department Name"
            value={departmentForm.name}
            onChange={(e) => setDepartmentForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Code"
            value={departmentForm.code}
            onChange={(e) => setDepartmentForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
          />
          <button className="btn-primary" onClick={upsertDepartment}>{departmentForm.id ? 'Update Department' : 'Add Department'}</button>
        </div>
        <div className="table-wrap">
          <table className="simple-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Super Admins</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(overview.departments || []).map((dept) => (
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

      {showSection('create') && (
      <div className="section" id="create-section">
        <h2>Create Section</h2>
        <p className="section-note">Create user, principal, admin, super admin. Assignment fields are optional.</p>
        <div className="create-grid">
          <input
            type="text"
            placeholder="Username / Roll"
            value={createForm.username}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
          />
          <input
            type="email"
            placeholder="Email"
            value={createForm.email}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
          />
          <select value={createForm.role} onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}>
            <option value="principal">Principal</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>
          <select value={createForm.departmentId} onChange={(e) => setCreateForm((prev) => ({ ...prev, departmentId: e.target.value }))}>
            <option value="">Optional Department</option>
            {(overview.departments || []).map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
          </select>
          <select
            value={createForm.yearOfStudy}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, yearOfStudy: e.target.value }))}
            disabled={createForm.role !== 'user'}
          >
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
          <select
            value={createForm.assignedMentorId}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, assignedMentorId: e.target.value }))}
            disabled={createForm.role !== 'user'}
          >
            <option value="">Optional Assigned Admin</option>
            {mentorOptions.map((admin) => <option key={admin._id} value={admin._id}>{admin.username} ({admin.email})</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={createRoleUser}>Create</button>
      </div>
      )}

      {showSection('assign') && (
      <div className="section" id="assign-section">
        <h2>Assign Section (CRUD)</h2>
        <p className="section-note">Assign principal/superadmin/admin/student and perform updates or delete any selected role user.</p>
        <div className="create-grid">
          <select value={assignmentForm.userId} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, userId: e.target.value }))}>
            <option value="">Select User</option>
            {roleOptionsForAssignment.map((u) => (
              <option key={u._id} value={u._id}>{u.username} ({u.role})</option>
            ))}
          </select>
          <select value={assignmentForm.departmentId} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, departmentId: e.target.value }))}>
            <option value="">Set / Clear Department</option>
            {(overview.departments || []).map((dept) => <option key={dept._id} value={dept._id}>{dept.name}</option>)}
          </select>
          <select value={assignmentForm.assignedMentorId} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, assignedMentorId: e.target.value }))}>
            <option value="">Set / Clear Assigned Admin</option>
            {mentorOptions.map((admin) => <option key={admin._id} value={admin._id}>{admin.username} ({admin.email})</option>)}
          </select>
          <select value={assignmentForm.yearOfStudy} onChange={(e) => setAssignmentForm((prev) => ({ ...prev, yearOfStudy: e.target.value }))}>
            <option value="">Set Year (only users)</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={applyAssignment}>Apply Assignment Update</button>
          <button className="btn-danger" onClick={() => assignmentForm.userId && deleteManagedUser(assignmentForm.userId)} disabled={!assignmentForm.userId}>Delete Selected User</button>
        </div>
      </div>
      )}

      {showSection('analytics') && (
      <div className="section" id="analytics-section">
        <h2>Analytics Section</h2>
        <div className="departments-grid">
          {ROLES.map((role) => {
            const roleData = analytics[role] || { total: 0, completed: 0, pending: 0, records: [] };
            return (
              <div key={role} className="department-card">
                <h3>{role.toUpperCase()} Analytics</h3>
                <p>Total: {roleData.total}</p>
                <p>Profile Completed: {roleData.completed}</p>
                <p>Profile Pending: {roleData.pending}</p>
                <div className="notify-actions">
                  <button className="btn-secondary" onClick={() => sendRoleNotification(role, 'all')}>Notify All</button>
                  <button className="btn-secondary" onClick={() => sendRoleNotification(role, 'incomplete')}>Notify Uncompleted</button>
                  <button className="btn-secondary" onClick={() => sendRoleNotification(role, 'selected')}>Notify Selected</button>
                </div>
                <div className="table-wrap slim-table-wrap">
                  <table className="simple-table slim-table">
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(roleData.records || []).slice(0, 12).map((u) => (
                        <tr key={u._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={(selectedForNotify[role] || new Set()).has(u._id)}
                              onChange={() => toggleNotifySelection(role, u._id)}
                            />
                          </td>
                          <td>{u.username}</td>
                          <td>{u.profileCompleted ? 'Completed' : 'Pending'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
        <div className="inline-form-grid" style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={notifyMessage}
            onChange={(e) => setNotifyMessage(e.target.value)}
            placeholder="Notification message"
          />
        </div>
      </div>
      )}

      {showSection('panel') && (
      <div className="section" id="panel-view">
        <h2>Panel View</h2>
        <p className="section-note">Select any role to preview what that role can see.</p>
        <div className="inline-form-grid panel-preview-grid">
          <select value={panelRole} onChange={(e) => setPanelRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
            <option value="principal">Principal</option>
            <option value="master">Master</option>
          </select>
          <button className="btn-primary" onClick={() => openPanel(panelRole)}>Open {panelRole} panel</button>
        </div>
      </div>
      )}

      {showSection('counseling') && (
      <div className="section" id="counseling-section">
        <h2>Counseling Form</h2>
        <p className="section-note">View existing counseling forms list. Print is restricted by role in form page.</p>
        <button className="btn-primary" onClick={() => navigate('/counseling-forms')}>Open Counseling Forms</button>
      </div>
      )}

      {showSection('batches') && (
      <div className="section" id="all-batches-section">
        <h2>All Batches (Active 4 Years)</h2>
        {(batches || []).length === 0 && <p>No active batches available.</p>}
        {(batches || []).map((batch) => (
          <div key={batch.batchYear} className="batch-card">
            <h3>Batch {batch.batchYear}</h3>
            <div className="table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>Regd No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Counseling Form</th>
                  </tr>
                </thead>
                <tbody>
                  {(batch.students || []).map((student) => (
                    <tr key={student._id}>
                      <td>{student.regdNo}</td>
                      <td>{student.profileName || student.regdNo}</td>
                      <td>{student.email || '-'}</td>
                      <td>{student.department || '-'}</td>
                      <td>{student.yearOfStudy || '-'}</td>
                      <td>
                        <button className="btn-secondary" onClick={() => navigate(`/counseling-form-download/${student.regdNo}`)}>
                          Open Form
                        </button>
                      </td>
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