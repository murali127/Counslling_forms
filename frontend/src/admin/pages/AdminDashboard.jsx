import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState({
    name: '',
    role: '',
    department: '',
    superadminName: '',
    superadminEmail: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/signup');
        return;
      }
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      try {
        // Get admin's own info
        const userResponse = await apiClient.get('/api/auth/user', config);
        
        if (userResponse.data.role !== 'admin' && userResponse.data.role !== 'superadmin') {
          navigate('/dashboard');
          return;
        }

        let departmentName = '';
        
        // Fetch department name using departmentId
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
          role: userResponse.data.role,
          department: departmentName,
          departmentId: userResponse.data.departmentId
        }));

        // If admin, fetch their superadmin info
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
        navigate('/dashboard');
      }
    };
    
    fetchAdminInfo();
  }, [navigate]);

  if (loading) {
    return <Box sx={{ padding: '20px', textAlign: 'center' }}>Loading...</Box>;
  }

  return (
    <Box sx={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {/* Admin Info Card */}
      <Paper sx={{ padding: '20px', marginBottom: '30px', backgroundColor: 'rgba(71,85,105,0.18)' }}>
        <Typography variant="h6" gutterBottom>
          Your Information
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
          <Box>
            <Typography variant="body2" color="textSecondary">Admin Name</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{adminInfo.name}</Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="textSecondary">Role</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
              {adminInfo.role}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="textSecondary">Department</Typography>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{adminInfo.department || 'N/A'}</Typography>
          </Box>

          {adminInfo.role === 'admin' && adminInfo.superadminName && (
            <>
              <Box>
                <Typography variant="body2" color="textSecondary">Your Superadmin</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#818cf8' }}>
                  {adminInfo.superadminName}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="textSecondary">Superadmin Email</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.55)' }}>
                  {adminInfo.superadminEmail}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Paper>
      
      {/* Action Buttons */}
      <Paper sx={{ padding: '40px', textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Choose an action:
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
          <Button 
            variant="contained" 
            size="large" 
            onClick={() => navigate('/admin/users')}
            sx={{ padding: '15px' }}
          >
            Manage Students
          </Button>

          <Button
            variant="contained"
            size="large"
            color="secondary"
            onClick={() => navigate('/admin/access-window')}
            sx={{ padding: '15px' }}
          >
            Configure Student Login Window
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/mentorgrade')}
            sx={{ padding: '15px' }}
          >
            Mentor Grading
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/semester')}
            sx={{ padding: '15px' }}
          >
            Semester Marks
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/attendance')}
            sx={{ padding: '15px' }}
          >
            Attendance
          </Button>
          
          <Button 
            variant="contained" 
            size="large" 
            onClick={() => navigate('/admin/data')}
            sx={{ padding: '15px' }}
          >
            View Data Overview
          </Button>
        </Box>
        
        <Box sx={{ marginTop: '40px' }}>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminDashboard;