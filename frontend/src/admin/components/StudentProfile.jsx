import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import {
  Box, Typography, Paper, Grid, Avatar, Divider, CircularProgress, Alert, Button
} from '@mui/material';

function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const token = localStorage.getItem('authToken');

      if (!token) {
        navigate('/signup');
        return;
      }

      try {
        // Fetch user details by ID
        const userResponse = await apiClient.get(`/api/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const userData = userResponse.data;

        // Check if user has role "user"
        if (userData.role !== 'user') {
          setError('Access denied. This page is only for viewing student profiles.');
          setLoading(false);
          return;
        }

        setUser(userData);

        // Fetch all profiles and find the one for this user
        const profilesResponse = await apiClient.get('/api/admin/profiles', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const userProfile = profilesResponse.data.find(p => p.userId === id);
        setProfile(userProfile);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load user details. Please try again.');
        setLoading(false);
      }
    };

    fetchUserAndProfile();
  }, [id, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
        <Alert severity="error" sx={{ marginBottom: '20px' }}>
          {error}
        </Alert>
        <Typography variant="body1">
          You can only view profiles of users with the "user" role.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/superadmin/students')}
          sx={{ marginTop: '20px' }}
        >
          Back to Students List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Typography variant="h4">Student Profile</Typography>
        <Button variant="outlined" onClick={() => navigate('/superadmin/students')}>
          Back to Students List
        </Button>
      </Box>

      {!profile ? (
        <Alert severity="info">
          This student hasn't completed their profile yet.
        </Alert>
      ) : (
        <Paper sx={{ padding: '20px' }}>
          {/* Basic Information */}
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Name:</strong> {profile.name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Registration No:</strong> {profile.regdNo}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Email:</strong> {profile.email}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Mobile:</strong> {profile.mobileNumber}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Department:</strong> {profile.department}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Admission Type:</strong> {profile.admissionType}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ marginY: '20px' }} />

          {/* Personal Information */}
          <Typography variant="h6" gutterBottom>Personal Information</Typography>
          <Grid container spacing={2} sx={{ marginBottom: '20px' }}>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Date of Birth:</strong> {profile.dob}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Blood Group:</strong> {profile.bloodGroup}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Caste:</strong> {profile.caste}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Rank:</strong> {profile.rank}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ marginY: '20px' }} />

          {/* Academic Information */}
          <Typography variant="h6" gutterBottom>Academic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography><strong>10th Marks:</strong> {profile.tenthMarks?.obtained}/{profile.tenthMarks?.max} ({profile.tenthMarks?.percentage}%)</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography><strong>Inter/Diploma Marks:</strong> {profile.interDiplomaMarks?.obtained}/{profile.interDiplomaMarks?.max} ({profile.interDiplomaMarks?.percentage}%)</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default StudentProfile;
