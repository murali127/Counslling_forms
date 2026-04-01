import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Tabs, Tab, TextField,
  Chip, CircularProgress, Alert, TablePagination, MenuItem, Checkbox
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const PeopleOverview = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [activeYear, setActiveYear] = useState('all');
  const [mentors, setMentors] = useState([]);
  const [adminMetaByEmail, setAdminMetaByEmail] = useState({});
  const [mentorSelection, setMentorSelection] = useState({});
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [studentPage, setStudentPage] = useState(0);
  const [studentRowsPerPage, setStudentRowsPerPage] = useState(10);
  const [adminPage, setAdminPage] = useState(0);
  const [adminRowsPerPage, setAdminRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, adminsRes, mentorsRes, adminMetaRes] = await Promise.allSettled([
          apiClient.get('/api/superadmin/students-with-profiles'),
          apiClient.get('/api/superadmin/mentors-with-students'),
          apiClient.get('/api/superadmin/mentors-with-students'),
          apiClient.get('/api/superadmin/admins')
        ]);
        if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data);
        else setError('Failed to load students.');
        if (adminsRes.status === 'fulfilled') setAdmins(adminsRes.value.data);
        else setError(prev => prev ? prev + ' Failed to load admins.' : 'Failed to load admins.');
        if (mentorsRes.status === 'fulfilled') setMentors(mentorsRes.value.data || []);
        if (adminMetaRes.status === 'fulfilled') {
          const map = {};
          (adminMetaRes.value.data || []).forEach((a) => {
            map[String(a.email || '').toLowerCase()] = a;
          });
          setAdminMetaByEmail(map);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshData = async () => {
    const [studentsRes, adminsRes, adminMetaRes] = await Promise.allSettled([
      apiClient.get('/api/superadmin/students-with-profiles'),
      apiClient.get('/api/superadmin/mentors-with-students'),
      apiClient.get('/api/superadmin/admins')
    ]);
    if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.data);
    if (adminsRes.status === 'fulfilled') setAdmins(adminsRes.value.data);
    if (adminMetaRes.status === 'fulfilled') {
      const map = {};
      (adminMetaRes.value.data || []).forEach((a) => {
        map[String(a.email || '').toLowerCase()] = a;
      });
      setAdminMetaByEmail(map);
    }
  };

  const handleAssignMentor = async (studentId) => {
    const mentorId = mentorSelection[studentId];
    if (!mentorId) {
      alert('Please select a mentor first.');
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.post('/api/superadmin/assign-students', { mentorId, studentIds: [studentId] });
      await refreshData();
      alert('Mentor assigned successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to assign mentor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Delete this student account?')) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/api/admin/users/${studentId}`);
      await refreshData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDeleteStudents = async () => {
    if (selectedStudentIds.length === 0) {
      alert('Select at least one student first.');
      return;
    }

    if (!window.confirm(`Delete ${selectedStudentIds.length} selected student account(s)?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await apiClient.post('/api/admin/users/bulk-delete', { userIds: selectedStudentIds });
      await refreshData();
      setSelectedStudentIds([]);
      alert('Selected students deleted successfully.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete selected students');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminEmail) => {
    const meta = adminMetaByEmail[String(adminEmail || '').toLowerCase()];
    if (!meta?._id) {
      alert('Cannot delete this admin because metadata record was not found.');
      return;
    }
    if (!window.confirm('Delete this admin? Assigned students will become unassigned.')) return;
    setActionLoading(true);
    try {
      await apiClient.delete(`/api/superadmin/admins/${meta._id}`);
      await refreshData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete admin');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchYear = activeYear === 'all' || s.username?.startsWith(activeYear);
    const q = studentSearch.toLowerCase();
    const matchSearch = !q ||
      s.username?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.profile?.name?.toLowerCase().includes(q) ||
      s.profile?.regdNo?.toLowerCase().includes(q);
    return matchYear && matchSearch;
  });

  const filteredAdmins = admins.filter(a => {
    const q = adminSearch.toLowerCase();
    return !q ||
      a.username?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q);
  });

  const paginatedStudents = filteredStudents.slice(
    studentPage * studentRowsPerPage,
    studentPage * studentRowsPerPage + studentRowsPerPage
  );

  const selectedFilteredCount = filteredStudents.filter((s) => selectedStudentIds.includes(s._id)).length;
  const allFilteredSelected = filteredStudents.length > 0 && selectedFilteredCount === filteredStudents.length;
  const someFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected;
  const paginatedAdmins = filteredAdmins.slice(
    adminPage * adminRowsPerPage,
    adminPage * adminRowsPerPage + adminRowsPerPage
  );

  useEffect(() => {
    setStudentPage(0);
  }, [studentSearch, activeYear]);

  useEffect(() => {
    const visibleIds = new Set(filteredStudents.map((s) => s._id));
    setSelectedStudentIds((prev) => prev.filter((id) => visibleIds.has(id)));
  }, [filteredStudents]);

  useEffect(() => {
    setAdminPage(0);
  }, [adminSearch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">People Overview</Typography>
        <Button variant="outlined" onClick={() => navigate('/superadmin/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary">
          <Tab label={`Students (${students.length})`} />
          <Tab label={`Admins / Mentors (${admins.length})`} />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by name, roll no, email..."
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              sx={{ minWidth: 280 }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[['all', 'All Years'], ['325', '1st Year'], ['324', '2nd Year'], ['323', '3rd Year'], ['322', '4th Year']].map(([y, label]) => (
                <Button
                  key={y}
                  size="small"
                  variant={activeYear === y ? 'contained' : 'outlined'}
                  onClick={() => setActiveYear(y)}
                >
                  {label}
                </Button>
              ))}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Showing {filteredStudents.length} of {students.length} students
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={handleBulkDeleteStudents}
              disabled={actionLoading || selectedStudentIds.length === 0}
            >
              Delete Selected ({selectedStudentIds.length})
            </Button>
            <Typography variant="caption" color="error.main">
              Select rows from the first column to bulk delete.
            </Typography>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white' }}>
                    <Checkbox
                      size="small"
                      checked={allFilteredSelected}
                      indeterminate={someFilteredSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const idsToAdd = filteredStudents.map((s) => s._id);
                          setSelectedStudentIds((prev) => [...new Set([...prev, ...idsToAdd])]);
                        } else {
                          const idsToRemove = new Set(filteredStudents.map((s) => s._id));
                          setSelectedStudentIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
                        }
                      }}
                      sx={{ color: '#fff', '&.Mui-checked': { color: '#fff' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Roll No.</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Name</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Email</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Assigned Mentor</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Profile Status</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedStudents.map(s => (
                  <TableRow key={s._id} hover>
                    <TableCell>
                      <Checkbox
                        size="small"
                        checked={selectedStudentIds.includes(s._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds((prev) => [...new Set([...prev, s._id])]);
                          } else {
                            setSelectedStudentIds((prev) => prev.filter((id) => id !== s._id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>{s.username}</TableCell>
                    <TableCell>{s.profile?.name || <em style={{ color: '#999' }}>No profile</em>}</TableCell>
                    <TableCell>{s.email}</TableCell>
                    <TableCell>
                      {s.assignedMentor
                        ? <Chip label={s.assignedMentor.username} size="small" color="primary" variant="outlined" />
                        : <Chip label="Unassigned" size="small" color="warning" variant="outlined" />}
                    </TableCell>
                    <TableCell>
                      {s.profile
                        ? <Chip label="Created" size="small" color="success" />
                        : <Chip label="Pending" size="small" color="default" />}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                          select
                          size="small"
                          value={mentorSelection[s._id] || ''}
                          onChange={(e) => setMentorSelection(prev => ({ ...prev, [s._id]: e.target.value }))}
                          sx={{ minWidth: 160 }}
                        >
                          <MenuItem value="">Select mentor</MenuItem>
                          {mentors.map((m) => (
                            <MenuItem key={m._id} value={m._id}>{m.username}</MenuItem>
                          ))}
                        </TextField>
                        <Button size="small" variant="outlined" onClick={() => handleAssignMentor(s._id)} disabled={actionLoading}>
                          Assign Mentor
                        </Button>
                        <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteStudent(s._id)} disabled={actionLoading}>
                          Delete
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No students found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredStudents.length}
              page={studentPage}
              onPageChange={(_, newPage) => setStudentPage(newPage)}
              rowsPerPage={studentRowsPerPage}
              onRowsPerPageChange={(e) => {
                setStudentRowsPerPage(parseInt(e.target.value, 10));
                setStudentPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </TableContainer>
        </Paper>
      )}

      {tab === 1 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search by name or email..."
              value={adminSearch}
              onChange={e => setAdminSearch(e.target.value)}
              sx={{ minWidth: 280 }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Showing {filteredAdmins.length} of {admins.length} admins
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'secondary.main' }}>
                  <TableCell sx={{ color: 'white' }}><b>Name</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Email</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Assigned Students</b></TableCell>
                  <TableCell sx={{ color: 'white' }}><b>Actions</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAdmins.map(a => (
                  <TableRow key={a._id} hover>
                    <TableCell>{a.username}</TableCell>
                    <TableCell>{a.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${a.assignedStudentsCount} student${a.assignedStudentsCount !== 1 ? 's' : ''}`}
                        size="small"
                        color={a.assignedStudentsCount > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteAdmin(a.email)} disabled={actionLoading}>
                        Delete Admin
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAdmins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No admins found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredAdmins.length}
              page={adminPage}
              onPageChange={(_, newPage) => setAdminPage(newPage)}
              rowsPerPage={adminRowsPerPage}
              onRowsPerPageChange={(e) => {
                setAdminRowsPerPage(parseInt(e.target.value, 10));
                setAdminPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default PeopleOverview;
