import React, { useState } from 'react';
import apiClient from '../apiClient';
import { 
  Container, Typography, TextField, Button, Alert, Paper, 
  Box, CircularProgress 
} from '@mui/material';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      await apiClient.post('/api/auth/forgot-password', { email });
      
      setSuccess(true);
      setMessage('A password reset link has been sent to your email');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box my={5}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h4" component="h1" gutterBottom textAlign="center">
            Reset Password
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {message && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {message}
            </Alert>
          )}
          
          {!success ? (
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Typography variant="body1" paragraph>
                Enter your email address and we'll send you a link to reset your password.
              </Typography>
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
              </Button>
              
              <Box textAlign="center" mt={2}>
                <Typography variant="body2">
                  <Link to="/signup" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 500 }}>
                    ← Back to Sign In
                  </Link>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box textAlign="center" mt={2}>
              <Typography variant="body2">
                <Link to="/signup" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: 500 }}>
                  ← Back to Sign In
                </Link>
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPassword;