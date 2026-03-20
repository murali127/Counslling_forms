import React, { useEffect, useState } from 'react';
import { Box, Container, Paper, Typography, Button, Grid, Divider, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const MasterPanel = () => {
  const navigate = useNavigate();
  const [masterInfo, setMasterInfo] = useState({
    name: '',
    email: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMasterInfo = async () => {
      const token = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      if (!token || userRole !== 'master') {
        navigate('/signup');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      try {
        const userResponse = await apiClient.get('/api/auth/user', config);

        setMasterInfo({
          name: userResponse.data.username,
          email: userResponse.data.email,
          role: 'master'
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching master info:', err);
        navigate('/signup');
      }
    };

    fetchMasterInfo();
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
      <Paper sx={{ padding: '30px', marginBottom: '30px', background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
              {masterInfo.name}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              {masterInfo.email}
            </Typography>
            <Typography variant="h6" sx={{ marginTop: '12px', fontWeight: 'bold' }}>
              ⚙️ Master Panel
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
                Master
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Level
              </Typography>
              <Typography variant="h5">
                System Admin
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
        Master Administration Features
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
              background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/master/manage?section=manage')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🏙</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Manage Departments
            </Typography>
            <Typography variant="body2">
              Create and manage all departments
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
              background: 'linear-gradient(135deg, #283593 0%, #1a237e 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/master/manage?section=create')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🔐</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Create
            </Typography>
            <Typography variant="body2">
              Create user, principal, admin and super admin
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
              background: 'linear-gradient(135deg, #3949ab 0%, #283593 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/master/manage?section=assign')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>👥</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Assign
            </Typography>
            <Typography variant="body2">
              Assignment CRUD between roles
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
              background: 'linear-gradient(135deg, #512da8 0., #3949ab 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/master/manage?section=analytics')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>📈</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Analytics
            </Typography>
            <Typography variant="body2">
              Role-wise profile analytics and notify actions
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
              background: 'linear-gradient(135deg, #673ab7 0%, #512da8 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/master/manage?section=panel')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>🧭</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Panel View
            </Typography>
            <Typography variant="body2">
              Open selected role panel view
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
              background: 'linear-gradient(135deg, #7e57c2 0%, #673ab7 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/master/manage?section=counseling')}
          >
            <span style={{ fontSize: 40, marginBottom: '10px' }}>📄</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Counseling Forms
            </Typography>
            <Typography variant="body2">
              Open existing counseling form records
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
              View students by batch and open forms
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
              View semester-wise attendance reports
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MasterPanel;
