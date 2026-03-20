import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Paper, Typography, Button, Grid, Avatar, Divider, Card, CardContent } from '@mui/material';
import apiClient from '../apiClient';

const UserPanel = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    name: '',
    email: '',
    profilePicture: '',
    role: '',
    profileCompletion: 0,
    assignedMentor: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const authToken = localStorage.getItem('authToken');
      const userRole = localStorage.getItem('userRole');

      if (!authToken || userRole !== 'user') {
        navigate('/signup');
        return;
      }

      try {
        const response = await apiClient.get('/api/auth/user', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        let displayName = response.data.username || 'User';
        let profilePicture = '';

        try {
          const profileResponse = await apiClient.get('/api/profile', {
            headers: { Authorization: `Bearer ${authToken}` },
          });

          if (profileResponse.data.success && profileResponse.data.profile) {
            if (profileResponse.data.profile.name) {
              displayName = profileResponse.data.profile.name;
            }
            if (profileResponse.data.profile.profilePicture) {
              profilePicture = profileResponse.data.profile.profilePicture;
            }
          }
        } catch (profileError) {
          console.log('No profile found');
        }

        setUser({
          name: displayName,
          email: response.data.email || 'Not Available',
          profilePicture: profilePicture,
          role: 'user',
          profileCompletion: response.data.profileCompletion || 0,
          assignedMentor: response.data.assignedMentor
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        if (error.response?.status === 401) {
          navigate('/signup');
        }
      }
    };

    fetchUserDetails();
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
      <Paper sx={{ padding: '30px', marginBottom: '30px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Avatar
              src={user.profilePicture}
              sx={{ width: 80, height: 80, border: '3px solid white' }}
            />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {user.name}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                {user.email}
              </Typography>
              <Typography variant="h6" sx={{ marginTop: '8px', fontWeight: 'bold' }}>
                👤 User Panel
              </Typography>
            </Box>
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

      {/* Profile Stats */}
      <Grid container spacing={2} sx={{ marginBottom: '30px' }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Profile Completion
              </Typography>
              <Typography variant="h5">
                {user.profileCompletion}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Role Type
              </Typography>
              <Typography variant="h5">
                Student
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        {user.assignedMentor && (
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Assigned Mentor
                </Typography>
                <Typography variant="body2">
                  {user.assignedMentor.username}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Divider sx={{ marginBottom: '40px' }} />

      {/* Features Section */}
      <Typography variant="h5" sx={{ marginBottom: '20px', fontWeight: 'bold' }}>
        Quick Access
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/profile')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>📚</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              My Profile
            </Typography>
            <Typography variant="body2">
              View and edit your profile information
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
            onClick={() => navigate('/attendance')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>✅</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Attendance
            </Typography>
            <Typography variant="body2">
              Track your attendance records
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
            onClick={() => navigate('/semester')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>📝</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Semester Marks
            </Typography>
            <Typography variant="body2">
              View your semester marks and grades
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
            onClick={() => navigate('/mentorgrade')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>⭐</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Mentor Grading
            </Typography>
            <Typography variant="body2">
              View mentor evaluations
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
              background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
              color: 'white'
            }}
            onClick={() => navigate('/counseling-forms')}
          >
              <span style={{ fontSize: 40, marginBottom: '10px' }}>📄</span>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Counseling Forms
            </Typography>
            <Typography variant="body2">
              Download your counseling form data
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserPanel;
