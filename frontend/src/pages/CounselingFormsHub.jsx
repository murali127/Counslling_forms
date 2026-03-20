import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import apiClient from '../apiClient';

const HIGHER_ROLES = ['superadmin', 'principal', 'master'];

const CounselingFormsHub = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('user');
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signup');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const userRes = await apiClient.get('/api/auth/user', config);
      const currentRole = userRes.data?.role || 'user';
      setRole(currentRole);

      if (currentRole === 'user' || currentRole === 'mentor') {
        const selfProfileRes = await apiClient.get('/api/profile', config);
        const profile = selfProfileRes.data?.profile;
        if (!profile?.regdNo) {
          setRows([]);
          setError('Your profile is incomplete. Please complete profile before downloading counseling form.');
          return;
        }
        setRows([
          {
            regdNo: profile.regdNo,
            name: profile.name || userRes.data?.username || profile.regdNo,
            email: profile.email || userRes.data?.email || ''
          }
        ]);
        return;
      }

      // For admin/superadmin/principal/master:
      // admin gets assigned students, higher roles get broader student list from this endpoint.
      const studentsRes = await apiClient.get('/api/admin/users?role=user', config);
      const students = studentsRes.data || [];

      setRows(
        students
          .map((s) => ({
            regdNo: s.username,
            name: s.username,
            email: s.email
          }))
          .filter((s) => s.regdNo)
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load counseling forms list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      String(r.regdNo || '').toLowerCase().includes(q) ||
      String(r.name || '').toLowerCase().includes(q) ||
      String(r.email || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const roleHint =
    role === 'admin'
      ? 'You can view counseling forms only for students assigned to you. Print is available only for users.'
      : HIGHER_ROLES.includes(role)
        ? 'You can view counseling forms for any student. Print is available only for users.'
        : 'You can open and print only your own counseling form.';

  return (
    <Box sx={{ p: 3, maxWidth: '1100px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Counseling Forms
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        {roleHint}
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ mb: 2, maxWidth: '360px' }}>
            <TextField
              fullWidth
              size="small"
              label="Search by Regd No / Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Regd No</b></TableCell>
                  <TableCell><b>Name</b></TableCell>
                  <TableCell><b>Email</b></TableCell>
                  <TableCell><b>Action</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.regdNo}>
                    <TableCell>{row.regdNo}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/counseling-form-download/${row.regdNo}`)}
                      >
                        {role === 'user' || role === 'mentor' ? 'Open / Print' : 'View Form'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No records found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default CounselingFormsHub;
