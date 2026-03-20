import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentAction = searchParams.get('action') || 'admins';

  const setAction = (action) => {
    setSearchParams({ action });
  };

  const renderActionContent = () => {
    if (currentAction === 'admins') {
      return (
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              color="primary"
              onClick={() => navigate('/superadmin/admins')}
              sx={{ padding: '14px' }}
            >
              Manage Admins
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              color="primary"
              onClick={() => navigate('/superadmin/admins/create')}
              sx={{ padding: '14px' }}
            >
              Create Admin
            </Button>
          </Grid>
        </Grid>
      );
    }

    if (currentAction === 'students') {
      return (
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={8}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              color="secondary"
              onClick={() => navigate('/superadmin/students')}
              sx={{ padding: '14px' }}
            >
              View Students
            </Button>
          </Grid>
        </Grid>
      );
    }

    if (currentAction === 'allocation') {
      return (
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={8}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              color="success"
              onClick={() => navigate('/superadmin/allocation')}
              sx={{ padding: '14px' }}
            >
              Mentor Allocation
            </Button>
          </Grid>
        </Grid>
      );
    }

    if (currentAction === 'reports') {
      return (
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={8}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ padding: '14px', backgroundColor: '#ef6c00', '&:hover': { backgroundColor: '#e65100' } }}
              onClick={() => navigate('/superadmin/reports')}
            >
              Overall Reports
            </Button>
          </Grid>
        </Grid>
      );
    }

    return (
      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} sm={8}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ padding: '14px', backgroundColor: '#0288d1', '&:hover': { backgroundColor: '#0277bd' } }}
            onClick={() => navigate('/superadmin/overview')}
          >
            People Overview
          </Button>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box sx={{ padding: '20px', maxWidth: '1000px', margin: 'auto', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Super Admin Dashboard
      </Typography>

      <Paper sx={{ padding: '40px', marginTop: '20px', borderRadius: '15px', boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          Super Admin Panel
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Choose one area and continue with focused actions.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 4 }}>
          <Button variant={currentAction === 'admins' ? 'contained' : 'outlined'} onClick={() => setAction('admins')}>
            Admins
          </Button>
          <Button variant={currentAction === 'students' ? 'contained' : 'outlined'} color="secondary" onClick={() => setAction('students')}>
            Students
          </Button>
          <Button variant={currentAction === 'allocation' ? 'contained' : 'outlined'} color="success" onClick={() => setAction('allocation')}>
            Allocation
          </Button>
          <Button variant={currentAction === 'reports' ? 'contained' : 'outlined'} sx={currentAction === 'reports' ? {} : { color: '#ef6c00', borderColor: '#ef6c00' }} onClick={() => setAction('reports')}>
            Reports
          </Button>
          <Button variant={currentAction === 'overview' ? 'contained' : 'outlined'} sx={currentAction === 'overview' ? { backgroundColor: '#0288d1' } : { color: '#0288d1', borderColor: '#0288d1' }} onClick={() => setAction('overview')}>
            Overview
          </Button>
        </Box>

        {renderActionContent()}

        <Box sx={{ marginTop: '40px' }}>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/superadmin-panel')}>
            Back to Super Admin Panel
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SuperAdminDashboard;
