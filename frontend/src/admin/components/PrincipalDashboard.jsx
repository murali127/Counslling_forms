import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';

const ROLES = ['user', 'admin', 'superadmin', 'principal'];

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedSection = searchParams.get('section') || 'departments';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [departments, setDepartments] = useState([]);
  const [superadmins, setSuperadmins] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [batches, setBatches] = useState([]);

  const [departmentForm, setDepartmentForm] = useState({ id: '', name: '', code: '', superadminId: '' });
  const [superadminForm, setSuperadminForm] = useState({ id: '', username: '', email: '', departmentId: '' });
  const [adminForm, setAdminForm] = useState({ id: '', username: '', email: '', departmentId: '', assignedSuperadmin: '' });
  const [studentAssign, setStudentAssign] = useState({ departmentId: '', adminId: '', studentIds: '' });
  const [selectedAdminIds, setSelectedAdminIds] = useState([]);
  const [bulkSuperadminId, setBulkSuperadminId] = useState('');

  const [notifyMessage, setNotifyMessage] = useState('Please complete your profile details.');
  const [selectedForNotify, setSelectedForNotify] = useState({
    user: new Set(),
    admin: new Set(),
    superadmin: new Set(),
    principal: new Set()
  });

  const clearBanner = () => {
    setError('');
    setMessage('');
  };

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signup');
        return;
      }

      const [userRes, departmentsRes, superadminsRes, adminsRes, overviewRes, analyticsRes, batchesRes] = await Promise.all([
        apiClient.get('/api/auth/user', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/api/principal/departments', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/api/principal/superadmins', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/api/principal/admins', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/api/principal/overview', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/api/principal/analytics/profiles', { headers: { Authorization: `Bearer ${token}` } }),
        apiClient.get('/api/principal/batches', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (userRes.data?.role !== 'principal' && userRes.data?.role !== 'master') {
        navigate('/dashboard');
        return;
      }

      setDepartments(departmentsRes.data || []);
      setSuperadmins(superadminsRes.data?.data || []);
      setAdmins(adminsRes.data?.data || []);
      setStudents(overviewRes.data?.students || []);
      setAnalytics(analyticsRes.data?.analytics || {});
      setBatches(batchesRes.data?.batches || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load principal dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);

  const saveDepartment = async () => {
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      if (!departmentForm.name || !departmentForm.code) {
        setError('Department name and code are required.');
        return;
      }
      if (departmentForm.id) {
        await apiClient.put(`/api/principal/departments/${departmentForm.id}`, departmentForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Department updated successfully.');
      } else {
        await apiClient.post('/api/principal/departments', departmentForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Department created successfully.');
      }
      setDepartmentForm({ id: '', name: '', code: '', superadminId: '' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save department');
    }
  };

  const removeDepartment = async (departmentId) => {
    if (!window.confirm('Delete this department?')) return;
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      await apiClient.delete(`/api/principal/departments/${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Department deleted successfully.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete department');
    }
  };

  const saveSuperadmin = async () => {
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      if (!superadminForm.username || !superadminForm.email) {
        setError('Super admin name and email are required.');
        return;
      }
      if (superadminForm.id) {
        await apiClient.patch(`/api/principal/superadmins/${superadminForm.id}`, superadminForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Super admin updated successfully.');
      } else {
        await apiClient.post('/api/principal/superadmins', superadminForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Super admin created successfully.');
      }
      setSuperadminForm({ id: '', username: '', email: '', departmentId: '' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save super admin');
    }
  };

  const removeSuperadmin = async (id) => {
    if (!window.confirm('Delete this super admin?')) return;
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      await apiClient.delete(`/api/principal/superadmins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Super admin deleted successfully.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete super admin');
    }
  };

  const saveAdmin = async () => {
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      if (!adminForm.username || !adminForm.email || !adminForm.departmentId) {
        setError('Admin name, email and department are required.');
        return;
      }

      if (adminForm.id) {
        await apiClient.patch(`/api/principal/admins/${adminForm.id}`, adminForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Admin updated successfully.');
      } else {
        await apiClient.post('/api/principal/create-admin', {
          username: adminForm.username,
          email: adminForm.email,
          departmentId: adminForm.departmentId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMessage('Admin created successfully.');
      }

      setAdminForm({ id: '', username: '', email: '', departmentId: '', assignedSuperadmin: '' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save admin');
    }
  };

  const removeAdmin = async (id) => {
    if (!window.confirm('Delete this admin?')) return;
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      await apiClient.delete(`/api/principal/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Admin deleted successfully.');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete admin');
    }
  };

  const assignAdminsToSuperadmin = async () => {
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      if (selectedAdminIds.length === 0) {
        setError('Select at least one admin.');
        return;
      }
      await apiClient.patch('/api/principal/admins/assign-superadmin', {
        adminIds: selectedAdminIds,
        superadminId: bulkSuperadminId || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Admin assignment to super admin updated successfully.');
      setSelectedAdminIds([]);
      setBulkSuperadminId('');
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign admins');
    }
  };

  const assignStudentsToAdmin = async () => {
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      const studentIds = studentAssign.studentIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      if (!studentAssign.departmentId || !studentAssign.adminId || studentIds.length === 0) {
        setError('Department, admin and student IDs are required.');
        return;
      }

      await apiClient.post('/api/principal/assign-students', {
        departmentId: studentAssign.departmentId,
        adminId: studentAssign.adminId,
        studentIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Students assigned to admin successfully.');
      setStudentAssign({ departmentId: '', adminId: '', studentIds: '' });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign students');
    }
  };

  const toggleNotifySelection = (role, userId) => {
    setSelectedForNotify((prev) => {
      const next = new Set(prev[role]);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return { ...prev, [role]: next };
    });
  };

  const sendRoleNotification = async (role, mode) => {
    clearBanner();
    try {
      const token = localStorage.getItem('authToken');
      const selectedIds = Array.from(selectedForNotify[role] || []);
      await apiClient.post('/api/principal/analytics/notify-role', {
        role,
        subject: `Profile completion reminder for ${role}`,
        message: notifyMessage,
        userIds: mode === 'selected' ? selectedIds : undefined,
        onlyIncomplete: mode === 'incomplete'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`Notifications sent for ${role} (${mode}).`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send notifications');
    }
  };

  const counselingRows = useMemo(() => {
    return (students || []).filter((s) => [1, 2, 3, 4].includes(Number(s.yearOfStudy || 0)));
  }, [students]);

  const showSection = (section) => selectedSection === section;

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading principal dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Principal Dashboard
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate('/principal-panel')}>Back to Principal Panel</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

      {showSection('departments') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Departments</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 1, mb: 2 }}>
            <TextField label="Department Name" value={departmentForm.name} onChange={(e) => setDepartmentForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Code" value={departmentForm.code} onChange={(e) => setDepartmentForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
            <TextField select label="Optional Super Admin" value={departmentForm.superadminId} onChange={(e) => setDepartmentForm((p) => ({ ...p, superadminId: e.target.value }))}>
              <MenuItem value="">None</MenuItem>
              {superadmins.map((sa) => <MenuItem key={sa._id} value={sa._id}>{sa.username}</MenuItem>)}
            </TextField>
            <Button variant="contained" onClick={saveDepartment}>{departmentForm.id ? 'Update' : 'Create'}</Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>Code</b></TableCell>
                  <TableCell><b>Super Admins</b></TableCell>
                  <TableCell><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept._id}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.code}</TableCell>
                    <TableCell>{(dept.assignedSuperadmins || []).map((s) => s.username).join(', ') || '-'}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setDepartmentForm({ id: dept._id, name: dept.name, code: dept.code, superadminId: '' })}>Edit</Button>
                      <Button color="error" size="small" onClick={() => removeDepartment(dept._id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {showSection('superadmins') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Manage Super Admin</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 1, mb: 2 }}>
            <TextField label="Name" value={superadminForm.username} onChange={(e) => setSuperadminForm((p) => ({ ...p, username: e.target.value }))} />
            <TextField label="Email" value={superadminForm.email} onChange={(e) => setSuperadminForm((p) => ({ ...p, email: e.target.value }))} />
            <TextField select label="Department (Optional)" value={superadminForm.departmentId} onChange={(e) => setSuperadminForm((p) => ({ ...p, departmentId: e.target.value }))}>
              <MenuItem value="">None</MenuItem>
              {departments.map((dept) => <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>)}
            </TextField>
            <Button variant="contained" onClick={saveSuperadmin}>{superadminForm.id ? 'Update' : 'Create'}</Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Department</b></TableCell>
                  <TableCell><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {superadmins.map((sa) => (
                  <TableRow key={sa._id}>
                    <TableCell>{sa.username}</TableCell>
                    <TableCell>{sa.email}</TableCell>
                    <TableCell>{sa.departmentId?.name || '-'}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setSuperadminForm({ id: sa._id, username: sa.username, email: sa.email, departmentId: sa.departmentId?._id || '' })}>Edit</Button>
                      <Button color="error" size="small" onClick={() => removeSuperadmin(sa._id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {showSection('admins') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Manage Admin</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 1, mb: 2 }}>
            <TextField label="Name" value={adminForm.username} onChange={(e) => setAdminForm((p) => ({ ...p, username: e.target.value }))} />
            <TextField label="Email" value={adminForm.email} onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))} />
            <TextField select label="Department" value={adminForm.departmentId} onChange={(e) => setAdminForm((p) => ({ ...p, departmentId: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {departments.map((dept) => <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>)}
            </TextField>
            <TextField select label="Assigned Super Admin (Optional)" value={adminForm.assignedSuperadmin} onChange={(e) => setAdminForm((p) => ({ ...p, assignedSuperadmin: e.target.value }))}>
              <MenuItem value="">None</MenuItem>
              {superadmins.map((sa) => <MenuItem key={sa._id} value={sa._id}>{sa.username}</MenuItem>)}
            </TextField>
            <Button variant="contained" onClick={saveAdmin}>{adminForm.id ? 'Update' : 'Create'}</Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
            <TextField select label="Bulk Super Admin" value={bulkSuperadminId} onChange={(e) => setBulkSuperadminId(e.target.value)} sx={{ minWidth: 220 }}>
              <MenuItem value="">Clear Assignment</MenuItem>
              {superadmins.map((sa) => <MenuItem key={sa._id} value={sa._id}>{sa.username}</MenuItem>)}
            </TextField>
            <Button variant="outlined" onClick={assignAdminsToSuperadmin}>Assign Selected Admins</Button>
            <Typography variant="body2">Selected: {selectedAdminIds.length}</Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Select</b></TableCell>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Department</b></TableCell>
                  <TableCell><b>Super Admin</b></TableCell>
                  <TableCell><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedAdminIds.includes(a._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedAdminIds((prev) => [...prev, a._id]);
                          else setSelectedAdminIds((prev) => prev.filter((id) => id !== a._id));
                        }}
                      />
                    </TableCell>
                    <TableCell>{a.username}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>{a.departmentId?.name || '-'}</TableCell>
                    <TableCell>{a.assignedSuperadmin?.username || '-'}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => setAdminForm({
                        id: a._id,
                        username: a.username,
                        email: a.email,
                        departmentId: a.departmentId?._id || '',
                        assignedSuperadmin: a.assignedSuperadmin?._id || ''
                      })}>Edit</Button>
                      <Button color="error" size="small" onClick={() => removeAdmin(a._id)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {showSection('students') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Manage Student</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 1, mb: 2 }}>
            <TextField select label="Department" value={studentAssign.departmentId} onChange={(e) => setStudentAssign((p) => ({ ...p, departmentId: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {departments.map((dept) => <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>)}
            </TextField>
            <TextField select label="Admin" value={studentAssign.adminId} onChange={(e) => setStudentAssign((p) => ({ ...p, adminId: e.target.value }))}>
              <MenuItem value="">Select</MenuItem>
              {admins
                .filter((a) => String(a.departmentId?._id || '') === String(studentAssign.departmentId || ''))
                .map((a) => <MenuItem key={a._id} value={a._id}>{a.username}</MenuItem>)}
            </TextField>
            <TextField
              label="Student IDs (comma separated)"
              value={studentAssign.studentIds}
              onChange={(e) => setStudentAssign((p) => ({ ...p, studentIds: e.target.value }))}
            />
            <Button variant="contained" onClick={assignStudentsToAdmin}>Assign Students</Button>
          </Box>
        </Paper>
      )}

      {showSection('counseling') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Counseling Form</Typography>
          <Button variant="contained" sx={{ mb: 2 }} onClick={() => navigate('/counseling-forms')}>Open Counseling Forms Hub</Button>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Regd No</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Year</b></TableCell>
                  <TableCell><b>Action</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {counselingRows.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.username}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>{s.yearOfStudy || '-'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => navigate(`/counseling-form-download/${s.username}`)}>
                        Open Form
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {showSection('analytics') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Analytics</Typography>
          <Box sx={{ mb: 2 }}>
            <TextField fullWidth label="Notification message" value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)} />
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 2 }}>
            {ROLES.map((role) => {
              const roleData = analytics[role] || { total: 0, completed: 0, pending: 0, records: [] };
              return (
                <Paper key={role} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{role.toUpperCase()}</Typography>
                  <Typography variant="body2">Total: {roleData.total}</Typography>
                  <Typography variant="body2">Completed: {roleData.completed}</Typography>
                  <Typography variant="body2">Pending: {roleData.pending}</Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={() => sendRoleNotification(role, 'all')}>Notify All</Button>
                    <Button size="small" variant="outlined" onClick={() => sendRoleNotification(role, 'incomplete')}>Notify Pending</Button>
                    <Button size="small" variant="outlined" onClick={() => sendRoleNotification(role, 'selected')}>Notify Selected</Button>
                  </Box>
                  <TableContainer sx={{ mt: 1, maxHeight: 220 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Select</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(roleData.records || []).slice(0, 12).map((u) => (
                          <TableRow key={u._id}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={(selectedForNotify[role] || new Set()).has(u._id)}
                                onChange={() => toggleNotifySelection(role, u._id)}
                              />
                            </TableCell>
                            <TableCell>{u.username}</TableCell>
                            <TableCell>{u.profileCompleted ? 'Done' : 'Pending'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              );
            })}
          </Box>
        </Paper>
      )}

      {showSection('batches') && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>All Batches</Typography>
          {(batches || []).map((batch) => (
            <Paper key={batch.batchYear} variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Batch {batch.batchYear}</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Regd No</b></TableCell>
                      <TableCell><b>Name</b></TableCell>
                      <TableCell><b>Email</b></TableCell>
                      <TableCell><b>Dept</b></TableCell>
                      <TableCell><b>Action</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(batch.students || []).map((s) => (
                      <TableRow key={s._id}>
                        <TableCell>{s.regdNo}</TableCell>
                        <TableCell>{s.profileName || s.regdNo}</TableCell>
                        <TableCell>{s.email}</TableCell>
                        <TableCell>{s.department || '-'}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined" onClick={() => navigate(`/counseling-form-download/${s.regdNo}`)}>
                            Open Form
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default PrincipalDashboard;
