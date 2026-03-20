import React from 'react';
import { Box, Typography, Button, Paper, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const actions = [
    { label: 'Manage Admins', path: '/superadmin/admins' },
    { label: 'Manage Students', path: '/superadmin/students' },
    { label: 'Mentor Allocation', path: '/superadmin/allocation' },
    { label: 'Reports', path: '/superadmin/reports' },
    { label: 'Counseling Forms', path: '/counseling-forms' },
    { label: 'All Batches', path: '/superadmin/batches' },
    { label: 'Admin Panel (Mentor Grading)', path: '/mentorgrade' }
  ];

  return (
    <Box sx={{ padding: '20px', maxWidth: '1200px', margin: 'auto', textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        Super Admin Dashboard
      </Typography>

      <Paper sx={{ padding: '40px', marginTop: '20px', borderRadius: '15px', boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom>
          Super Admin Control Panel
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Select one module. Each button opens a focused page with related data only.
        </Typography>

        <Grid container spacing={2}>
          {actions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.label}>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => navigate(action.path)}
                sx={{ padding: '14px' }}
              >
                {action.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ marginTop: '40px' }}>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')}>
            Back
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SuperAdminDashboard;
