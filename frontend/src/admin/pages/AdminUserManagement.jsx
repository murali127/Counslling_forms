import React, { useState, useEffect } from 'react';
import apiClient from '../../apiClient';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, CircularProgress,
  Alert, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, TextField, TablePagination, MenuItem, Checkbox
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminUserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [canRecalculate, setCanRecalculate] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newYearOfStudy, setNewYearOfStudy] = useState('');
  const [smartStartRoll, setSmartStartRoll] = useState('');
  const [smartEndRoll, setSmartEndRoll] = useState('');
  const [smartDomain, setSmartDomain] = useState('gvpce.ac.in');
  const [smartYearOfStudy, setSmartYearOfStudy] = useState('');
  const [smartCreateLoading, setSmartCreateLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [activeYear, setActiveYear] = useState('1');
  const [rollSearch, setRollSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [recalculateLoading, setRecalculateLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  const deriveYearOfStudy = (rollNumber, allUsers) => {
    const prefix = String(rollNumber || '').slice(0, 3);
    if (!/^\d{3}$/.test(prefix)) return null;

    const prefixes = [...new Set(
      allUsers
        .map((u) => String(u.username || '').slice(0, 3))
        .filter((p) => /^\d{3}$/.test(p))
    )].sort((a, b) => Number(b) - Number(a));

    const idx = prefixes.indexOf(prefix);
    return idx >= 0 ? idx + 1 : null;
  };

  // Fetch users data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        navigate('/signup');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      try {
        // Check if user is admin
        const userResponse = await apiClient.get('/api/auth/user', config);
        const role = userResponse.data.role;
        setCanRecalculate(['superadmin', 'principal', 'master'].includes(role));
        if (!['admin', 'superadmin', 'principal', 'master'].includes(userResponse.data.role)) {
          setError('You do not have admin privileges');
          navigate('/dashboard');
          return;
        }

        // Fetch users with role "user" only
        const usersRes = await apiClient.get('/api/admin/users?role=user', config);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Error fetching users data:', err);
        setError('Failed to fetch data. Please try again.');

        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleOpenAddDialog = () => {
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
    setNewUsername('');
    setNewEmail('');
    setNewYearOfStudy('');
  };

  const handleAddStudent = async () => {
    if (!newUsername.trim()) {
      setError('Roll number is required');
      return;
    }

    const token = localStorage.getItem('authToken');
    setAddLoading(true);

    try {
      await apiClient.post(
        '/api/admin/users',
        {
          username: newUsername,
          email: newEmail || undefined,
          yearOfStudy: newYearOfStudy || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh users list (only users with role "user")
      const usersRes = await apiClient.get('/api/admin/users?role=user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersRes.data);

      handleCloseAddDialog();
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Error adding student:', err);
      setError(err.response?.data?.error || 'Failed to add student. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleSmartCreate = async () => {
    if (!smartStartRoll.trim() || !smartEndRoll.trim()) {
      setError('Please provide start and end roll numbers for smart create');
      return;
    }

    const token = localStorage.getItem('authToken');
    setSmartCreateLoading(true);

    try {
      const res = await apiClient.post(
        '/api/admin/users/smart-create',
        {
          startRollNumber: smartStartRoll,
          endRollNumber: smartEndRoll,
          emailDomain: smartDomain,
          yearOfStudy: smartYearOfStudy || undefined
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const usersRes = await apiClient.get('/api/admin/users?role=user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersRes.data);
      alert(res.data?.message || 'Smart create completed. Use Send Details manually when needed.');
      setError('');
      setActiveYear(smartYearOfStudy || 'all');
      setPage(0);
      setSmartStartRoll('');
      setSmartEndRoll('');
      setSmartYearOfStudy('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Smart create failed. Please try again.');
    } finally {
      setSmartCreateLoading(false);
    }
  };

  const handleBulkDeleteUsers = async () => {
    if (selectedUserIds.length === 0) {
      setError('Select at least one student to delete.');
      return;
    }

    if (!window.confirm(`Delete ${selectedUserIds.length} selected students?`)) {
      return;
    }

    const token = localStorage.getItem('authToken');
    try {
      await apiClient.post('/api/admin/users/bulk-delete',
        { userIds: selectedUserIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUsers((prev) => prev.filter((user) => !selectedUserIds.includes(user._id)));
      setSelectedUserIds([]);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete selected students.');
    }
  };

  const getFirstYearPrefix = () => {
    const prefixes = [...new Set(
      users
        .map((u) => String(u.username || '').slice(0, 3))
        .filter((p) => /^\d{3}$/.test(p))
    )].sort((a, b) => Number(b) - Number(a));

    return prefixes[0] || null;
  };

  const handleManualRecalculateYears = async () => {
    try {
      setRecalculateLoading(true);
      const token = localStorage.getItem('authToken');
      const recalcRes = await apiClient.post('/api/superadmin/students/recalculate-years', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const usersRes = await apiClient.get('/api/admin/users?role=user', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(usersRes.data);
      alert(recalcRes.data?.message || 'Years recalculated successfully');
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to recalculate years');
    } finally {
      setRecalculateLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete all associated data.')) {
      return;
    }

    const token = localStorage.getItem('authToken');

    try {
      await apiClient.delete(
        `/api/admin/users/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update users list
      setUsers(users.filter(user => user._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const computedYear = u.yearOfStudy || deriveYearOfStudy(u.username, users);
    const byYear = activeYear === 'all' || String(computedYear || '') === activeYear;
    const q = rollSearch.trim().toLowerCase();
    const bySearch = !q || u.username?.toLowerCase().includes(q);
    return byYear && bySearch;
  });
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const firstYearPrefix = getFirstYearPrefix();
  const selectedFilteredCount = filteredUsers.filter((u) => selectedUserIds.includes(u._id)).length;
  const allFilteredSelected = filteredUsers.length > 0 && selectedFilteredCount === filteredUsers.length;
  const someFilteredSelected = selectedFilteredCount > 0 && !allFilteredSelected;

  useEffect(() => {
    setPage(0);
  }, [activeYear, rollSearch]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <Typography variant="h4" align="center" gutterBottom>
        Manage Students
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: '20px' }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ marginBottom: '20px' }}>
        Auto year mode 1st year roll prefix: <strong>{firstYearPrefix || 'N/A'}</strong>. Students created with the Year dropdown stay in the selected year.
      </Alert>

      <Box sx={{ marginBottom: '20px' }}>
        <Button variant="contained" onClick={() => navigate('/admin')} sx={{ marginRight: '10px' }}>
          Back to Admin Dashboard
        </Button>
        <Button variant="outlined" onClick={() => navigate('/admin/data')} sx={{ marginRight: '10px' }}>
          View Data Overview
        </Button>
        <Button variant="contained" color="success" onClick={handleOpenAddDialog}>
          Add Student
        </Button>
        <Button
          variant="outlined"
          color="error"
          sx={{ marginLeft: '10px' }}
          disabled={selectedUserIds.length === 0}
          onClick={handleBulkDeleteUsers}
        >
          Delete Selected ({selectedUserIds.length})
        </Button>
        {canRecalculate && (
          <Button
            variant="contained"
            color="warning"
            sx={{ marginLeft: '10px' }}
            disabled={recalculateLoading}
            onClick={handleManualRecalculateYears}
          >
            {recalculateLoading ? 'Recalculating...' : 'Recalculate Years'}
          </Button>
        )}
      </Box>

      <Alert severity="warning" sx={{ marginBottom: '16px' }}>
        Multiple delete: tick the checkboxes in the first column, then click Delete Selected.
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Smart Create Students (Range)</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            id="smart-start-roll"
            name="smartStartRoll"
            size="small"
            label="Start Roll Number"
            value={smartStartRoll}
            onChange={(e) => setSmartStartRoll(e.target.value)}
            sx={{ width: 220 }}
            helperText="Example: 322103311001"
          />
          <TextField
            id="smart-end-roll"
            name="smartEndRoll"
            size="small"
            label="End Roll Number"
            value={smartEndRoll}
            onChange={(e) => setSmartEndRoll(e.target.value)}
            sx={{ width: 220 }}
          />
          <TextField
            id="smart-email-domain"
            name="smartEmailDomain"
            size="small"
            label="Email Domain"
            value={smartDomain}
            onChange={(e) => setSmartDomain(e.target.value)}
            sx={{ width: 180 }}
          />
          <TextField
            id="smart-year-of-study"
            name="smartYearOfStudy"
            select
            size="small"
            label="Year"
            value={smartYearOfStudy}
            onChange={(e) => setSmartYearOfStudy(e.target.value)}
            sx={{ width: 160 }}
            helperText="Pick 1-4 to set the year directly"
          >
            <MenuItem value="">Auto by roll prefix</MenuItem>
            <MenuItem value="1">1st Year</MenuItem>
            <MenuItem value="2">2nd Year</MenuItem>
            <MenuItem value="3">3rd Year</MenuItem>
            <MenuItem value="4">4th Year</MenuItem>
          </TextField>
          <Button variant="contained" onClick={handleSmartCreate} disabled={smartCreateLoading}>
            {smartCreateLoading ? 'Creating...' : 'Smart Create'}
          </Button>
        </Box>
      </Paper>

      <Box sx={{ marginBottom: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <Button variant={activeYear === 'all' ? 'contained' : 'outlined'} onClick={() => setActiveYear('all')}>All</Button>
        <Button variant={activeYear === '1' ? 'contained' : 'outlined'} onClick={() => setActiveYear('1')}>1st Year</Button>
        <Button variant={activeYear === '2' ? 'contained' : 'outlined'} onClick={() => setActiveYear('2')}>2nd Year</Button>
        <Button variant={activeYear === '3' ? 'contained' : 'outlined'} onClick={() => setActiveYear('3')}>3rd Year</Button>
        <Button variant={activeYear === '4' ? 'contained' : 'outlined'} onClick={() => setActiveYear('4')}>4th Year</Button>
      </Box>

      <Box sx={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
        <TextField
          id="student-roll-search"
          name="rollSearch"
          size="small"
          label="Search by Roll Number"
          value={rollSearch}
          onChange={(e) => setRollSearch(e.target.value)}
          sx={{ width: '320px' }}
        />
      </Box>

      <Paper sx={{ width: '100%' }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const idsToAdd = filteredUsers.map((u) => u._id);
                        setSelectedUserIds((prev) => [...new Set([...prev, ...idsToAdd])]);
                      } else {
                        const idsToRemove = new Set(filteredUsers.map((u) => u._id));
                        setSelectedUserIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
                      }
                    }}
                  />
                </TableCell>
                <TableCell><b>Username</b></TableCell>
                <TableCell><b>Email</b></TableCell>
                <TableCell><b>Year</b></TableCell>
                <TableCell><b>Profile Progress</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedUsers.map((user) => {
                const computedYear = user.yearOfStudy || deriveYearOfStudy(user.username, users);
                
                return (
                <TableRow key={user._id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUserIds.includes(user._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUserIds((prev) => [...new Set([...prev, user._id])]);
                        } else {
                          setSelectedUserIds((prev) => prev.filter((id) => id !== user._id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{computedYear ? `${computedYear}${computedYear === 1 ? 'st' : computedYear === 2 ? 'nd' : computedYear === 3 ? 'rd' : 'th'}` : '-'}</TableCell>
                  <TableCell>
                    {user.profileCompletion !== undefined ? `${user.profileCompletion}%` : '0%'}
                  </TableCell>
                  <TableCell>
                                          {!user.hasLoggedIn && (
                        <Button
                          variant="contained"
                          color="warning"
                          size="small"
                          sx={{ marginRight: '10px' }}
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('authToken');
                              await apiClient.post(`/api/admin/send-details/${user._id}`, {}, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              alert('Login details and activation link sent to ' + user.email);
                            } catch (err) {
                              alert('Failed to send details');
                            }
                          }}
                        >
                          Send Details
                        </Button>
                      )}
                      {user.profileCompletion < 100 && (
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        sx={{ marginRight: '10px' }}
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('authToken');
                            await apiClient.post(`/api/admin/notify-profile/${user._id}`, {}, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            alert('Notification sent to ' + user.email);
                          } catch (err) {
                            alert('Failed to send notification');
                          }
                        }}
                      >
                        Notify
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteUser(user._id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </TableContainer>
      </Paper>

      {/* Add Student Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog}>
        <DialogTitle>Add New Student</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details for the new student. Credentials are NOT emailed automatically. Use Send Details manually.
          </DialogContentText>
          <TextField
            id="new-student-roll-number"
            name="newUsername"
            autoFocus
            margin="dense"
            label="Roll Number"
            fullWidth
            variant="outlined"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            sx={{ marginTop: '20px' }}
            helperText="Use full roll format: 322103311001"
          />
          <TextField
            id="new-student-email"
            name="newEmail"
            margin="dense"
            label="Email (optional)"
            type="email"
            fullWidth
            variant="outlined"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <TextField
            id="new-student-year-of-study"
            name="newYearOfStudy"
            select
            margin="dense"
            label="Year"
            fullWidth
            variant="outlined"
            value={newYearOfStudy}
            onChange={(e) => setNewYearOfStudy(e.target.value)}
            helperText="Pick 1-4 to place the student directly in that year"
          >
            <MenuItem value="">Auto by roll prefix</MenuItem>
            <MenuItem value="1">1st Year</MenuItem>
            <MenuItem value="2">2nd Year</MenuItem>
            <MenuItem value="3">3rd Year</MenuItem>
            <MenuItem value="4">4th Year</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button
            onClick={handleAddStudent}
            color="primary"
            disabled={addLoading}
          >
            {addLoading ? 'Adding...' : 'Add Student'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUserManagement;