import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [email, setEmail] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [deassignDialog, setDeassignDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [deassigning, setDeassigning] = useState(false);

  useEffect(() => {
    checkAccess();
    fetchDepartments();
  }, []);

  const checkAccess = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/signup');
      return;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const userResponse = await apiClient.get('/api/auth/user', config);
      if (userResponse.data.role !== 'principal') {
        navigate('/dashboard');
      }
    } catch (err) {
      navigate('/dashboard');
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await apiClient.get('/api/principal/departments', config);
      setDepartments(response.data);
    } catch (err) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSuperAdmin = (department) => {
    setSelectedDepartment(department);
    setEmail('');
    setAssignError('');
    setAssignDialog(true);
  };

  const handleAssignSubmit = async () => {
    if (!email.trim()) {
      setAssignError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAssignError('Invalid email format');
      return;
    }

    setAssigning(true);
    try {
      const token = localStorage.getItem('authToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await apiClient.post('/api/principal/assign-superadmin', {
        departmentId: selectedDepartment._id,
        email
      }, config);

      setAssignDialog(false);
      fetchDepartments(); // Refresh the list
      alert('Super Admin assigned successfully');
    } catch (err) {
      setAssignError(err.response?.data?.error || 'Failed to assign Super Admin');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeassignSuperAdmin = (admin) => {
    setSelectedAdmin(admin);
    setDeassignDialog(true);
  };

  const handleDeassignConfirm = async () => {
    setDeassigning(true);
    try {
      const token = localStorage.getItem('authToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      console.log(`[FRONTEND] Deleting superadmin: ${selectedAdmin._id}`);
      const response = await apiClient.delete(`/api/principal/unassign-superadmin/${selectedAdmin._id}`, config);
      console.log(`[FRONTEND] Delete response:`, response.data);

      setDeassignDialog(false);
      fetchDepartments(); // Refresh the list
      alert(`✅ Super Admin (${selectedAdmin.email}) deleted successfully from database`);
    } catch (err) {
      console.error('[FRONTEND] Delete error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to delete Super Admin';
      alert(`❌ Failed to delete Super Admin: ${errorMessage}`);
    } finally {
      setDeassigning(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ padding: '20px', textAlign: 'center' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '20px', maxWidth: '1200px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Principal Dashboard
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ padding: '20px', marginTop: '20px' }}>
        <Typography variant="h6" gutterBottom>
          Department Management
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Department</strong></TableCell>
                <TableCell><strong>Code</strong></TableCell>
                <TableCell><strong>Assigned Super Admins</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept._id}>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>
                    {dept.assignedSuperadmins && dept.assignedSuperadmins.length > 0 ? (
                      dept.assignedSuperadmins.map((admin) => (
                        <Box key={admin._id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip
                            label={admin.email}
                            variant="outlined"
                            sx={{ mr: 1 }}
                          />
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleDeassignSuperAdmin(admin)}
                          >
                            Deassign
                          </Button>
                        </Box>
                      ))
                    ) : (
                      <Typography color="textSecondary">None</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleAssignSuperAdmin(dept)}
                    >
                      Assign Super Admin
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ marginTop: '40px', textAlign: 'center' }}>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </Box>

      {/* Assign Super Admin Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Super Admin</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Assigning to: {selectedDepartment?.name}
          </Typography>

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />

          {assignError && <Alert severity="error" sx={{ mt: 2 }}>{assignError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAssignSubmit}
            variant="contained"
            disabled={assigning}
          >
            {assigning ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deassign Super Admin Dialog */}
      <Dialog open={deassignDialog} onClose={() => setDeassignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deassign Super Admin</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Are you sure you want to deassign <strong>{selectedAdmin?.email}</strong> from their department?
          </Typography>
          <Typography variant="body2" color="warning.main">
            This will remove their Super Admin privileges and department assignment.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeassignDialog(false)}>Cancel</Button>
          <Button
            onClick={handleDeassignConfirm}
            variant="contained"
            color="error"
            disabled={deassigning}
          >
            {deassigning ? 'Deassigning...' : 'Deassign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PrincipalDashboard;