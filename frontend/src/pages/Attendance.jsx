import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import apiClient from '../apiClient';

const ODD_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const EVEN_MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const monthsForSemester = (sem) => (Number(sem) % 2 === 1 ? ODD_MONTHS : EVEN_MONTHS);

const getSemEntry = (attendance, semNumber) => {
  const semKey = String(semNumber);
  return (attendance || []).find((entry) => String(entry.semester) === semKey);
};

const getMonthPercentage = (semEntry, month) => {
  if (!semEntry || !semEntry.months) return '';
  const monthObj = semEntry.months[month];
  if (!monthObj || monthObj.percentage === undefined || monthObj.percentage === null) return '';
  return monthObj.percentage;
};

const semAverage = (semEntry) => {
  if (!semEntry || !semEntry.months) return '';
  const values = Object.values(semEntry.months)
    .map((v) => Number(v?.percentage))
    .filter((v) => !Number.isNaN(v));
  if (values.length === 0) return '';
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return avg.toFixed(1);
};

const buildDraftFromAttendance = (attendance = []) => {
  const draft = {};
  for (const sem of SEMESTERS) {
    const semKey = String(sem);
    const semEntry = getSemEntry(attendance, sem);
    draft[semKey] = {};
    for (const month of monthsForSemester(sem)) {
      draft[semKey][month] = getMonthPercentage(semEntry, month);
    }
  }
  return draft;
};

const Attendance = () => {
  const navigate = useNavigate();
  const { email: emailParam } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [role, setRole] = useState('user');
  const [students, setStudents] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(emailParam || '');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [attendanceDraft, setAttendanceDraft] = useState({});

  const isManager = ['admin', 'superadmin', 'principal', 'master'].includes(role);

  const fetchProfileForStudent = async (student) => {
    if (!student?.username) return;
    const token = localStorage.getItem('authToken');
    const res = await apiClient.get(`/api/profile/${student.username}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const nextProfile = res.data?.profile || null;
    setProfile(nextProfile);
    setAttendanceDraft(buildDraftFromAttendance(nextProfile?.attendance || []));
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/signup');
        return;
      }

      const userRes = await apiClient.get('/api/auth/user', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const currentRole = userRes.data?.role || 'user';
      setRole(currentRole);

      if (['admin', 'superadmin', 'principal', 'master'].includes(currentRole)) {
        const studentsRes = await apiClient.get('/api/admin/users?role=user', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const list = studentsRes.data || [];
        setStudents(list);

        let target = null;
        if (emailParam) {
          target = list.find((s) => String(s.email).toLowerCase() === String(emailParam).toLowerCase()) || null;
          setSelectedEmail(emailParam);
        }
        if (!target && list.length > 0) {
          target = list[0];
          setSelectedEmail(list[0].email);
        }
        setSelectedStudent(target);

        if (target) {
          await fetchProfileForStudent(target);
        } else {
          setProfile(null);
        }
      } else {
        const selfProfile = await apiClient.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const nextProfile = selfProfile.data?.profile || null;
        setProfile(nextProfile);
        setAttendanceDraft(buildDraftFromAttendance(nextProfile?.attendance || []));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailParam]);

  const handleStudentChange = async (nextEmail) => {
    setSelectedEmail(nextEmail);
    setError('');
    setSuccess('');
    const nextStudent = students.find((s) => s.email === nextEmail) || null;
    setSelectedStudent(nextStudent);
    if (nextStudent) {
      try {
        await fetchProfileForStudent(nextStudent);
      } catch (err) {
        setProfile(null);
        setError(err.response?.data?.error || 'Failed to load selected student profile');
      }
    } else {
      setProfile(null);
    }
  };

  const handleDraftChange = (sem, month, value) => {
    const semKey = String(sem);
    setAttendanceDraft((prev) => ({
      ...prev,
      [semKey]: {
        ...(prev[semKey] || {}),
        [month]: value
      }
    }));
  };

  const handleSaveSemester = async (sem) => {
    if (!selectedStudent?._id) {
      setError('Please select a student');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const token = localStorage.getItem('authToken');

      const semKey = String(sem);
      const targetMonths = monthsForSemester(sem);
      const updates = targetMonths
        .map((month) => ({ month, raw: attendanceDraft?.[semKey]?.[month] }))
        .filter((item) => item.raw !== '' && item.raw !== null && item.raw !== undefined);

      if (updates.length === 0) {
        setError('Please enter at least one month value before saving this semester.');
        return;
      }

      for (const item of updates) {
        const value = Number(item.raw);
        if (Number.isNaN(value) || value < 0 || value > 100) {
          setError(`Invalid percentage for ${item.month}. Please enter value between 0 and 100.`);
          return;
        }

        await apiClient.patch('/api/profile/attendance', {
          userId: selectedStudent._id,
          semester: semKey,
          month: item.month,
          percentage: value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      await fetchProfileForStudent(selectedStudent);
      setSuccess(`Semester ${semKey} attendance updated successfully`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  const semesterRows = useMemo(() => {
    const attendance = profile?.attendance || [];
    return SEMESTERS.map((sem) => {
      const semEntry = getSemEntry(attendance, sem);
      const months = monthsForSemester(sem);
      return {
        sem,
        months,
        values: months.map((m) => getMonthPercentage(semEntry, m)),
        avg: semAverage(semEntry)
      };
    });
  }, [profile]);

  const oddRows = semesterRows.filter((r) => Number(r.sem) % 2 === 1);
  const evenRows = semesterRows.filter((r) => Number(r.sem) % 2 === 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Attendance Record
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        {isManager && <Button variant="outlined" onClick={() => navigate('/admin/data')}>Back to Data Overview</Button>}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {isManager && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Manage Student Attendance</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Student</InputLabel>
              <Select
                value={selectedEmail}
                label="Student"
                onChange={(e) => handleStudentChange(e.target.value)}
              >
                {students.map((s) => (
                  <MenuItem key={s._id} value={s.email}>{s.username} ({s.email})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            Odd Semesters (Jun to Nov)
          </Typography>

          <TableContainer sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Semester</b></TableCell>
                  {ODD_MONTHS.map((m) => <TableCell key={`odd-head-${m}`}><b>{m}</b></TableCell>)}
                  <TableCell><b>Action</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[1, 3, 5, 7].map((sem) => (
                  <TableRow key={`odd-row-${sem}`}>
                    <TableCell>{`Semester ${sem}`}</TableCell>
                    {ODD_MONTHS.map((m) => (
                      <TableCell key={`odd-${sem}-${m}`}>
                        <TextField
                          size="small"
                          type="number"
                          value={attendanceDraft?.[String(sem)]?.[m] ?? ''}
                          onChange={(e) => handleDraftChange(sem, m, e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                          sx={{ width: '90px' }}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="contained" size="small" disabled={saving} onClick={() => handleSaveSemester(sem)}>
                        Save Sem {sem}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle1" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
            Even Semesters (Dec to May)
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Semester</b></TableCell>
                  {EVEN_MONTHS.map((m) => <TableCell key={`even-head-${m}`}><b>{m}</b></TableCell>)}
                  <TableCell><b>Action</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[2, 4, 6, 8].map((sem) => (
                  <TableRow key={`even-row-${sem}`}>
                    <TableCell>{`Semester ${sem}`}</TableCell>
                    {EVEN_MONTHS.map((m) => (
                      <TableCell key={`even-${sem}-${m}`}>
                        <TextField
                          size="small"
                          type="number"
                          value={attendanceDraft?.[String(sem)]?.[m] ?? ''}
                          onChange={(e) => handleDraftChange(sem, m, e.target.value)}
                          inputProps={{ min: 0, max: 100 }}
                          sx={{ width: '90px' }}
                        />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="contained" size="small" disabled={saving} onClick={() => handleSaveSemester(sem)}>
                        Save Sem {sem}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Semester-wise Attendance View
        </Typography>

        {!profile ? (
          <Alert severity="info">No profile found yet for this student.</Alert>
        ) : (
          <>
          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Odd Semesters (Jun to Nov)</Typography>
          <TableContainer sx={{ mb: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Semester</b></TableCell>
                  {ODD_MONTHS.map((m) => <TableCell key={`odd-view-${m}`}><b>{m}</b></TableCell>)}
                  <TableCell><b>Average</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {oddRows.map((row) => (
                  <TableRow key={`odd-view-row-${row.sem}`}>
                    <TableCell><b>{`Semester ${row.sem}`}</b></TableCell>
                    {row.values.map((v, idx) => <TableCell key={`odd-view-${row.sem}-${idx}`}>{v === '' ? '-' : `${v}%`}</TableCell>)}
                    <TableCell>{row.avg === '' ? '-' : `${row.avg}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>Even Semesters (Dec to May)</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>Semester</b></TableCell>
                  {EVEN_MONTHS.map((m) => <TableCell key={`even-view-${m}`}><b>{m}</b></TableCell>)}
                  <TableCell><b>Average</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evenRows.map((row) => (
                  <TableRow key={`even-view-row-${row.sem}`}>
                    <TableCell><b>{`Semester ${row.sem}`}</b></TableCell>
                    {row.values.map((v, idx) => <TableCell key={`even-view-${row.sem}-${idx}`}>{v === '' ? '-' : `${v}%`}</TableCell>)}
                    <TableCell>{row.avg === '' ? '-' : `${row.avg}%`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Attendance;
