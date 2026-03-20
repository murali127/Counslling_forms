import React, { useState, useEffect } from 'react';
import apiClient from '../../apiClient';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TablePagination, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const AdminDataOverview = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [mentorGradings, setMentorGradings] = useState([]);
  const [activeYear, setActiveYear] = useState('all'); 
  const [rollSearch, setRollSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return navigate('/login');

      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [profilesRes, mentorGradingsRes] = await Promise.allSettled([
          apiClient.get('/api/admin/profiles', config),
          apiClient.get('/api/admin/mentorgradings', config)
        ]);

        if (profilesRes.status === 'fulfilled') {
          setProfiles(profilesRes.value.data || []);
        }

        if (mentorGradingsRes.status === 'fulfilled') {
          setMentorGradings(mentorGradingsRes.value.data || []);
        }

        const requestErrors = [];
        if (profilesRes.status === 'rejected') {
          requestErrors.push('profiles');
          if (profilesRes.reason?.response?.status === 401 || profilesRes.reason?.response?.status === 403) {
            navigate('/login');
            return;
          }
        }
        if (mentorGradingsRes.status === 'rejected') {
          requestErrors.push('mentor gradings');
          if (mentorGradingsRes.reason?.response?.status === 401 || mentorGradingsRes.reason?.response?.status === 403) {
            navigate('/login');
            return;
          }
        }

        if (requestErrors.length === 2) {
          setError('Failed to fetch data from admin APIs. Please try again.');
        } else if (requestErrors.length === 1) {
          setError(`Loaded partial data. Could not fetch ${requestErrors[0]}.`);
        } else {
          setError('');
        }

        const role = localStorage.getItem('userRole') || localStorage.getItem('role');
        if (role && role !== 'admin' && role !== 'superadmin') {
          setError('You do not have admin privileges');
          navigate('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to fetch data.');
        if (err.response?.status === 401 || err.response?.status === 403) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const filteredProfiles = profiles.filter((p) => {
    const byYear = activeYear === 'all' || p.regdNo?.startsWith(activeYear) || p.email?.startsWith(activeYear);
    const q = rollSearch.trim().toLowerCase();
    const bySearch = !q || p.regdNo?.toLowerCase().includes(q);
    return byYear && bySearch;
  });
  const paginatedProfiles = filteredProfiles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const availablePrefixes = Array.from(
    new Set(
      profiles
        .map((p) => String(p.regdNo || p.email || '').slice(0, 3))
        .filter((prefix) => /^\d{3}$/.test(prefix))
    )
  ).sort((a, b) => Number(b) - Number(a));

  const getYearLabel = (prefix) => {
    const rank = availablePrefixes.indexOf(prefix) + 1;
    if (rank === 1) return '1st Year';
    if (rank === 2) return '2nd Year';
    if (rank === 3) return '3rd Year';
    if (rank === 4) return '4th Year';
    return `Previous Batch (${prefix})`;
  };

  useEffect(() => {
    setPage(0);
  }, [activeYear, rollSearch]);

  if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;

  return (
    <Box sx={{ padding: '20px', maxWidth: '1400px', margin: 'auto' }}>
      <Typography variant="h4" align="center" gutterBottom>Student Data Overview</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 2, display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <Button variant="contained" onClick={() => navigate('/admin')}>Back to Dashboard</Button>
        <Button variant="outlined" onClick={() => navigate('/admin/users')}>Manage Users</Button>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', gap: '10px', justifyContent: 'center' }}>                                                                       
        <Button variant={activeYear === 'all' ? 'contained' : 'outlined'} onClick={() => setActiveYear('all')}>
          All Batches
        </Button>
        {availablePrefixes.map((yr) => (
          <Button key={yr} variant={activeYear === yr ? 'contained' : 'outlined'} onClick={() => setActiveYear(yr)}>
            {getYearLabel(yr)}
          </Button>
        ))}
      </Box>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <TextField
          size="small"
          label="Search by Roll Number"
          value={rollSearch}
          onChange={(e) => setRollSearch(e.target.value)}
          sx={{ width: '320px' }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Regd No</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Overall Grading</b></TableCell>
              <TableCell><b>Print Status</b></TableCell>
              <TableCell><b>Admin Actions</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProfiles.map((profile) => {
              const grading = mentorGradings.find(g => g.email === profile.email);
              const hasGrading = !!grading;
              const overallGrades = grading?.grading?.overallGrading || [];
              
              return (
                <TableRow key={profile._id}>
                  <TableCell>{profile.name}</TableCell>
                  <TableCell>{profile.regdNo}</TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>
                    {overallGrades.length > 0 ? overallGrades.filter(Boolean).join(', ') : 'Pending'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="small"
                      disabled={!profile.regdNo}
                      onClick={() => {
                        if (!profile.regdNo) return;
                        navigate(`/admin/consolidated-form/${profile.regdNo}`);
                      }}
                    >
                      Print Form
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap="10px">
                        <Button variant="outlined" color="primary" size="small" onClick={() => navigate(`/mentorgrade/${profile.regdNo}@gvpce.ac.in`)}>
                          {hasGrading ? 'Edit Grading' : 'Add Grading'}
                        </Button>
                        <Button variant="outlined" color="warning" size="small" onClick={() => navigate(`/semester/${profile.regdNo}@gvpce.ac.in`)}>
                        Edit Marks
                      </Button>
                      <Button variant="outlined" color="success" size="small" onClick={() => navigate(`/attendance/${profile.regdNo}@gvpce.ac.in`)}>
                        Attendance
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredProfiles.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center">No students found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filteredProfiles.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </TableContainer>
    </Box>
  );
};
export default AdminDataOverview;
