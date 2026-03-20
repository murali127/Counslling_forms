import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import { Box, Container, Paper, Typography, Button, Grid, Divider, Card, CardContent } from '@mui/material';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    superadminName: '',
    superadminEmail: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      if (!token || userRole !== 'admin') {
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

        setAdminInfo(prev => ({
          ...prev,
          name: userResponse.data.username,
          email: userResponse.data.email,
          role: userResponse.data.role,
          department: departmentName,
          departmentId: userResponse.data.departmentId
        }));

        if (userResponse.data.role === 'admin' && userResponse.data.departmentId) {
          try {
            const superadminResponse = await apiClient.get(
              `/api/superadmin/get-superadmin/${userResponse.data.departmentId}`,
              config
            );

            if (superadminResponse.data) {
              setAdminInfo(prev => ({
                ...prev,
                superadminName: superadminResponse.data.username || superadminResponse.data.email,
                superadminEmail: superadminResponse.data.email
              }));
            }
          } catch (err) {
            console.log('No superadmin found for this department');
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin info:', err);
        navigate('/signup');
      }
    };

    fetchAdminInfo();
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
      <Paper sx={{ padding: '30px', marginBottom: '30px', background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {adminInfo.name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {adminInfo.email}
            </Typography>
            {adminInfo.department && (
              <Typography variant="body2" sx={{ opacity: 0.85, marginTop: '8px' }}>
                Department: {adminInfo.department}
              </Typography>
            )}
            <Typography variant="h6" sx={{ marginTop: '12px', fontWeight: 'bold' }}>
              👤 Admin Panel
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
              <Typography variant="h5" sx={{ textTransform: 'capitalize' }}>
                {adminInfo.role}
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
                {adminInfo.department || 'N/A'}
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
        Admin Features
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
              background: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/counseling-forms')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>👥</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Student Data
            </Typography>
            <Typography variant="body2">
              View and manage student information
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
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/semester')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>📝</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Semester Marks
            </Typography>
            <Typography variant="body2">
              Edit student semester marks
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
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/mentorgrade')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>⭐</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Mentor Grading
            </Typography>
            <Typography variant="body2">
              Manage student mentor grades
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
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/attendance')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>✅</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Attendance
            </Typography>
            <Typography variant="body2">
              Manage student attendance records
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
            onClick={() => navigate('/admin/access-window')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>🔒</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Access Control
            </Typography>
            <Typography variant="body2">
              Configure student login window
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
            onClick={() => navigate('/admin/data-overview')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>📋</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Counseling Forms
            </Typography>
            <Typography variant="body2">
              Download counseling forms for assigned students
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminPanel;
