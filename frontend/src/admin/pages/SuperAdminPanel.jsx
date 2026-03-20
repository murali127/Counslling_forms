import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Button, Grid, Divider, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const SuperAdminPanel = () => {
  const navigate = useNavigate();
  const [superAdminInfo, setSuperAdminInfo] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });
  const [loading, setLoading] = useState(true);

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [revertLoading, setRevertLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusSeverity, setStatusSeverity] = useState('success');
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    const fetchSuperAdminInfo = async () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      if (!token || userRole !== 'superadmin') {
        navigate('/signup');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      try {
        const userResponse = await apiClient.get('/api/auth/user', config);

        let departmentName = '';

        if (userResponse.data.departmentId) {
          try {
            const deptResponse = await apiClient.get(
              `/api/principal/departments/${userResponse.data.departmentId}`,
              config
            );
            if (deptResponse.data && deptResponse.data.name) {
              departmentName = deptResponse.data.name;
            }
          } catch (deptErr) {
            console.log('Could not fetch department details');
          }
        }

        setSuperAdminInfo({
          name: userResponse.data.username,
          email: userResponse.data.email,
          role: 'superadmin',
          department: departmentName
        });

        const fetchStudents = async () => {
          try {
            const usersRes = await apiClient.get('/api/admin/users?role=user', config);
            const studentsList = Array.isArray(usersRes.data) ? usersRes.data : [];
            const transformed = studentsList.map((s) => ({
              _id: s._id,
              regdNo: s.username,
              name: s.name || s.username,
              yearOfStudy: Number(s.yearOfStudy) || 1,
              relieved: Boolean(s.relieved)
            }));
            setAllStudents(transformed);

            if (!localStorage.getItem('shiftedStudentsSnapshot')) {
              localStorage.setItem('shiftedStudentsSnapshot', JSON.stringify(transformed));
            }
          } catch (fetchErr) {
            console.warn('[SuperAdminPanel] could not fetch user list:', fetchErr);
          }
        };

        fetchStudents();

        setLoading(false);
      } catch (err) {
        console.error('Error fetching superadmin info:', err);
        navigate('/signup');
      }
    };

    fetchSuperAdminInfo();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.clear();
    sessionStorage.clear();
    navigate('/signup');
  };

  const resetStatus = () => {
    setStatusMessage('');
    setStatusSeverity('success');
  };

  const shiftYears = async () => {
    if (shiftLoading || revertLoading) return;
    setShiftLoading(true);
    setStatusMessage('');

    try {
      const token = localStorage.getItem('authToken');
      const resp = await apiClient.post('/api/superadmin/shift-years', null, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusMessage(`Shift completed: ${resp.data.promoted || 0} promoted, ${resp.data.relieved || 0} relieved.`);
      setStatusSeverity('success');

      // refresh students list
      const studentsResp = await apiClient.get('/api/admin/all-batches-students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllStudents(studentsResp.data || []);
    } catch (err) {
      console.error('Shift Years error', err);
      setStatusMessage(err.response?.data?.error || 'Failed to shift years.');
      setStatusSeverity('error');
    } finally {
      setShiftLoading(false);
    }
  };

  const revertShiftYears = async () => {
    if (shiftLoading || revertLoading) return;
    setRevertLoading(true);
    setStatusMessage('');

    try {
      const token = localStorage.getItem('authToken');
      const resp = await apiClient.post('/api/superadmin/revert-shift-years', null, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatusMessage(`Revert completed: ${resp.data.reverted || 0} students restored.`);
      setStatusSeverity('success');
      localStorage.removeItem('superadminLastShiftSnapshot');

      const studentsResp = await apiClient.get('/api/admin/all-batches-students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllStudents(studentsResp.data || []);
    } catch (err) {
      console.error('Revert Years error', err);
      setStatusMessage(err.response?.data?.error || 'Failed to revert shift.');
      setStatusSeverity('error');
    } finally {
      setRevertLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ padding: '40px 20px', textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ padding: '40px 20px' }}>
      {/* Header Section */}
      <Paper sx={{ padding: '30px', marginBottom: '30px', background: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {superAdminInfo.name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {superAdminInfo.email}
            </Typography>
            {superAdminInfo.department && (
              <Typography variant="body2" sx={{ opacity: 0.85, marginTop: '8px' }}>
                Department: {superAdminInfo.department}
              </Typography>
            )}
            <Typography variant="h6" sx={{ marginTop: '12px', fontWeight: 'bold' }}>
              🤖 Super Admin Panel
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            size="large"

            onClick={handleLogout}
            sx={{ padding: '12px 24px' }}
          >
            Log Out
          </Button>
        </Box>
      </Paper>

      {/* Info Cards */}
      <Grid container spacing={2} sx={{ marginBottom: '30px' }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Role
              </Typography>
              <Typography variant="h5">
                Super Admin
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Department
              </Typography>
              <Typography variant="h5">
                {superAdminInfo.department || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Account Status
              </Typography>
              <Typography variant="h5" sx={{ color: '#4caf50' }}>
                Active
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ marginBottom: '40px' }} />

      {/* Features Section */}
      <Typography variant="h5" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Super Admin Features
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/superadmin/admins')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>👤</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Manage Admins
            </Typography>
            <Typography variant="body2">
              CRUD admin accounts and optional student assignment
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/superadmin/students')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>👥</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Manage Students
            </Typography>
            <Typography variant="body2">
              CRUD students and assign students to admins
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/superadmin/allocation')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>✅</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Mentor Allocation
            </Typography>
            <Typography variant="body2">
              Manual and random student allocation to admins
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/superadmin/reports')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>📈</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Reports
            </Typography>
            <Typography variant="body2">
              Profile reports with attendance report access
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/counseling-forms')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>📄</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Counseling Forms
            </Typography>
            <Typography variant="body2">
              Open counseling forms data page
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/all-batches')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🧮</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              All Batches
            </Typography>
            <Typography variant="body2">
              View batch-wise student data from DB
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #4f7aeb 0%, #7c3bdb 100%)',
              color: 'white'
            }}
            onClick={() => setShiftModalOpen(true)}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🔁</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Shift Years
            </Typography>
            <Typography variant="body2">
              Promote students next year and mark final year relieved
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              padding: '30px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': { boxShadow: 5, transform: 'translateY(-5px)' },
              background: 'linear-gradient(135deg, #26a69a 0%, #00897b 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/mentorgrade')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>⭐</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Admin Panel
            </Typography>
            <Typography variant="body2">
              Mentor grading page
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={shiftModalOpen} onClose={() => setShiftModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Shift Years</DialogTitle>
        <DialogContent>
          {statusMessage && (
            <Alert severity={statusSeverity} sx={{ mb: 2 }} onClose={resetStatus}>{statusMessage}</Alert>
          )}

          <Typography sx={{ mb: 2 }}>
            This action moves:
            <br />
            • 1st → 2nd year
            <br />
            • 2nd → 3rd year
            <br />
            • 3rd → 4th year
            <br />
            • 4th → relieved (kept as record)
          </Typography>

          <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
            Current totals
          </Typography>
          <Typography variant="body2">Active students: {allStudents.filter((s) => !s.relieved).length}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>Relieved students: {allStudents.filter((s) => s.relieved).length}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShiftModalOpen(false)} disabled={shiftLoading || revertLoading}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (window.confirm('Revert will restore the previous year values and relieve status. Continue?')) {
                revertShiftYears();
              }
            }}
            disabled={revertLoading || shiftLoading}
          >
            {revertLoading ? <CircularProgress size={20} /> : 'Revert Back'}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (window.confirm('Shift years for all students as per rules?')) {
                shiftYears();
              }
            }}
            disabled={shiftLoading || revertLoading}
          >
            {shiftLoading ? <CircularProgress size={20} /> : 'Shift Years'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SuperAdminPanel;
