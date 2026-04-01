import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  Checkbox,
  TablePagination,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';

const MentorAllocation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mentors, setMentors] = useState([]);
  const [unassignedStudents, setUnassignedStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [allocationMode, setAllocationMode] = useState('manual');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [randomCount, setRandomCount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const years = [
    { label: 'All Years', value: 'all' },
    { label: 'Year 1', value: 1 },
    { label: 'Year 2', value: 2 },
    { label: 'Year 3', value: 3 },
    { label: 'Year 4', value: 4 }
  ];

  const fetchData = useCallback(async () => {
    console.debug('[MentorAllocation] fetchData called');
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        navigate('/signup');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [mentorRes, unassignedRes, allRes] = await Promise.all([
        apiClient.get('/api/superadmin/mentors-with-students', config),
        apiClient.get('/api/superadmin/unassigned-students', config),
        apiClient.get('/api/superadmin/students', config)
      ]);

      setMentors(mentorRes.data);
      setUnassignedStudents(unassignedRes.data);
      setAllStudents(allRes.data);
    } catch (err) {
      console.error('[MentorAllocation] Error fetching data:', err);
      console.error('[MentorAllocation] Error response:', err.response);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        navigate('/signup');
      } else if (err.response?.status === 403) {
        setError('Access denied. Super admin privileges required.');
        navigate('/dashboard');
      } else {
        setError(`Failed to load data: ${err.response?.data?.error || err.message || 'Unknown error'}`);
      }
      if (err.response?.status === 401 || err.response?.status === 403) navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deriveYearFromRoll = (roll) => {
    const prefix = String(roll || '').slice(0, 3);
    if (!/^[0-9]{3}$/.test(prefix)) return undefined;
    // Use second+third digit (e.g. 22 => 2022) and map to year 1..4 by rank
    const year = Number(prefix.slice(1, 3));
    if (Number.isNaN(year)) return undefined;
    // Simple fallback: return 1..4 based on common admission prefixes (assuming valid range)
    if (year > 0 && year <= 99) return ((year - 1) % 4) + 1;
    return undefined;
  };

  // Filter unassigned students by selected year and search
  const filteredStudents = unassignedStudents.filter(student => {
    const studentYear = student.yearOfStudy || deriveYearFromRoll(student.username);
    const matchesYear = selectedYear === 'all' || studentYear === selectedYear;
    const matchesSearch = !searchQuery ||
      student.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesYear && matchesSearch;
  });

  const paginatedStudents = filteredStudents.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Filter assigned students for selected mentor and year
  const assignedStudents = allStudents.filter(student => {
    const studentYear = student.yearOfStudy || deriveYearFromRoll(student.username);
    return student.assignedMentor === selectedMentor && (selectedYear === 'all' || studentYear === selectedYear);
  });

  const handleSelectStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedStudents(checked ? filteredStudents.map(s => s._id) : []);
  };

  const handleManualAssign = async () => {
    if (!selectedMentor) {
      setError('Please select a mentor first.');
      return;
    }
    if (selectedStudents.length === 0) {
      setError('Please select at least one student.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      await apiClient.post('/api/superadmin/assign-students', {
        mentorId: selectedMentor,
        studentIds: selectedStudents
      }, { headers: { Authorization: `Bearer ${token}` } });

      setSuccess(`Successfully assigned ${selectedStudents.length} students.`);
      setSelectedStudents([]);
      setSearchQuery('');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to assign students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRandomAssign = async () => {
    if (!selectedMentor) {
      setError('Please select a mentor first.');
      return;
    }
    const count = parseInt(randomCount);
    if (!count || count <= 0) {
      setError('Please enter a valid number of students.');
      return;
    }
    if (count > filteredStudents.length) {
      setError(`Only ${filteredStudents.length} students available for Year ${selectedYear}.`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const shuffled = [...filteredStudents].sort(() => 0.5 - Math.random());
      const selectedIds = shuffled.slice(0, count).map(s => s._id);

      const token = localStorage.getItem('authToken');
      await apiClient.post('/api/superadmin/assign-students', {
        mentorId: selectedMentor,
        studentIds: selectedIds
      }, { headers: { Authorization: `Bearer ${token}` } });

      setSuccess(`Successfully randomly assigned ${count} students.`);
      setRandomCount('');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to assign students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async (studentId) => {
    if (!window.confirm('Are you sure you want to unassign this student?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      await apiClient.post('/api/superadmin/unassign-students', {
        studentIds: [studentId]
      }, { headers: { Authorization: `Bearer ${token}` } });

      setSuccess('Student unassigned successfully.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to unassign student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && mentors.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3, maxWidth: '1400px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 1, fontWeight: 'bold' }}>
        Mentor/Admin Allocation Dashboard
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
        Allocate unassigned students to mentors either manually or randomly. Follow the steps below.
      </Typography>
      <Button
        onClick={() => navigate('/superadmin/dashboard')}
        variant="outlined"
        sx={{ mb: 3 }}
      >
        Back to Dashboard
      </Button>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {/* Progress Steps */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: 'rgba(71,85,105,0.18)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(129,140,248,0.85)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>1</Box>
            <Typography variant="body2">Select Mentor</Typography>
          </Box>
          <Typography variant="body2">→</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(129,140,248,0.85)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>2</Box>
            <Typography variant="body2">Select Year</Typography>
          </Box>
          <Typography variant="body2">→</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(129,140,248,0.85)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>3</Box>
            <Typography variant="body2">Choose Mode & Allocate</Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Mentor Selection and Assigned Students */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(129,140,248,0.85)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>1</Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Select Mentor/Admin
              </Typography>
            </Box>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Mentor/Admin</InputLabel>
              <Select
                value={selectedMentor}
                label="Mentor/Admin"
                onChange={(e) => setSelectedMentor(e.target.value)}
              >
                {mentors.map(mentor => (
                  <MenuItem key={mentor._id} value={mentor._id}>
                    {mentor.username} ({mentor.assignedStudentsCount} students assigned)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedMentor && (
              <>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Assigned Students {selectedYear === 'all' ? '(All Years)' : `(Year ${selectedYear})`}
                </Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 1, p: 1 }}>
                  {assignedStudents.length > 0 ? (
                    assignedStudents.map(student => (
                      <Box
                        key={student._id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 1,
                          borderBottom: '1px solid #eee',
                          '&:last-child': { borderBottom: 'none' }
                        }}
                      >
                        <Typography variant="body2">
                          {student.username} - {student.email}
                        </Typography>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleUnassign(student._id)}
                        >
                          Unassign
                        </Button>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No students assigned {selectedYear === 'all' ? 'in any year' : `for Year ${selectedYear}`}
                    </Typography>
                  )}
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        {/* Allocation Modes */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(129,140,248,0.85)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>2</Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Select Year
              </Typography>
            </Box>

            {/* Year Selection */}
            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
              {years.map(year => (
                <Button
                  key={year.value}
                  variant={selectedYear === year.value ? 'contained' : 'outlined'}
                  onClick={() => setSelectedYear(year.value)}
                  sx={{ minWidth: 100 }}
                >
                  {year.label}
                </Button>
              ))}
            </Box>

            {/* Step 3 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, mt: 4 }}>
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: 'rgba(129,140,248,0.85)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 14 }}>3</Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                Choose Allocation Mode
              </Typography>
            </Box>

            {/* Allocation Mode Tabs */}
            <Tabs
              value={allocationMode}
              onChange={(_, newValue) => setAllocationMode(newValue)}
              sx={{ mb: 3 }}
            >
              <Tab label="Manual Allocation" value="manual" />
              <Tab label="Random Allocation" value="random" />
            </Tabs>

            {allocationMode === 'manual' ? (
              <>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Manually select and assign students to the selected mentor/admin
                </Typography>
                {/* Search */}
                <TextField
                  fullWidth
                  label="Search by roll number or email"
                  placeholder="e.g., 113001 or student@email.com"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ mb: 2 }}
                />

                {/* Student List */}
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Unassigned Students (Year {selectedYear === 'all' ? 'All' : selectedYear}): {filteredStudents.length}
                </Typography>

                {filteredStudents.length === 0 ? (
                  <Alert severity="info">No unassigned students found for Year {selectedYear === 'all' ? 'All' : selectedYear}</Alert>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Selected: <strong>{selectedStudents.length}</strong> students
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleManualAssign}
                        disabled={selectedStudents.length === 0 || loading || !selectedMentor}
                        color="success"
                      >
                        Allocate Selected ({selectedStudents.length})
                      </Button>
                    </Box>

                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: 'rgba(71,85,105,0.22)' }}>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                                indeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
                                onChange={(e) => handleSelectAll(e.target.checked)}
                              />
                            </TableCell>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Roll Number</strong></TableCell>
                            <TableCell><strong>Department</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedStudents.map(student => (
                            <TableRow key={student._id} hover>
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedStudents.includes(student._id)}
                                  onChange={() => handleSelectStudent(student._id)}
                                />
                              </TableCell>
                              <TableCell>{student.username}</TableCell>
                              <TableCell>{student.email.split('@')[0]}</TableCell>
                              <TableCell>{student.profile?.department || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <TablePagination
                      component="div"
                      count={filteredStudents.length}
                      page={page}
                      onPageChange={(_, newPage) => setPage(newPage)}
                      rowsPerPage={rowsPerPage}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      rowsPerPageOptions={[10, 25, 50]}
                    />
                  </>
                )}
              </>
            ) : (
              <>
                {/* Random Allocation */}
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Randomly assign the specified number of unassigned students to the selected mentor/admin
                </Typography>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Random Allocation for Year {selectedYear === 'all' ? 'All' : selectedYear}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Available unassigned students: <strong>{filteredStudents.length}</strong>
                </Typography>

                <TextField
                  fullWidth
                  type="number"
                  label="Number of Students to Allocate Randomly"
                  placeholder="Enter number e.g., 10"
                  value={randomCount}
                  onChange={(e) => setRandomCount(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ min: 1, max: filteredStudents.length }}
                />

                <Button
                  variant="contained"
                  color="success"
                  onClick={handleRandomAssign}
                  disabled={!randomCount || loading || !selectedMentor}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  Randomly Allocate {randomCount || 0} Students to {selectedMentor ? 'Selected Mentor' : 'Mentor (Select one first)'}
                </Button>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MentorAllocation;