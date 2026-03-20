import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Button, Grid, Divider, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const PrincipalPanel = () => {
  const navigate = useNavigate();
  const [principalInfo, setPrincipalInfo] = useState({
    name: '',
    email: '',
    role: '',
    department: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrincipalInfo = async () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      if (!token || userRole !== 'principal') {
        navigate('/signup');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      try {
        const userResponse = await apiClient.get('/api/auth/user', config);

        setPrincipalInfo({
          name: userResponse.data.username,
          email: userResponse.data.email,
          role: 'principal',
          department: userResponse.data.department || 'Main Campus'
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching principal info:', err);
        navigate('/signup');
      }
    };

    fetchPrincipalInfo();
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
      <Paper sx={{ padding: '30px', marginBottom: '30px', background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {principalInfo.name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {principalInfo.email}
            </Typography>
            {principalInfo.department && (
              <Typography variant="body2" sx={{ opacity: 0.85, marginTop: '8px' }}>
                Institution: {principalInfo.department}
              </Typography>
            )}
            <Typography variant="h6" sx={{ marginTop: '12px', fontWeight: 'bold' }}>
              📚 Principal Panel
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
                Principal
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Institution
              </Typography>
              <Typography variant="h5">
                {principalInfo.department || 'N/A'}
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
        Principal Features
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
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/principal/dashboard?section=departments')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🏙</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Departments
            </Typography>
            <Typography variant="body2">
              Manage all departments
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
              background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/principal/dashboard?section=superadmins')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🧭</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Manage Super Admin
            </Typography>
            <Typography variant="body2">
              CRUD and assign super admin to departments
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
              background: 'linear-gradient(135deg, #7cb342 0%, #689f38 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/principal/dashboard?section=admins')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>👤</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Manage Admin
            </Typography>
            <Typography variant="body2">
              CRUD admins and assign to super admin
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
              background: 'linear-gradient(135deg, #9ccc65 0%, #8bc34a 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/principal/dashboard?section=students')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>👥</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Manage Student
            </Typography>
            <Typography variant="body2">
              Assign students to admins
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
              background: 'linear-gradient(135deg, #aed581 0%, #9ccc65 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/principal/dashboard?section=counseling')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>📄</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Counseling Form
            </Typography>
            <Typography variant="body2">
              View 1st to 4th year student counseling forms
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
              background: 'linear-gradient(135deg, #c0ca33 0%, #afb42b 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/principal/dashboard?section=analytics')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>📈</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Analytics
            </Typography>
            <Typography variant="body2">
              Role analytics with notify actions
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
            onClick={() => navigate('/all-batches')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🧮</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              All Batches
            </Typography>
            <Typography variant="body2">
              View previous and active batch counseling forms
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
              background: 'linear-gradient(135deg, #ff6f00 0%, #e65100 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/attendance')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>📊</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Attendance Reports
            </Typography>
            <Typography variant="body2">
              View semester-wise student attendance
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PrincipalPanel;
